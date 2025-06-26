/**
 * NWC (Nostr Wallet Connect) command group implementation
 */

import { Command } from 'commander';
import { registerGetInfoCommand } from './get_info';

/**
 * Register the nwc command group with the CLI
 * @param program Commander program instance
 */
export function registerNwcCommand(program: Command): void {
  const nwcCommand = program
    .command('nwc')
    .description('Commands related to Nostr Wallet Connect');

  // Register subcommands
  registerGetInfoCommand(nwcCommand);
}