/**
 * Wallet Remove command implementation
 */

import { Command } from 'commander';
import { removeWallet } from '../../modules/conf';

/**
 * Run the remove command
 * @param name Name of the wallet to remove
 * @returns Result of the remove operation
 */
export async function runRemoveCommand(name: string) {
  try {
    // Remove the wallet from configuration
    removeWallet(name);
    
    console.log(`\nWallet "${name}" removed successfully`);
    return { success: true, name };
  } catch (error) {
    console.error('Error removing wallet:', error);
    throw error;
  }
}

/**
 * Register the remove command with the CLI
 * @param program Commander program instance
 */
export function registerRemoveCommand(program: Command): void {
  program
    .command('remove')
    .description('Remove an NWC wallet')
    .requiredOption('-n, --name <name>', 'Name of the wallet to remove')
    .action(async (options) => {
      await runRemoveCommand(options.name);
    });
}