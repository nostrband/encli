/**
 * Status Keycrux Server command implementation
 */

import { Command } from 'commander';
import { KeycruxClient } from '../../modules/keycrux';
import { generateSecretKey } from 'nostr-tools';

/**
 * Run the status command
 * @param pubkey Public key of the keycrux service
 * @param relay Relay URL of the service
 * @returns Result of the status operation
 */
export async function runStatusCommand(pubkey: string, relay: string) {
  // Generate a private key for the client
  const privkey = generateSecretKey();
  
  // Create a KeycruxClient instance
  using client = new KeycruxClient({
    relayUrl: relay,
    signerPubkey: pubkey,
    privkey
  });

  // Start the client
  await client.start();
  
  // Get status from the server
  const status = await client.status();
  console.log("Server status:", status);
  return status;
}

/**
 * Register the status command with the CLI
 * @param program Commander program instance
 */
export function registerStatusCommand(program: Command): void {
  program
    .command('status')
    .description('Get status from a keycrux server')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the keycrux service')
    .option('-r, --relay <relay>', 'Relay URL of the service', 'wss://relay.enclaved.org')
    .action(async (options) => {
      await runStatusCommand(options.pubkey, options.relay);
    });
}