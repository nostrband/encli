/**
 * Publish Release command implementation
 */

import fs from "node:fs";
import { Command } from "commander";
import { now, readPackageJson } from "../../modules/utils";
import { dockerInspect } from "../../modules/docker";
import { createSigner } from "../../modules/login";
import { nip19, validateEvent, verifyEvent } from "nostr-tools";
import { validateDockerReleaseSignature } from "../../modules/validate";
import { KIND_DOCKER_RELEASE } from "../../modules/consts";
import { signPublish } from "../../modules/nostr";

/**
 * Run the publish_release command
 * @param options Command options
 * @returns Result of the publish release operation
 */
export async function runPublishRelease({
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
  // Implementation will be added by the user
  console.log("Publishing release with options:", { uri, dir, prod, repo });

  const { signers, signerRelays, upgradeRelays, version, id } =
    await dockerInspect(uri);

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

  if (!signers.includes(pubkey)) throw new Error("Login as one of the signers");

  const sigs: Event[] = [];
  const path = dir + "/release";
  for (const pubkey of signers) {
    const npub = nip19.npubEncode(pubkey);
    const data = fs.readFileSync(`${path}/${npub}.json`).toString("utf8");
    const signature = JSON.parse(data);
    if (
      !validateDockerReleaseSignature(signature, {
        id,
        prod,
        repo,
        signers,
        version,
      })
    )
      throw new Error("Invalid release signature");
    sigs.push(signature);
  }

  const unsigned = {
    created_at: now(),
    kind: KIND_DOCKER_RELEASE,
    content: "",
    pubkey: await signer.getPublicKey(),
    tags: [
      ["t", prod ? "prod" : "dev"],
      ["r", repo],
      ["v", version],
      ["x", id, "docker"],
      ...sigs.map(e => ["release", JSON.stringify(e)]),
    ],
  };

  await signPublish(unsigned, signer, upgradeRelays);
}

/**
 * Register the publish_release command with the CLI
 * @param program Commander program instance
 */
export function registerPublishReleaseCommand(program: Command): void {
  program
    .command("publish_release")
    .description("Publish a release of a Docker image")
    .requiredOption("-u, --uri <docker uri>", "URI of local Docker image")
    .option(
      "-d, --dir <directory>",
      "Directory containing the build info",
      "./build/"
    )
    .option("-p, --prod", "Publish to production environment", false)
    .requiredOption("-r, --repo <repository>", "Git repository link")
    .action(
      async (options: {
        uri: string;
        dir: string;
        prod: boolean;
        repo: string;
      }) => {
        await runPublishRelease(options);
      }
    );
}
