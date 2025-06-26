/**
 * Configuration module for handling encli.json
 */

import fs from 'node:fs';
import os from 'node:os';

/**
 * Get the path to the configuration file
 * @returns Path to the configuration file
 */
export function getConfigPath(): string {
  return os.homedir() + '/.encli.json';
}

/**
 * Read and parse the configuration file
 * @returns Parsed configuration object
 */
export function readConfig(): any {
  const configPath = getConfigPath();
  let config: any = {};

  try {
    if (fs.existsSync(configPath)) {
      const data = fs.readFileSync(configPath).toString('utf8');
      config = JSON.parse(data);
    }
  } catch (error) {
    console.log('Error reading config file, creating new one');
  }

  return config;
}

/**
 * Write configuration to file
 * @param config Configuration object to write
 */
export function writeConfig(config: any): void {
  const configPath = getConfigPath();
  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));
}

/**
 * Get wallets from configuration
 * @returns Wallets object or empty object if not found
 */
export function getWallets(): Record<string, any> {
  const config = readConfig();
  return config.wallets || {};
}

/**
 * Get a specific wallet by name
 * @param name Name of the wallet to get
 * @returns Wallet object or undefined if not found
 */
export function getWallet(name: string): any {
  const wallets = getWallets();
  
  // If name is provided, return that specific wallet
  if (name) {
    return wallets[name];
  }
  
  // Otherwise, find and return the default wallet
  for (const walletName in wallets) {
    if (wallets[walletName].default === true) {
      return { name: walletName, ...wallets[walletName] };
    }
  }
  
  // Return undefined if no default wallet found
  return undefined;
}

/**
 * Add a wallet to configuration
 * @param name Name of the wallet
 * @param walletData Wallet data to add
 * @throws Error if wallet with the same name already exists
 */
export function addWallet(name: string, walletData: any): void {
  const config = readConfig();
  
  // Ensure wallets object exists
  if (!config.wallets) {
    config.wallets = {};
  }

  // Check if wallet with this name already exists
  if (config.wallets[name]) {
    throw new Error(`Wallet with name "${name}" already exists`);
  }

  // Add the new wallet
  config.wallets[name] = walletData;

  // Write the updated config back to file
  writeConfig(config);
}

/**
 * Remove a wallet from configuration
 * @param name Name of the wallet to remove
 * @throws Error if wallet with the given name doesn't exist
 */
export function removeWallet(name: string): void {
  const config = readConfig();
  
  // Check if wallets object exists
  if (!config.wallets) {
    throw new Error(`Wallet with name "${name}" doesn't exist`);
  }

  // Check if wallet with this name exists
  if (!config.wallets[name]) {
    throw new Error(`Wallet with name "${name}" doesn't exist`);
  }

  // Remove the wallet
  delete config.wallets[name];

  // Write the updated config back to file
  writeConfig(config);
}