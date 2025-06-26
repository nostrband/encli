/**
 * Inspect Enclave Server command implementation
 */

import { Command } from 'commander';
import { fetchEnclaveService } from '../../modules/enclave';
import { SEARCH_RELAY } from '../../modules/consts';

/**
 * Run the inspect command
 * @param pubkey Public key of the service
 * @param relay Relay URL of the service
 * @returns Result of the inspect operation
 */
export async function runInspectCommand(pubkey: string, relay: string) {
  const s = await fetchEnclaveService(pubkey, relay);
  if (!s) throw new Error("Not found");
  const info: any = { enclave: s };
  console.log(JSON.stringify(info, null, 2));
}

/**
 * Register the inspect command with the CLI
 * @param program Commander program instance
 */
export function registerInspectCommand(program: Command): void {
  program
    .command('inspect')
    .description('Inspect a server running in AWS Nitro Enclave')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the service')
    .option('-r, --relay <relay>', 'Relay URL of the service', SEARCH_RELAY)
    .action(async (options) => {
      await runInspectCommand(options.pubkey, options.relay);
    });
}