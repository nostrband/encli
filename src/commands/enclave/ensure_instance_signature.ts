/**
 * Ensure Instance Signature command implementation
 */

import fs from "node:fs";
import { Command } from "commander";
import * as readline from "readline";
import { now, readPubkey } from "../../modules/utils";
import { validateEvent, verifyEvent } from "nostr-tools";
import { KIND_INSTANCE_SIGNATURE } from "../../modules/consts";
import { pcrDigest } from "../../modules/aws";
import { createSigner } from "../../modules/login";

async function readLine() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });
  return await new Promise<string>((ok) => {
    rl.on("line", (line) => {
      ok(line);
      rl.close();
    });
  });
}

/**
 * Run the ensure_instance_signature command
 * @param options Command options
 * @returns Result of the ensure_instance_signature operation
 */
export async function runEnsureInstanceSignature({
  instance_id,
  dir,
  prod,
}: {
  instance_id?: string;
  dir: string;
  prod: boolean;
}) {
  const pubkey = readPubkey(dir);
  console.log("pubkey", pubkey);

  try {
    const event = JSON.parse(
      fs.readFileSync(dir + "/instance.json").toString("utf8")
    );
    console.log("sig event", event);
    if (!validateEvent(event) || !verifyEvent(event))
      throw new Error("Invalid event");
    if (event.kind !== KIND_INSTANCE_SIGNATURE)
      throw new Error("Invalid kind of existing instance signature");
    if (event.pubkey !== pubkey) throw new Error("Invalid event pubkey");
    const prod_ins = !!event.tags.find(
      (t) => t.length > 1 && t[0] === "t" && t[1] === "prod"
    );
    if (prod_ins !== prod)
      throw new Error("Existing instance signature prod/dev is different");
    if (
      instance_id &&
      pcrDigest(instance_id) !==
        event.tags.find((t) => t.length > 1 && t[0] === "PCR4")?.[1]
    )
      throw new Error("Wrong instance id in existing instance signature");
    console.log("Have valid instance signature");
    return;
  } catch (e) {
    console.log("No instance signature", e);
  }

  if (!instance_id) {
    console.log("Enter instance ID:");
    const line = (await readLine()).trim();
    if (!line.startsWith("i-") || line.includes(" "))
      throw new Error("Invalid instance id " + line);

    // AWS ensure EC2 instance IDs are unique and will never be reused,
    // so reusing this event on another instance won't work bcs
    // enclave's PCR4 will not match the one below
    instance_id = line;
  }
  console.log("instance", instance_id);

  // https://docs.aws.amazon.com/enclaves/latest/user/set-up-attestation.html#pcr4
  const pcr4 = pcrDigest(instance_id);
  console.log("pcr4", pcr4);

  using signer = await createSigner(pubkey);

  const unsigned = {
    created_at: now(),
    kind: KIND_INSTANCE_SIGNATURE,
    content: "",
    pubkey: await signer.getPublicKey(),
    tags: [
      ["-"], // not for publishing
      ["t", prod ? "prod" : "dev"],
      ["PCR4", pcr4],
    ],
  };
  console.log("signing", unsigned);
  const event = await signer.signEvent(unsigned);
  console.log("signed", event);

  fs.writeFileSync(dir + "/instance.json", JSON.stringify(event));
}

/**
 * Register the ensure_instance_signature command with the CLI
 * @param program Commander program instance
 */
export function registerEnsureInstanceSignatureCommand(program: Command): void {
  program
    .command("ensure_instance_signature")
    .description("Ensure the signature of an EC2 parent instance")
    .option("-i, --instance_id <id>", "ID of EC2 parent instance")
    .option(
      "-d, --dir <directory>",
      "Directory for instance signature files",
      "./instance/"
    )
    .option("-p, --prod", "Sign for production environment", false)
    .action(
      async (options: { instance_id?: string; prod: boolean; dir: string }) => {
        console.log("options", options);
        await runEnsureInstanceSignature(options);
      }
    );
}
