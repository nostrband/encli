/**
 * List Enclave Servers command implementation
 */

import { Command } from "commander";
import { fetchEnclaveServices } from "../../modules/enclave";
import { tv } from "../../modules/utils";
import { SEARCH_RELAY } from "../../modules/consts";

/**
 * Run the list command
 * @returns Result of the list operation
 */
export async function runListCommand({
  pubkey,
  relay,
}: {
  pubkey: string;
  relay: string;
}) {
  const events = await fetchEnclaveServices(pubkey, relay);
  for (const e of events) {
    const name = tv(e, "name");
    const relay = tv(e, "relay");
    const tm = new Date(e.created_at * 1000).toISOString();
    console.log(`${name} ${e.pubkey} ${relay} ${tm}`);
  }
}

/**
 * Register the list command with the CLI
 * @param program Commander program instance
 */
export function registerListCommand(program: Command): void {
  program
    .command("ls")
    .description("List active servers running in AWS Nitro Enclave")
    .option("-p, --pubkey <pubkey>", "Release signer pubkey")
    .option(
      "-r, --relay <relay>",
      "Relay URL for service discovery",
      SEARCH_RELAY
    )
    .action(async (options) => {
      await runListCommand(options);
    });
}
