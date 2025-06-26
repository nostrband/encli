import { bytesToHex, randomBytes } from "@noble/hashes/utils";
import { Event, finalizeEvent, getPublicKey } from "nostr-tools";
import { Relay } from "./relay";
import { Nip44 } from "./nip44";
import { now } from "./utils";

const nip44 = new Nip44();

export class Client {
  protected kind: number;
  protected relay: Relay;
  protected signerPubkey?: string;
  private subId?: string;

  protected privkey?: Uint8Array;
  private pending = new Map<
    string,
    {
      ok: (result: string) => void;
      err: (e: any) => void;
      timer: any;
    }
  >();

  constructor({
    relayUrl,
    kind,
    signerPubkey,
    privkey,
  }: {
    relayUrl: string;
    kind: number;
    signerPubkey?: string;
    privkey?: Uint8Array;
  }) {
    this.kind = kind;
    this.relay = new Relay(relayUrl);
    this.signerPubkey = signerPubkey;
    this.privkey = privkey;
  }

  public [Symbol.dispose]() {
    this.relay[Symbol.dispose]();
    for (const { timer } of this.pending.values()) clearTimeout(timer);
    this.pending.clear();
  }

  public getRelay() {
    return this.relay;
  }

  public async getPublicKey() {
    return Promise.resolve(getPublicKey(this.privkey!));
  }

  public async send({
    method,
    params,
    timeout = 30000,
  }: {
    method: string;
    params: any;
    timeout?: number;
  }) {
    if (!this.privkey || !this.signerPubkey) throw new Error("Not started");

    const req = {
      id: bytesToHex(randomBytes(6)),
      method,
      params,
    };
    console.log("request", req);

    const event = finalizeEvent(
      {
        created_at: Math.floor(Date.now() / 1000),
        kind: this.kind,
        content: nip44.encrypt(
          this.privkey,
          this.signerPubkey,
          JSON.stringify(req)
        ),
        tags: [["p", this.signerPubkey]],
      },
      this.privkey
    );
    console.log("sending", event);
    await this.relay.publish(event);

    return new Promise<string>((ok, err) => {
      const timer = setTimeout(() => {
        const cbs = this.pending.get(req.id);
        if (cbs) {
          this.pending.delete(req.id);
          cbs.err("Request timeout");
        }
      }, timeout);
      this.pending.set(req.id, { ok, err, timer });
    });
  }

  private onReplyEvent(e: Event) {
    const data = nip44.decrypt(this.privkey!, this.signerPubkey!, e.content);
    const { id, result, error } = JSON.parse(data);
    console.log("reply", { id, result, error });

    // context
    const cbs = this.pending.get(id);
    console.log("cbs", id, cbs, data, e);

    // already replied?
    if (!cbs) return;

    // nip46-specific stuff
    if (result === "auth_url") {
      console.log("Open auth url: ", error);
      return;
    }

    // done
    this.pending.delete(id);
    clearTimeout(cbs.timer);
    if (error) cbs.err(error);
    else cbs.ok(result);
  }

  protected subscribe() {
    this.subId = bytesToHex(randomBytes(6));
    this.relay.req({
      fetch: false,
      id: this.subId,
      filter: {
        kinds: [this.kind],
        authors: [this.signerPubkey!],
        "#p": [getPublicKey(this.privkey!)],
        since: now() - 10,
      },
      onEvent: this.onReplyEvent.bind(this),
    });
  }

  protected unsubscribe() {
    if (this.subId) {
      this.relay.close(this.subId);
    }
    this.subId = undefined;
  }
}
