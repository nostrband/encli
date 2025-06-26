/**
 * Wallet Pay command implementation
 */

import { Command } from "commander";
import { nwc } from "@getalby/sdk";
// @ts-ignore
import { LightningAddress } from "@getalby/lightning-tools";
import { getWallet } from "../../modules/conf";

/**
 * Run the pay command
 * @param options Command options
 * @returns Result of the pay operation
 */
export async function runPayCommand(options: {
  name?: string;
  invoice?: string;
  address?: string;
  amount?: number;
  description?: string;
}) {
  try {
    // Validate that either invoice or address is provided, but not both
    if ((!options.invoice && !options.address) || (options.invoice && options.address)) {
      throw new Error("Either invoice or address must be specified, but not both");
    }

    // Validate that amount is provided when address is provided
    if (options.address && !options.amount) {
      throw new Error("Amount must be specified when using a Lightning Address");
    }

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
      let invoice = options.invoice;
      
      // If using Lightning Address, get the invoice
      if (options.address) {
        // Validate Lightning Address format (name@domain)
        if (!options.address.includes('@')) {
          throw new Error("Invalid Lightning Address format. Must be in the format name@domain");
        }
        
        // Get invoice from Lightning Address
        const ln = new LightningAddress(options.address);
        await ln.fetch();
        const invoiceObj = await ln.requestInvoice({
          satoshi: options.amount,
          comment: options.description,
        });
        invoice = invoiceObj.paymentRequest;
      }

      // Pay the invoice
      const paymentResult = await client.payInvoice({
        invoice: invoice
      });
      
      console.log(`\nWallet "${wallet.name}" Payment Sent:`);
      console.log(`Preimage: ${paymentResult.preimage}`);
      console.log(`Fees: ${Math.ceil(paymentResult.fees_paid / 1000)} sat (${paymentResult.fees_paid} msat)`);
      
      return {
        success: true,
        name: wallet.name,
        invoice: invoice,
        preimage: paymentResult.preimage,
        address: options.address
      };
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Error paying invoice:", error);
    throw error;
  }
}

/**
 * Register the pay command with the CLI
 * @param program Commander program instance
 */
export function registerPayCommand(program: Command): void {
  program
    .command("pay")
    .description("Pay an invoice or Lightning Address with an NWC wallet")
    .option(
      "-n, --name <name>",
      "Name of the wallet (uses default wallet if not specified)"
    )
    .option(
      "-i, --invoice <invoice>",
      "Lightning invoice to pay"
    )
    .option(
      "-u, --address <lnurl_address>",
      "Lightning Address to pay (LNURL format: name@domain.com)"
    )
    .option(
      "-a, --amount <amount>",
      "Amount in sats (required when using Lightning Address)",
      (value) => parseInt(value, 10)
    )
    .option(
      "-d, --description <description>",
      "Description for the payment (used with Lightning Address)"
    )
    .action(async (options) => {
      await runPayCommand(options);
    });
}