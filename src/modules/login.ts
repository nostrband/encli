import os from "node:os";
import { Nip46Client } from "./nip46-client";
import { Signer } from "./types";

function filename() {
  return os.homedir() + "/.encli.json";
}

export async function login(bunkerUrl?: string) {
  const pubkey = await Nip46Client.login({
    bunkerUrl,
    filename: filename(),
    relayUrl: bunkerUrl ? undefined : "wss://relay.nsec.app",
  });
  console.log("signed in as", pubkey);
}

export async function logout() {
  Nip46Client.logout(filename());
}

export async function createSigner(pubkey?: string): Promise<Nip46Client> {
  const client = Nip46Client.fromFile(filename());
  await client.start();
  const authPubkey = await client.getPublicKey();
  console.log("signed in as", authPubkey);
  if (pubkey && pubkey !== authPubkey)
    throw new Error("Need to login as " + pubkey);
  return client;
}
