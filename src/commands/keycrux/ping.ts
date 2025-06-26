/**
 * Ping Keycrux Server command implementation
 */

import { Command } from 'commander';
import { KeycruxClient } from '../../modules/keycrux';
import { generateSecretKey } from 'nostr-tools';

/**
 * Run the ping command
 * @param pubkey Public key of the keycrux service
 * @param relay Relay URL of the service
 * @returns Result of the ping operation
 */
export async function runPingCommand(pubkey: string, relay: string) {
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
  
  // Ping the server
  await client.ping();
}

/**
 * Register the ping command with the CLI
 * @param program Commander program instance
 */
export function registerPingCommand(program: Command): void {
  program
    .command('ping')
    .description('Ping a keycrux server')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the keycrux service')
    .option('-r, --relay <relay>', 'Relay URL of the service', 'wss://relay.enclaved.org')
    .action(async (options) => {
      await runPingCommand(options.pubkey, options.relay);
    });
}