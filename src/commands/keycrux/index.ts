/**
 * Keycrux command group implementation
 */

import { Command } from 'commander';
import { registerListCommand } from './ls';
import { registerPingCommand } from './ping';
import { registerInspectCommand } from './inspect';
import { registerStatusCommand } from './status';
import { registerHasCommand } from './has';

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
  registerStatusCommand(keycruxCommand);
  registerHasCommand(keycruxCommand);
}