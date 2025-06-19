/**
 * Sign Release command implementation
 */

import fs from "node:fs";
import { Command } from "commander";
import { now, readPackageJson, readPubkey } from "../../modules/utils";
import { createSigner } from "../../modules/login";
import { KIND_RELEASE_SIGNATURE } from "../../modules/consts";
import { nip19 } from "nostr-tools";

/**
 * Run the sign_release command
 * @param options Command options
 * @returns Result of the sign release operation
 */
export async function runSignRelease({
  dir,
  prod,
  repo,
}: {
  dir: string;
  prod: boolean;
  repo: string;
}) {
  const pubkey = readPubkey(dir);
  console.log("pubkey", pubkey);

  const pcrs = JSON.parse(fs.readFileSync(dir + "/pcrs.json").toString("utf8"));
  console.log("pcrs", pcrs);

  const pkg = readPackageJson();
  console.log("package.json", pkg);

  using signer = await createSigner(pubkey);

  const unsigned = {
    created_at: now(),
    kind: KIND_RELEASE_SIGNATURE,
    content: "",
    pubkey: await signer.getPublicKey(),
    tags: [
      ["t", prod ? "prod" : "dev"],
      ["r", repo],
      ["v", pkg.version],
      ["x", pcrs.Measurements["PCR0"], "PCR0"],
      ["x", pcrs.Measurements["PCR1"], "PCR1"],
      ["x", pcrs.Measurements["PCR2"], "PCR2"],
    ],
  };
  console.log("signing", unsigned);
  const event = await signer.signEvent(unsigned);
  console.log("signed", event);

  const path = dir + "/release";
  fs.mkdirSync(path, { recursive: true });
  const npub = nip19.npubEncode(pubkey);
  fs.writeFileSync(`${path}/${npub}.json`, JSON.stringify(event));
}

/**
 * Register the sign_release command with the CLI
 * @param program Commander program instance
 */
export function registerSignReleaseCommand(program: Command): void {
  program
    .command("sign_release")
    .description("Sign a release of EIF file")
    .option(
      "-d, --dir <directory>",
      "Directory containing the release to sign",
      "./build/"
    )
    .option("-p, --prod", "Sign for production environment", false)
    .requiredOption("-r, --repo <repository>", "Git repository link")
    .action(async (options: { dir: string; prod: boolean; repo: string }) => {
      await runSignRelease(options);
    });
}
