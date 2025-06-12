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
  private userPubkey?: string;

  static async login({
    bunkerUrl,
    relayUrl,
    filename,
    perms,
  }: {
    filename: string;
    bunkerUrl?: string;
    relayUrl?: string;
    perms?: string;
  }) {
    const burl = bunkerUrl ? new URL(bunkerUrl) : undefined;
    if (!relayUrl && !burl) throw new Error("Provide relay url or bunker url");
    if (!relayUrl) {
      relayUrl = burl!.searchParams.get("relay") || "";
      if (!relayUrl) throw new Error("Bunker url has no relay");
    }
    const secret = burl?.searchParams.get("secret") || undefined;
    let signerPubkey =
      burl?.hostname || burl?.pathname.split("//")[1] || undefined;
    const privkey = generateSecretKey();

    using client = new Nip46Client({
      relayUrl,
      signerPubkey,
      privkey,
    });

    if (signerPubkey) {
      await client.connect(secret || "", perms);
    } else {
      signerPubkey = await client.nostrconnect(perms);
    }

    fs.writeFileSync(
      filename,
      JSON.stringify({
        csk: bytesToHex(privkey!),
        spk: signerPubkey,
        url: client.relay.url,
      })
    );

    client.subscribe();
    const pubkey = await client.getPublicKey();
    client.unsubscribe();

    return pubkey;
  }

  static logout(filename: string) {
    fs.rmSync(filename);
  }

  static fromFile(filename: string) {
    try {
      const data = fs.readFileSync(filename).toString("utf8");
      const { csk, spk, url } = JSON.parse(data);
      if (csk && spk && url) {
        return new Nip46Client({
          privkey: Buffer.from(csk, "hex"),
          signerPubkey: spk,
          relayUrl: url,
        });
      }
    } catch {}
    throw new Error("Login please");
  }

  constructor({
    relayUrl,
    signerPubkey,
    privkey,
  }: {
    relayUrl?: string;
    signerPubkey?: string;
    privkey?: Uint8Array;
  }) {
    if (!relayUrl) throw new Error("Provide relay url");
    if (!privkey) throw new Error("Provide signer privkey");
    super({ relayUrl, kind: KIND_NIP46, signerPubkey, privkey });
  }

  private async connect(secret: string, perms?: string) {
    const ack = await this.send({
      method: "connect",
      params: [this.signerPubkey, secret, perms || ""],
    });
    if (ack !== "ack") throw new Error("Failed to connect");
  }

  private async nostrconnect(perms?: string) {
    const secret = bytesToHex(randomBytes(16));
    const nostrconnect = `nostrconnect://${getPublicKey(this.privkey!)}?relay=${
      this.relay.url
    }&perms=${perms || ""}&name=encli&secret=${secret}`;
    console.log("Connect using this string:");
    console.log(nostrconnect);

    return new Promise<string>((ok) => {
      const subId = bytesToHex(randomBytes(6));
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
          this.relay.close(subId);
          ok(this.signerPubkey);
        }
      };

      this.relay.req({
        fetch: false,
        id: subId,
        filter: {
          kinds: [this.kind],
          "#p": [getPublicKey(this.privkey!)],
          since: now() - 10,
        },
        onEvent,
      });
    });
  }

  public async start() {
    // this.ensureReadFile();
    if (!this.signerPubkey) throw new Error("Login please");
    this.subscribe();
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
