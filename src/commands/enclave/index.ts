/**
 * Enclave command group implementation
 */

import { Command } from "commander";
import { registerEnsureInstanceSignatureCommand } from "./ensure_instance_signature";
import { registerListCommand } from "./ls";
import { registerInspectCommand } from "./inspect";

/**
 * Register the enclave command group with the CLI
 * @param program Commander program instance
 */
export function registerEnclaveCommand(program: Command): void {
  const enclaveCommand = program
    .command("enclave")
    .description("Commands related to running the AWS Nitro enclaves");

  // Register subcommands
  registerEnsureInstanceSignatureCommand(enclaveCommand);
  registerListCommand(enclaveCommand);
  registerInspectCommand(enclaveCommand);
}
