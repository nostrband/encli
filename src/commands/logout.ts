/**
 * Login command implementation
 */

import { Command } from 'commander';
import { logout } from '../modules/login';

/**
 * Run the logout command
 * @returns void
 */
export async function runLogout(options: { bunkerUrl?: string } = {}) {
  await logout();
}

/**
 * Register the logout command with the CLI
 * @param program Commander program instance
 */
export function registerLogoutCommand(program: Command): void {
  program
    .command('logout')
    .description('Disconnect from your remote Nostr signer (NIP-46)')
    .action(async (options: { bunkerUrl?: string }) => {
      await runLogout(options);
    });
}