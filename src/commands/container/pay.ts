/**
 * Container Pay command implementation
 */

import { Command } from 'commander';
import { nwc } from "@getalby/sdk";
// @ts-ignore
import { LightningAddress } from "@getalby/lightning-tools";
import { fetchContainer } from '../../modules/container';
import { fetchProfile } from '../../modules/nostr';
import { SEARCH_RELAY } from '../../modules/consts';
import { getWallet } from '../../modules/conf';

/**
 * Run the pay command
 * @param pubkey Public key of the container
 * @param amount Amount in sats to pay
 * @param walletName Optional wallet name to use for payment
 * @param relay Relay URL to search for the container
 * @param description Optional description for the payment
 * @returns Result of the pay operation
 */
export async function runPayCommand(
  pubkey: string,
  amount: number,
  walletName?: string,
  relay: string = SEARCH_RELAY,
  description?: string
) {
  try {
    // Fetch the container
    const container = await fetchContainer(pubkey, relay);
    if (!container) {
      throw new Error(`Container with pubkey ${pubkey} not found`);
    }

    // Fetch the profile to get the lightning address
    const { profileContent } = await fetchProfile(pubkey);
    if (!profileContent) {
      throw new Error(`Profile content for ${pubkey} is invalid or not found`);
    }

    // Get the lightning address from the profile
    const lightningAddress = profileContent.lud16;
    if (!lightningAddress) {
      throw new Error(`No lightning address (lud16) found in profile for ${pubkey}`);
    }

    // Get the wallet
    let wallet = getWallet(walletName || '');
    if (!wallet) {
      throw new Error(
        walletName
          ? `Wallet with name "${walletName}" doesn't exist`
          : "No default wallet found. Set a default wallet or specify a wallet name."
      );
    }

    // Ensure wallet has a name property
    if (!wallet.name && walletName) {
      wallet.name = walletName;
    }

    // Create an NWCClient instance
    const client = new nwc.NWCClient({
      nostrWalletConnectUrl: wallet.nwcString,
    });

    try {
      // Validate Lightning Address format (name@domain)
      if (!lightningAddress.includes('@')) {
        throw new Error(`Invalid Lightning Address format: ${lightningAddress}. Must be in the format name@domain`);
      }
      
      // Get invoice from Lightning Address
      const ln = new LightningAddress(lightningAddress);
      await ln.fetch();
      const invoiceObj = await ln.requestInvoice({
        satoshi: amount,
        comment: description,
      });
      const invoice = invoiceObj.paymentRequest;

      // Pay the invoice
      const paymentResult = await client.payInvoice({
        invoice: invoice
      });
      
      console.log(`\nWallet "${wallet.name}" Payment Sent to ${lightningAddress}:`);
      console.log(`Amount: ${amount} sats`);
      console.log(`Preimage: ${paymentResult.preimage}`);
      console.log(`Fees: ${Math.ceil(paymentResult.fees_paid / 1000)} sat (${paymentResult.fees_paid} msat)`);
      
      return {
        success: true,
        name: wallet.name,
        invoice: invoice,
        preimage: paymentResult.preimage,
        address: lightningAddress,
        amount: amount
      };
    } finally {
      client.close();
    }
  } catch (error) {
    console.error("Error paying container:", error);
    throw error;
  }
}

/**
 * Register the pay command with the CLI
 * @param program Commander program instance
 */
export function registerPayCommand(program: Command): void {
  program
    .command('pay')
    .description('Pay a container using its lightning address from profile')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the container')
    .requiredOption('-a, --amount <amount>', 'Amount in sats to pay', (value) => parseInt(value, 10))
    .option('-w, --wallet <name>', 'Name of the wallet (uses default wallet if not specified)')
    .option('-r, --relay <relay>', 'Relay URL to search for the container', SEARCH_RELAY)
    .option('-d, --description <description>', 'Description for the payment')
    .action(async (options) => {
      await runPayCommand(
        options.pubkey,
        options.amount,
        options.wallet,
        options.relay,
        options.description
      );
    });
}