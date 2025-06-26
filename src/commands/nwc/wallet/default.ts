/**
 * NWC Wallet Default command implementation
 */

import { Command } from 'commander';
import { getWallet, readConfig, writeConfig } from '../../../modules/conf';

/**
 * Run the default command
 * @param name Name of the wallet to set as default (empty string to clear all defaults)
 * @returns Result of the default operation
 */
export async function runDefaultCommand(name: string) {
  try {
    const config = readConfig();
    
    // Ensure wallets object exists
    if (!config.wallets) {
      config.wallets = {};
    }

    // If name is not empty, check if wallet exists
    if (name !== '' && !config.wallets[name]) {
      throw new Error(`Wallet with name "${name}" doesn't exist`);
    }

    // Remove default flag from all wallets
    for (const walletName in config.wallets) {
      if (config.wallets[walletName].default) {
        delete config.wallets[walletName].default;
      }
    }

    // Set the specified wallet as default (if name is not empty)
    if (name !== '') {
      config.wallets[name].default = true;
      console.log(`\nWallet "${name}" set as default`);
    } else {
      console.log('\nCleared default wallet setting');
    }

    // Write the updated config back to file
    writeConfig(config);
    
    return { success: true, name };
  } catch (error) {
    console.error('Error setting default wallet:', error);
    throw error;
  }
}

/**
 * Register the default command with the CLI
 * @param program Commander program instance
 */
export function registerDefaultCommand(program: Command): void {
  program
    .command('default')
    .description('Set a wallet as default or clear default setting')
    .requiredOption('-n, --name <name>', 'Name of the wallet to set as default (empty string to clear all defaults)')
    .action(async (options) => {
      await runDefaultCommand(options.name);
    });
}