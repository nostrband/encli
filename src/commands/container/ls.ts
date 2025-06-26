/**
 * List Containers command implementation
 */

import { Command } from "commander";
import { fetchContainers } from "../../modules/container";
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
  pubkey?: string;
  relay?: string;
}) {
  const events = await fetchContainers(pubkey, relay);
  for (const e of events) {
    const ref = tv(e, "r");
    const state = tv(e, "state");
    const balance = tv(e, "balance") || "0";
    const tm = new Date(e.created_at * 1000).toISOString();
    console.log(`${e.pubkey} ${state} ${tm} ${ref} ${balance} sats`);
  }
}

/**
 * Register the list command with the CLI
 * @param program Commander program instance
 */
export function registerListCommand(program: Command): void {
  program
    .command("ls")
    .description("List containers deployed in enclaved server")
    .option("-p, --pubkey <pubkey>", "Pubkey of enclaved service instance")
    .option(
      "-r, --relay <relay>",
      "Relay URL to search for containers",
      SEARCH_RELAY
    )
    .action(async (options) => {
      await runListCommand(options);
    });
}
