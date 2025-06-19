/**
 * Sign Release command implementation
 */

import fs from "node:fs";
import { Command } from "commander";
import { now, readPackageJson } from "../../modules/utils";
import { createSigner } from "../../modules/login";
import { nip19 } from "nostr-tools";
import { KIND_DOCKER_RELEASE_SIGNATURE } from "../../modules/consts";
import { dockerInspect } from "../../modules/docker";

/**
 * Run the sign_release command
 * @param options Command options
 * @returns Result of the sign release operation
 */
export async function runSignRelease({
  uri,
  dir,
  prod,
  repo,
}: {
  uri: string;
  dir: string;
  prod: boolean;
  repo: string;
}) {
  console.log("Signing release with options:", { uri, dir, prod, repo });

  const {
    signers,
    signerRelays,
    upgradeRelays,
    version,
    id
  } = await dockerInspect(uri);

  console.log("docker id", id);
  console.log("signers", signers);
  console.log("signerRelays", signerRelays);
  console.log("upgradeRelays", upgradeRelays);
  console.log("version", version);

  const pkg = readPackageJson();
  console.log("package.json", pkg);

  if (version !== pkg.version)
    throw new Error("Package version doesn't match version label");

  using signer = await createSigner();
  const pubkey = await signer.getPublicKey();

  if (!signers.includes(pubkey))
    throw new Error("Login as one of the signers");

  const unsigned = {
    created_at: now(),
    kind: KIND_DOCKER_RELEASE_SIGNATURE,
    content: "",
    pubkey: await signer.getPublicKey(),
    tags: [
      ["t", prod ? "prod" : "dev"],
      ["r", repo],
      ["v", version],
      ["x", id, "docker"],
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
    .description("Sign a release of a Docker image")
    .requiredOption("-u, --uri <docker uri>", "URI of local Docker image")
    .option("-p, --prod", "Sign for production environment", false)
    .option(
      "-d, --dir <directory>",
      "Directory containing the build info",
      "./build/"
    )
    .requiredOption("-r, --repo <repository>", "Git repository link")
    .action(
      async (options: {
        uri: string;
        dir: string;
        prod: boolean;
        repo: string;
      }) => {
        await runSignRelease(options);
      }
    );
}
