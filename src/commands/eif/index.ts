/**
 * EIF command group implementation
 */

import { Command } from 'commander';
import { registerSignBuildCommand } from './sign_build';
import { registerSignReleaseCommand } from './eif_sign_release';

/**
 * Register the eif command group with the CLI
 * @param program Commander program instance
 */
export function registerEifCommand(program: Command): void {
  const eifCommand = program
    .command('eif')
    .description('Commands for working with Enclave Image Format (EIF) files');

  // Register subcommands
  registerSignBuildCommand(eifCommand);
  registerSignReleaseCommand(eifCommand);
}