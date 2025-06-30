/**
 * Inspect docker image command implementation
 */

import { Command } from 'commander';
import { fetchDockerImageInfo } from '../../modules/manifest';

// Define a type for the return value of fetchDockerImageInfo
type DockerImageInfo = {
  manifest: any;
  config: any;
};

/**
 * Run the inspect command
 * @param uri Docker image URI
 * @returns Result of the inspect operation
 */
export async function runInspectCommand(uri: string): Promise<DockerImageInfo> {
  try {
    const imageInfo = await fetchDockerImageInfo({ imageRef: uri });
    console.log(JSON.stringify(imageInfo, null, 2));
    return imageInfo;
  } catch (error: any) {
    console.error(`Error inspecting Docker image: ${error.message || error}`);
    process.exit(1);
  }
}

/**
 * Register the inspect command with the CLI
 * @param program Commander program instance
 */
export function registerInspectCommand(program: Command): void {
  program
    .command('inspect')
    .description('Inspect a Docker image from a remote location')
    .requiredOption('-u, --uri <uri>', 'Docker image URI')
    .action(async (options) => {
      await runInspectCommand(options.uri);
    });
}