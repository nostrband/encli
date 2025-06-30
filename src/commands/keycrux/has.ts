/**
 * Has Keycrux Server command implementation
 * Checks if any keys are stored based on PCR4 value (ec2 instance id)
 */

import { Command } from 'commander';
import { KeycruxClient } from '../../modules/keycrux';
import { generateSecretKey } from 'nostr-tools';

/**
 * Run the has command
 * @param pubkey Public key of the keycrux service
 * @param relay Relay URL of the service
 * @param pcr4 PCR4 value (ec2 instance id)
 * @returns Result of the has operation
 */
export async function runHasCommand(pubkey: string, relay: string, pcr4: string) {
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
  
  // Check if any keys are stored based on PCR4 value
  const result = await client.has(pcr4);
  console.log("Keys stored for PCR4 value:", result);
  return result;
}

/**
 * Register the has command with the CLI
 * @param program Commander program instance
 */
export function registerHasCommand(program: Command): void {
  program
    .command('has')
    .description('Check if any keys are stored based on PCR4 value (ec2 instance id)')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the keycrux service')
    .option('-r, --relay <relay>', 'Relay URL of the service', 'wss://relay.enclaved.org')
    .requiredOption('-i, --pcr4 <pcr4>', 'PCR4 value (ec2 instance id)')
    .action(async (options) => {
      await runHasCommand(options.pubkey, options.relay, options.pcr4);
    });
}