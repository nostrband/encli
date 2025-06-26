/**
 * Wallet Invoice command implementation
 */

import { Command } from "commander";
import { nwc } from "@getalby/sdk";
import { getWallet, getWallets } from "../../modules/conf";

/**
 * Run the invoice command
 * @param options Command options
 * @returns Result of the invoice operation
 */
export async function runInvoiceCommand(options: {
  name?: string;
  amount: number;
  description?: string;
  description_hash?: string;
  expiry?: number;
}) {
  try {
    let wallet = getWallet(options.name || '');
    
    if (!wallet) {
      throw new Error(
        options.name
          ? `Wallet with name "${options.name}" doesn't exist`
          : "No default wallet found. Set a default wallet or specify a wallet name."
      );
    }
    
    // Ensure wallet has a name property
    if (!wallet.name && options.name) {
      wallet.name = options.name;
    }

    // Create an NWCClient instance
    const client = new nwc.NWCClient({
      nostrWalletConnectUrl: wallet.nwcString,
    });

    try {
      // Convert sats to msats
      const msatAmount = options.amount * 1000;
      
      // Create the invoice
      const invoice = await client.makeInvoice({
        amount: msatAmount,
        description: options.description || "",
        descriptionHash: options.description_hash,
        expiry: options.expiry
      });
      
      console.log(`\nWallet "${wallet.name}" Invoice Created:`);
      console.log(`Amount: ${options.amount} sats (${msatAmount} msat)`);
      console.log(`Description: ${options.description || ""}`);
      if (options.description_hash) {
        console.log(`Description Hash: ${options.description_hash}`);
      }
      if (options.expiry) {
        console.log(`Expiry: ${options.expiry} seconds`);
      }
      console.log(`\nInvoice: ${invoice.invoice}`);
      
      return { 
        success: true, 
        name: wallet.name, 
        invoice: invoice.invoice,
        amount: msatAmount,
        description: options.description || "",
        descriptionHash: options.description_hash,
        expiry: options.expiry
      };
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Error creating invoice:", error);
    throw error;
  }
}

/**
 * Register the invoice command with the CLI
 * @param program Commander program instance
 */
export function registerInvoiceCommand(program: Command): void {
  program
    .command("invoice")
    .description("Create an invoice with an NWC wallet")
    .option(
      "-n, --name <name>",
      "Name of the wallet (uses default wallet if not specified)"
    )
    .requiredOption(
      "-a, --amount <amount>",
      "Amount in sats",
      (value) => parseInt(value, 10)
    )
    .option(
      "-d, --description <description>",
      "Description for the invoice",
      ""
    )
    .option(
      "-x, --description-hash <hash>",
      "Description hash for the invoice"
    )
    .option(
      "-e, --expiry <seconds>",
      "Expiration period in seconds",
      (value) => parseInt(value, 10)
    )
    .action(async (options) => {
      await runInvoiceCommand(options);
    });
}