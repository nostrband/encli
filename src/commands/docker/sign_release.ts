/**
 * Sign Release command implementation
 */

import fs from "node:fs";
import { Command } from "commander";
import { exec, now, readPackageJson, readPubkey } from "../../modules/utils";
import { createSigner } from "../../modules/login";
import { nip19 } from "nostr-tools";
import { exit } from "node:process";
import { KIND_DOCKER_RELEASE_SIGNATURE } from "../../modules/consts";

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
  const signer = await createSigner();

  const { code, err, out } = await exec("docker", ["image", "inspect", uri]);
  if (code !== 0) {
    console.log("Failed to inspect image", uri, err);
    throw new Error("Failed to inspect image");
  }

  const data = JSON.parse(out);
  const info = data[0] as {
    Id: string;
    Config: {
      Labels: Record<string, string>;
    };
  };

  if (!info.Id) throw new Error("No id in docker image");

  if (
    !info.Config.Labels ||
    !("signers" in info.Config.Labels) ||
    !("signer_relays" in info.Config.Labels) ||
    !("version" in info.Config.Labels)
  ) {
    console.log("signers, signer_relays and version labels are required");
    throw new Error("No required labels in docker image");
  }

  const parse = (s: string) =>
    s
      .split(",")
      .map((s) => s.trim())
      .filter((s) => !!s);

  const signers = parse(info.Config.Labels["signers"]);
  const signerRelays = parse(info.Config.Labels["signer_relays"]);
  const upgradeRelays = info.Config.Labels["upgrade_relays"]
    ? parse(info.Config.Labels["upgrade_relays"])
    : signerRelays;
  const version = info.Config.Labels["version"];
  console.log("signers", signers);
  console.log("signerRelays", signerRelays);
  console.log("upgradeRelays", upgradeRelays);
  console.log("version", version);

  const pkg = readPackageJson();
  console.log("package.json", pkg);

  if (version !== pkg.version)
    throw new Error("Package version doesn't match version label");

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
      ["x", info.Id, "Docker"],
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
      "Directory containing the release to sign",
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
