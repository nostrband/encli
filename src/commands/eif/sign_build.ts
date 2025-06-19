/**
 * Sign Build command implementation
 */

import fs from "node:fs";
import { Command } from "commander";
import { now, readPackageJson, readPubkey } from "../../modules/utils";
import { createSigner } from "../../modules/login";
import { KIND_BUILD_SIGNATURE } from "../../modules/consts";

function readCert(dir: string) {
  return fs.readFileSync(dir + "/crt.pem").toString("utf8");
}

/**
 * Run the sign_build command
 * @param options Command options
 * @returns Result of the sign build operation
 */
export async function runSignBuild({
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

  const cert = readCert(dir);
  console.log("cert", cert);

  const pkg = readPackageJson();
  console.log("package.json", pkg);

  using signer = await createSigner(pubkey);

  // PCR8 is unique on every build (the way we do the build)
  // so reuse of this event is impossible
  const unsigned = {
    created_at: now(),
    kind: KIND_BUILD_SIGNATURE,
    content: "",
    pubkey: await signer.getPublicKey(),
    tags: [
      ["-"], // not for publishing
      ["r", repo],
      ["v", pkg.version],
      ["t", prod ? "prod" : "dev"],
      ["cert", cert],
      ["PCR8", pcrs.Measurements["PCR8"]],
    ],
  };
  console.log("signing", unsigned);
  const event = await signer.signEvent(unsigned);
  console.log("signed", event);

  fs.writeFileSync(dir + "/build.json", JSON.stringify(event));
}

/**
 * Register the sign_build command with the CLI
 * @param program Commander program instance
 */
export function registerSignBuildCommand(program: Command): void {
  program
    .command("sign_build")
    .description("Sign a build of EIF file")
    .requiredOption("-r, --repo <url>", "Git repo link")
    .option(
      "-d, --dir <directory>",
      "Directory containing the build to sign",
      "./build/"
    )
    .option("-p, --prod", "Sign for production environment", false)
    .action(async (options: { dir: string; prod: boolean; repo: string }) => {
      console.log("options", options);
      await runSignBuild(options);
    });
}
