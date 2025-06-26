/**
 * NWC Wallet Add command implementation
 */

import { Command } from 'commander';
import { nwc } from '@getalby/sdk';
import { addWallet } from '../../../modules/conf';

/**
 * Run the add command
 * @param name Name of the wallet
 * @param nwcString NWC connection string
 * @returns Result of the add operation
 */
export async function runAddCommand(name: string, nwcString: string) {
  // Check if the connection string is valid
  if (!nwcString.startsWith('nostr+walletconnect://')) {
    throw new Error('Invalid NWC connection string format. Should start with nostr+walletconnect://');
  }

  // Create an NWCClient instance
  const client = new nwc.NWCClient({
    nostrWalletConnectUrl: nwcString
  });

  try {
    // Verify the connection by getting the balance
    const balance = await client.getBalance();
    console.log('\nWallet Balance:');
    console.log(JSON.stringify(balance, null, 2));

    // If we got here, the connection is working
    // Add the wallet to configuration
    addWallet(name, {
      name,
      nwcString
    });

    console.log(`\nWallet "${name}" added successfully`);
    return { success: true, name, balance };
  } catch (error) {
    console.error('Error adding wallet:', error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Register the add command with the CLI
 * @param program Commander program instance
 */
export function registerAddCommand(program: Command): void {
  program
    .command('add')
    .description('Add a new NWC wallet')
    .requiredOption('-n, --name <name>', 'Name of the wallet')
    .requiredOption('-s, --nwc-string <nwcString>', 'NWC connection string')
    .action(async (options) => {
      await runAddCommand(options.name, options.nwcString);
    });
}