/**
 * NWC Wallet Balance command implementation
 */

import { Command } from "commander";
import { nwc } from "@getalby/sdk";
import { getWallet, getWallets } from "../../../modules/conf";

/**
 * Run the balance command
 * @param name Optional name of the wallet (uses default wallet if not provided)
 * @returns Result of the balance operation
 */
export async function runBalanceCommand(name?: string) {
  try {
    let wallet = getWallet(name || '');
    
    if (!wallet) {
      throw new Error(
        name
          ? `Wallet with name "${name}" doesn't exist`
          : "No default wallet found. Set a default wallet or specify a wallet name."
      );
    }
    
    // Ensure wallet has a name property
    if (!wallet.name && name) {
      wallet.name = name;
    }

    // Create an NWCClient instance
    const client = new nwc.NWCClient({
      nostrWalletConnectUrl: wallet.nwcString,
    });

    try {
      // Get the balance
      const r = await client.getBalance();
      console.log(
        `\nWallet "${wallet.name}" Balance: ${Math.floor(
          r.balance / 1000
        )} sats (${r.balance} msat)`
      );

      return { success: true, name: wallet.name, balance: r.balance };
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Error getting wallet balance:", error);
    throw error;
  }
}

/**
 * Register the balance command with the CLI
 * @param program Commander program instance
 */
export function registerBalanceCommand(program: Command): void {
  program
    .command("balance")
    .description("Get the balance of an NWC wallet")
    .option(
      "-n, --name <name>",
      "Name of the wallet (uses default wallet if not specified)"
    )
    .action(async (options) => {
      await runBalanceCommand(options.name);
    });
}
