import { Event, validateEvent, verifyEvent } from "nostr-tools";
import { KIND_DOCKER_RELEASE_SIGNATURE } from "./consts";
import { tv } from "./utils";

export function validateDockerReleaseSignature(
  sig: Event,
  {
    id,
    repo,
    signers,
    version,
    prod,
  }: {
    id: string;
    repo: string;
    signers: string[];
    prod: boolean;
    version: string;
  }
) {
  if (!verifyEvent(sig)) return false;
  if (sig.kind !== KIND_DOCKER_RELEASE_SIGNATURE) return false;
  if (!signers.includes(sig.pubkey)) return false;
  if (prod && tv(sig, "t") !== "prod") return false;
  if (tv(sig, "r") !== repo) return false;
  if (tv(sig, "v") !== version) return false;
  if (tv(sig, "x") !== id) return false;
  if (!validateEvent(sig)) return false;
  console.log("valid docker release signature", sig);
  return true;
}
