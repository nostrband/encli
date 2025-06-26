/**
 * Container command group implementation
 */

import { Command } from 'commander';
import { registerListCommand } from './ls';
import { registerInspectCommand } from './inspect';
import { registerPayCommand } from './pay';

/**
 * Register the container command group with the CLI
 * @param program Commander program instance
 */
export function registerContainerCommand(program: Command): void {
  const containerCommand = program
    .command('container')
    .description('Commands for working with containers deployed in enclaved server');

  // Register subcommands
  registerListCommand(containerCommand);
  registerInspectCommand(containerCommand);
  registerPayCommand(containerCommand);
}