import os from "node:os";
import { Nip46Client } from "./nip46-client";
import { Signer } from "./types";

function filename() {
  return os.homedir() + "/.encli.json";
}

export async function login(bunkerUrl?: string) {
  using client = new Nip46Client({
    bunkerUrl,
    relayUrl: bunkerUrl ? undefined : "wss://relay.nsec.app",
    filename: filename(),
  });
  const authPubkey = await client.login();
  console.log("signed in as", authPubkey);
}

export async function logout() {
  const client = new Nip46Client({
    filename: filename(),
  });
  client.logout();
}

export async function createSigner(pubkey?: string): Promise<Signer> {
  const client = new Nip46Client({
    filename: filename(),
  });
  await client.start();
  const authPubkey = await client.getPublicKey();
  console.log("signed in as", authPubkey);
  if (pubkey && pubkey !== authPubkey) throw new Error("Need to login as " + pubkey);
  return client;
}
