/**
 * EIF command group implementation
 */

import { Command } from 'commander';
import { registerSignReleaseCommand } from './sign_release';

/**
 * Register the eif command group with the CLI
 * @param program Commander program instance
 */
export function registerEifCommand(program: Command): void {
  const eifCommand = program
    .command('eif')
    .description('Commands for working with Docker images');

  // Register subcommands
  registerSignReleaseCommand(eifCommand);
}