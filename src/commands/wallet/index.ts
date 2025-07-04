/**
 * Wallet command group implementation
 */

import { Command } from 'commander';
import { registerAddCommand } from './add';
import { registerRemoveCommand } from './remove';
import { registerDefaultCommand } from './default';
import { registerBalanceCommand } from './balance';
import { registerInvoiceCommand } from './invoice';
import { registerPayCommand } from './pay';
import { registerCreateCommand } from './create';

/**
 * Register the wallet command group with the CLI
 * @param program Commander program instance
 */
export function registerWalletCommand(program: Command): void {
  const walletCommand = program
    .command('wallet')
    .description('Commands for managing wallets');

  // Register subcommands
  registerCreateCommand(walletCommand);
  registerAddCommand(walletCommand);
  registerRemoveCommand(walletCommand);
  registerDefaultCommand(walletCommand);
  registerBalanceCommand(walletCommand);
  registerInvoiceCommand(walletCommand);
  registerPayCommand(walletCommand);
}