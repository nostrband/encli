/**
 * Login command implementation
 */

import { Command } from 'commander';
import { login } from '../modules/login';

/**
 * Run the login command
 * @param options.bunkerUrl Optional bunker URL, without it nostrconnect flow will be used
 * @returns void
 */
export async function runLogin(options: { bunkerUrl?: string } = {}) {
  await login(options.bunkerUrl || '');
}

/**
 * Register the login command with the CLI
 * @param program Commander program instance
 */
export function registerLoginCommand(program: Command): void {
  program
    .command('login')
    .description('Connect to your remote Nostr signer (NIP-46)')
    .option('--bunker-url <url>', 'Specify the bunker URL')
    .action(async (options: { bunkerUrl?: string }) => {
      await runLogin(options);
      console.log("done");
    });
}