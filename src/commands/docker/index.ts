/**
 * EIF command group implementation
 */

import { Command } from 'commander';
import { registerSignReleaseCommand } from './sign_release';

/**
 * Register the eif command group with the CLI
 * @param program Commander program instance
 */
export function registerDockerCommand(program: Command): void {
  const command = program
    .command('docker')
    .description('Commands for working with Docker images');

  // Register subcommands
  registerSignReleaseCommand(command);
}