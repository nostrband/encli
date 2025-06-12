/**
 * Test command implementation
 */

import { Command } from 'commander';

/**
 * Run a test command
 * @param options Command options
 * @returns Test result
 */
export function runTest(options: { verbose?: boolean } = {}): string {
  if (options.verbose) {
    return 'Running test command with verbose output...';
  }
  return 'Running test command...';
}

/**
 * Register the test command with the CLI
 * @param program Commander program instance
 */
export function registerTestCommand(program: Command): void {
  program
    .command('test')
    .description('Run a test command')
    .option('-v, --verbose', 'Enable verbose output')
    .action((options: { verbose?: boolean }) => {
      console.log(runTest(options));
    });
}