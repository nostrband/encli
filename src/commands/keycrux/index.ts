/**
 * Keycrux command group implementation
 */

import { Command } from 'commander';
import { registerListCommand } from './ls';
import { registerPingCommand } from './ping';
import { registerInspectCommand } from './inspect';

/**
 * Register the keycrux command group with the CLI
 * @param program Commander program instance
 */
export function registerKeycruxCommand(program: Command): void {
  const keycruxCommand = program
    .command('keycrux')
    .description('Commands related to key storage service');

  // Register subcommands
  registerListCommand(keycruxCommand);
  registerPingCommand(keycruxCommand);
  registerInspectCommand(keycruxCommand);
}