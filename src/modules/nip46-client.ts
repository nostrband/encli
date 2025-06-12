import { bytesToHex, randomBytes } from "@noble/hashes/utils";
import {
  Event,
  UnsignedEvent,
  generateSecretKey,
  getPublicKey,
  validateEvent,
  verifyEvent,
} from "nostr-tools";
import { KIND_NIP46 } from "./consts";
import { Nip44 } from "./nip44";
import { now } from "./utils";
import { Signer } from "./types";
import fs from "node:fs";
import { Client } from "./client";

const nip44 = new Nip44();

export class Nip46Client extends Client implements Signer {
  private perms: string;
  private filename?: string;
  private userPubkey?: string;
  private secret?: string;

  constructor({
    bunkerUrl,
    relayUrl,
    perms = "",
    filename,
    signerPubkey,
    privkey,
    secret,
  }: {
    bunkerUrl?: string;
    relayUrl?: string;
    perms?: string;
    filename?: string;
    signerPubkey?: string;
    privkey?: Uint8Array;
    secret?: string;
  }) {
    const burl = bunkerUrl ? new URL(bunkerUrl) : undefined;
    if (!relayUrl && !burl) throw new Error("Provide relay url or bunker url");
    if (!relayUrl) {
      relayUrl = burl!.searchParams.get("relay") || "";
      if (!relayUrl) throw new Error("Bunker url has no relay");
    }
    if (!secret && burl) {
      secret = burl.searchParams.get("secret") || undefined;
    }
    if (!signerPubkey && burl) {
      signerPubkey = burl.hostname || burl.pathname.split("//")[1];
    }

    super({ relayUrl, kind: KIND_NIP46, signerPubkey, privkey });
    this.perms = perms;
    this.filename = filename;
    this.secret = secret;
  }

  private async nostrconnect() {
    const secret = bytesToHex(randomBytes(16));
    const nostrconnect = `nostrconnect://${getPublicKey(this.privkey!)}?relay=${
      this.relay.url
    }&perms=${this.perms}&name=encli&secret=${secret}`;
    console.log("Connect using this string:");
    console.log(nostrconnect);

    return new Promise<void>((ok) => {
      const onEvent = (e: Event) => {
        const {
          id: replyId,
          result,
          error,
        } = JSON.parse(nip44.decrypt(this.privkey!, e.pubkey, e.content));
        console.log("nostrconnect reply", { replyId, result, error });
        if (result === secret) {
          console.log("connected to", e.pubkey);
          this.signerPubkey = e.pubkey;
          ok();
        }
      };

      this.relay.req({
        fetch: false,
        id: bytesToHex(randomBytes(6)),
        filter: {
          kinds: [this.kind],
          "#p": [getPublicKey(this.privkey!)],
          since: now() - 10,
        },
        onEvent,
      });
    });
  }

  private ensureReadFile() {
    if (this.filename && !this.privkey) {
      try {
        const data = fs.readFileSync(this.filename).toString("utf8");
        const { csk, spk } = JSON.parse(data);
        if (csk && spk) {
          this.privkey = Buffer.from(csk, "hex");
          this.signerPubkey = spk;
        }
      } catch {}
    }
  }

  public async start() {
    this.ensureReadFile();
    if (!this.signerPubkey) throw new Error("Login please");
    this.subscribe();
  }

  public async login() {
    this.ensureReadFile();

    this.privkey = generateSecretKey();
    if (this.signerPubkey) {
      const ack = await this.send({
        method: "connect",
        params: [this.signerPubkey, this.secret || "", this.perms],
      });
      if (ack !== "ack") throw new Error("Failed to connect");
    } else {
      await this.nostrconnect();
    }

    if (this.filename) {
      fs.writeFileSync(
        this.filename,
        JSON.stringify({
          csk: bytesToHex(this.privkey!),
          spk: this.signerPubkey,
        })
      );
    }
  }

  public logout() {
    if (this.filename) fs.rmSync(this.filename);
    this.privkey = undefined;
  }

  async getPublicKey(): Promise<string> {
    if (this.userPubkey) return this.userPubkey;

    const pk = await this.send({
      method: "get_public_key",
      params: [],
    });
    if (pk.length !== 64) throw new Error("Invalid pubkey");
    this.userPubkey = pk;
    return pk;
  }
  async nip04Decrypt(pubkey: string, data: string): Promise<string> {
    return await this.send({
      method: "nip04_decrypt",
      params: [pubkey, data],
    });
  }
  async nip04Encrypt(pubkey: string, data: string): Promise<string> {
    return await this.send({
      method: "nip04_encrypt",
      params: [pubkey, data],
    });
  }
  async nip44Decrypt(pubkey: string, data: string): Promise<string> {
    return await this.send({
      method: "nip44_decrypt",
      params: [pubkey, data],
    });
  }
  async nip44Encrypt(pubkey: string, data: string): Promise<string> {
    return await this.send({
      method: "nip44_encrypt",
      params: [pubkey, data],
    });
  }
  async signEvent(event: UnsignedEvent): Promise<Event> {
    const reply = await this.send({
      method: "sign_event",
      params: [JSON.stringify(event)],
    });
    const signed = JSON.parse(reply);
    if (!validateEvent(signed) || !verifyEvent(signed))
      throw new Error("Invalid event signed");
    return signed;
  }
}
