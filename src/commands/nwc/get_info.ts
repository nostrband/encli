/**
 * NWC Get Info command implementation
 */

import { Command } from 'commander';
import { nwc } from '@getalby/sdk';
import { generateSecretKey } from 'nostr-tools';
import { bytesToHex } from '@noble/hashes/utils';

/**
 * Run the get_info command
 * @param pubkey Public key of the wallet service
 * @param relay Relay URL of the service
 * @returns Result of the get_info operation
 */
export async function runGetInfoCommand(pubkey: string, relay: string) {
  // Generate a secret key for the connection
  const secretKey = generateSecretKey();
  
  // Create the NWC connection string
  const connectionString = `nostr+walletconnect://${pubkey}?relay=${encodeURIComponent(relay)}&secret=${bytesToHex(secretKey)}`;
  
  console.log('Connecting to wallet with connection string:');
  console.log(connectionString);
  
  // Create an NWCClient instance
  const client = new nwc.NWCClient({
    nostrWalletConnectUrl: connectionString
  });
  
  try {
    // Get wallet info
    const info = await client.getInfo();
    
    // Print the results
    console.log('\nWallet Info:');
    console.log(JSON.stringify(info, null, 2));
    
    return info;
  } catch (error) {
    console.error('Error getting wallet info:', error);
    throw error;
  } finally {
    client.close();
  }
}

/**
 * Register the get_info command with the CLI
 * @param program Commander program instance
 */
export function registerGetInfoCommand(program: Command): void {
  program
    .command('get_info')
    .description('Get information from a Nostr Wallet Connect service')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the wallet service')
    .option('-r, --relay <relay>', 'Relay URL of the service', 'wss://relay.zap.land')
    .action(async (options) => {
      await runGetInfoCommand(options.pubkey, options.relay);
    });
}