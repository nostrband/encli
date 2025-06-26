import { Event, Filter } from "nostr-tools";
import { KIND_ENCLAVED_PROCESS, SEARCH_RELAY } from "./consts";
import { now } from "./utils";
// @ts-ignore
import { Validator } from "nostr-enclaves";
import { fetchFromRelays } from "./nostr";

export async function validate(e: Event) {
  const validator = new Validator({});
  try {
    await validator.validateEnclavedEvent(e);
    return true;
  } catch (err) {
    console.log("Invalid attestation of ", e.pubkey, e.id);
    return false;
  }
}

export async function fetchContainers(
  pubkey?: string,
  relayUrl: string = SEARCH_RELAY
) {
  const filter: Filter = {
    kinds: [KIND_ENCLAVED_PROCESS],
    since: now() - 3 * 3600,
  };
  if (pubkey) filter["#p"] = [pubkey];

  const services = await fetchFromRelays(filter, [relayUrl]);
  // console.log("containers", services, filter, relayUrl);
  if (!services.length) return [];

  const valid = new Map<string, Event>();
  for (const s of services) {
    if (valid.has(s.pubkey) && valid.get(s.pubkey)!.created_at > s.created_at)
      continue;
    if (await validate(s)) valid.set(s.pubkey, s);
  }

  return [...valid.values()];
}

export async function fetchContainer(
  pubkey: string,
  relayUrl: string = SEARCH_RELAY
): Promise<Event | undefined> {
  const filter: Filter = {
    authors: [pubkey],
    kinds: [KIND_ENCLAVED_PROCESS],
    since: now() - 3 * 3600,
  };

  const services = await fetchFromRelays(filter, [relayUrl]);
  // console.log("services", services, "filter", filter, "relay", relayUrl);
  if (!services.length) return undefined;

  const s = services[0];
  if (!(await validate(s))) throw new Error("Invalid container");

  return s;
}