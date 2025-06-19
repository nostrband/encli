import { Event, UnsignedEvent } from "nostr-tools";
import { Signer } from "./types";
import { ENCLAVED_RELAY, KIND_RELAYS } from "./consts";
import { now } from "./utils";
import { Relay } from "./relay";

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
