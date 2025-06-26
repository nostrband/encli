import { Event, Filter, UnsignedEvent } from "nostr-tools";
import { Signer } from "./types";
import { ENCLAVED_RELAY, KIND_RELAYS } from "./consts";
import { now } from "./utils";
import { Relay, Req } from "./relay";
import { bytesToHex } from "@noble/hashes/utils";
import { randomBytes } from "crypto";

export const DEFAULT_RELAYS = [
  "wss://relay.damus.io",
  "wss://relay.primal.net",
  "wss://nostr.mom",
  ENCLAVED_RELAY,
];

export const OUTBOX_RELAYS = [
  "wss://relay.primal.net",
  "wss://relay.nostr.band",
  "wss://purplepag.es",
  "wss://user.kindpag.es",
  "wss://relay.nos.social",
];

export async function publish(event: Event, relays?: string[]) {
  console.log("publishing", JSON.stringify(event), relays);
  const promises = (relays || DEFAULT_RELAYS).map((r) => {
    const relay = new Relay(r);
    return relay.publish(event).finally(() => relay[Symbol.dispose]());
  });
  const results = await Promise.allSettled(promises);
  if (!results.find((r) => r.status === "fulfilled"))
    throw new Error("Failed to publish");
  return event;
}

export async function signPublish(
  event: UnsignedEvent,
  signer: Signer,
  relays?: string[]
) {
  const signed = await signer.signEvent(event);
  return await publish(signed, relays);
}

export async function publishNip65Relays(signer: Signer, relays?: string[]) {
  const tmpl: UnsignedEvent = {
    pubkey: await signer.getPublicKey(),
    kind: KIND_RELAYS,
    created_at: now(),
    content: "",
    tags: (relays || DEFAULT_RELAYS).map((r) => ["r", r]),
  };

  const event = await signPublish(tmpl, signer, OUTBOX_RELAYS);
  console.log("published outbox relays", event, OUTBOX_RELAYS);
}

export async function fetchFromRelays(
  filter: Filter,
  relayUrls: string[],
  timeout = 10000
) {
  const relays = relayUrls.map((r) => new Relay(r));
  const reqs = relays.map(
    (r) =>
      new Promise<Event[]>((ok, err) => {
        const timer = setTimeout(() => err("Timeout"), timeout);
        r.req({
          id: bytesToHex(randomBytes(6)),
          fetch: true,
          filter,
          onEOSE(events) {
            clearTimeout(timer);
            ok(events);
          },
        });
      })
  );
  const results = await Promise.allSettled(reqs);
  for (const r of relays) r[Symbol.dispose]();
  const events = results
    .filter((r) => r.status === "fulfilled")
    .map((r) => (r as PromiseFulfilledResult<Event[]>).value)
    .flat();
  const ids = new Set<string>();
  const uniq = events.filter((e) => {
    const has = ids.has(e.id);
    ids.add(e.id);
    return !has;
  });
  return uniq;
}

export async function fetchReplaceableEvent(
  pubkey: string,
  kind: number,
  relays?: string[]
) {
  let event: Event | undefined;
  const makeReq = (ok: () => void): Req => {
    return {
      id: bytesToHex(randomBytes(6)),
      fetch: true,
      filter: {
        kinds: [kind],
        authors: [pubkey],
        limit: 1,
      },
      onEOSE(events) {
        for (const e of events) {
          if (!event || event.created_at < e.created_at) event = e;
        }
        ok();
      },
    };
  };

  relays = relays || [...DEFAULT_RELAYS, ...OUTBOX_RELAYS];
  const promises = relays.map((url) => {
    const r = new Relay(url);
    return new Promise<void>((ok) => r.req(makeReq(ok))).finally(() =>
      r[Symbol.dispose]()
    );
  });
  let to = undefined;
  await Promise.race([
    new Promise((ok) => (to = setTimeout(ok, 5000))),
    Promise.allSettled(promises),
  ]);
  clearTimeout(to);

  return event;
}

export async function fetchProfile(pubkey: string) {
  const profile = await fetchReplaceableEvent(pubkey, 0);
  if (!profile) throw new Error("Profile not found");
  let profileContent = undefined;
  try {
    profileContent = JSON.parse(profile.content);
  } catch {
    console.error("Invalid profile content");
  }
  return {
    profile,
    profileContent,
  };
}
