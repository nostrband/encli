/**
 * Wallet Create command implementation
 */

import { Command } from 'commander';
import { nwc } from '@getalby/sdk';
import { createWallet } from 'nwc-enclaved-utils';
import { addWallet } from '../../modules/conf';

/**
 * Run the create command
 * @param name Name of the wallet
 * @returns Result of the create operation
 */
export async function runCreateCommand(name: string) {
  // Generate a new wallet using the createWallet function from nwc-enclaved-utils
  const { nwcString } = await createWallet();
  
  console.log('Created new wallet with connection string:');
  console.log(nwcString);
  
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
    
    console.log(`\nWallet "${name}" created and added successfully`);
    return { success: true, name, balance, nwcString };
  } catch (error) {
    console.error('Error creating wallet:', error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Register the create command with the CLI
 * @param program Commander program instance
 */
export function registerCreateCommand(program: Command): void {
  program
    .command('create')
    .description('Create a new NWC wallet')
    .requiredOption('-n, --name <name>', 'Name of the wallet')
    .action(async (options) => {
      await runCreateCommand(options.name);
    });
}