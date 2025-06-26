import { fetchFromRelays } from "./nostr";
import {
  KEYCRUX_RELEASE_SIGNERS,
  KEYCRUX_REPO,
  KIND_ANNOUNCEMENT,
  KIND_KEYCRUX_RPC,
  SEARCH_RELAY,
} from "./consts";
// @ts-ignore
import { Validator } from "nostr-enclaves";
import { Event, Filter } from "nostr-tools";
import { now } from "./utils";
import { Client } from "./client";

export async function validateKeycrux(e: Event) {
  const validator = new Validator({
    expectedRelease: {
      ref: KEYCRUX_REPO,
      signerPubkeys: KEYCRUX_RELEASE_SIGNERS,
    },
  });
  try {
    return await validator.validateInstance(e);
  } catch (err) {
    console.log("Invalid attestation of ", e.pubkey, e.id);
    return false;
  }
}

export async function fetchKeycruxServices(
  pubkey?: string,
  relayUrl: string = SEARCH_RELAY
) {
  const filter: Filter = {
    kinds: [KIND_ANNOUNCEMENT],
    "#r": [KEYCRUX_REPO],
    since: now() - 3 * 3600,
  };
  if (pubkey) filter["#p"] = [pubkey];

  const services = await fetchFromRelays(filter, [relayUrl]);
  if (!services.length) return [];

  const valid = new Map<string, Event>();
  for (const s of services) {
    if (valid.has(s.pubkey) && valid.get(s.pubkey)!.created_at > s.created_at)
      continue;
    if (await validateKeycrux(s)) valid.set(s.pubkey, s);
  }

  return [...valid.values()];
}

export async function fetchKeycruxService(
  pubkey: string,
  relayUrl: string = SEARCH_RELAY
) {
  const filter: Filter = {
    authors: [pubkey],
    kinds: [KIND_ANNOUNCEMENT],
    "#r": [KEYCRUX_REPO],
    since: now() - 3 * 3600,
  };

  const services = await fetchFromRelays(filter, [relayUrl]);
  // console.log("services", services, "filter", filter, "relay", relayUrl);
  if (!services.length) return undefined;

  const s = services[0];
  if (!(await validateKeycrux(s))) throw new Error("Invalid service");

  return s;
}

export class KeycruxClient extends Client {
  constructor({
    relayUrl,
    signerPubkey,
    privkey,
  }: {
    relayUrl: string;
    signerPubkey: string;
    privkey?: Uint8Array;
  }) {
    super({ relayUrl, kind: KIND_KEYCRUX_RPC, signerPubkey, privkey });
  }

  public async start() {
    this.subscribe();
  }

  public async ping() {
    const start = Date.now();
    const reply = await this.send({
      method: "ping",
      params: [],
    });
    if (reply !== "pong") throw new Error("Invalid reply");
    console.log("pinged in", Date.now() - start, "ms");
  }
}
