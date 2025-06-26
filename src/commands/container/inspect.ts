/**
 * Inspect container command implementation
 */

import { Command } from 'commander';
import { fetchEnclaveService } from '../../modules/enclave';
import { SEARCH_RELAY } from '../../modules/consts';
import { fetchContainer } from '../../modules/container';
import { tv } from '../../modules/utils';
import { nip19 } from 'nostr-tools';
import { fetchProfile, fetchReplaceableEvent } from '../../modules/nostr';

/**
 * Run the inspect command
 * @param pubkey Public key of the service
 * @param relay Relay URL of the service
 * @returns Result of the inspect operation
 */
export async function runInspectCommand(pubkey: string, relay: string) {
  const s = await fetchContainer(pubkey, relay);
  if (!s) throw new Error("Not found");
  const info: any = { container: s };
  const app = s.tags.find(t => t.length > 2 && t[0] === 'p' && t[2] === 'app')?.[1];
  if (app) {
    info.appPubkey = app;
    info.appNpub = nip19.npubEncode(app);
  }

  const { profile, profileContent} = await fetchProfile(pubkey);
  info.profile = profile;
  info.profileContent = profileContent;

  console.log(JSON.stringify(info, null, 2));
}

/**
 * Register the inspect command with the CLI
 * @param program Commander program instance
 */
export function registerInspectCommand(program: Command): void {
  program
    .command('inspect')
    .description('Inspect a container running in enclaved server')
    .requiredOption('-p, --pubkey <pubkey>', 'Public key of the container')
    .option('-r, --relay <relay>', 'Relay URL to search for the announcements', SEARCH_RELAY)
    .action(async (options) => {
      await runInspectCommand(options.pubkey, options.relay);
    });
}