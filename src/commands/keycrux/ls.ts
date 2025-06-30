/**
 * List Keycrux Servers command implementation
 */

import { Command } from "commander";
import { fetchKeycruxServices } from "../../modules/keycrux";
import { SEARCH_RELAY } from "../../modules/consts";
import { tv } from "../../modules/utils";

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
  const events = await fetchKeycruxServices(pubkey, relay);
  for (const e of events) {
    const relay = tv(e, "relay") || "-";
    const ver = tv(e, "v") || "-";
    const tm = new Date(e.created_at * 1000).toISOString();
    console.log(`${e.pubkey} ${relay} ${tm} ${ver}`);
  }
}

/**
 * Register the list command with the CLI
 * @param program Commander program instance
 */
export function registerListCommand(program: Command): void {
  program
    .command("ls")
    .description("List active keycrux servers")
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
