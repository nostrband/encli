#!/usr/bin/env node

/**
 * encli
 * CLI entry point
 */

import { Command } from 'commander';
import { registerEifCommand } from './commands/eif';
import { registerLoginCommand } from './commands/login';
import { registerDockerCommand } from './commands/docker';
import { registerLogoutCommand } from './commands/logout';
import { registerEnclaveCommand } from './commands/enclave';
import { registerKeycruxCommand } from './commands/keycrux';
import { registerContainerCommand } from './commands/container';
import { registerNwcCommand } from './commands/nwc';
import { registerWalletCommand } from './commands/wallet';

// Create a new Commander program
const program = new Command();

// Set up program metadata
program
  .name('encli')
  .description('CLI utilities for working with enclaved application server for TEEs')
  .version(process.env.npm_package_version || '0.1.0');

// Register commands
registerEifCommand(program);
registerDockerCommand(program);
registerLoginCommand(program);
registerLogoutCommand(program);
registerEnclaveCommand(program);
registerKeycruxCommand(program);
registerContainerCommand(program);
registerNwcCommand(program);
registerWalletCommand(program);

// Add more commands here as needed

// Parse command line arguments
program.parse(process.argv);

// Display help if no command is provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}