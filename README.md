# encli

CLI utilities for working with enclaved application servers for Trusted Execution Environments (TEEs).

## Installation

```bash
npm install -g encli
```

Or use it directly with npx:

```bash
npx encli [command]
```

## Command Groups

encli is organized into several command groups, each focused on a specific aspect of working with enclaved applications:

### Authentication

Commands for connecting to and disconnecting from remote Nostr signers:

- **login**: Connect to your remote Nostr signer (NIP-46)
- **logout**: Disconnect from your remote Nostr signer

### Enclave Management

Commands related to running AWS Nitro enclaves:

- **enclave ls**: List available enclaves
- **enclave inspect**: View detailed information about an enclave
- **enclave ensure-instance-signature**: Ensure ec2 instance signature exists

### Container Management

Commands for working with containers deployed in enclaved servers:

- **container ls**: List containers
- **container inspect**: View detailed information about a container
- **container pay**: Make a payment to a container

### Key Storage Service

Commands related to key storage service:

- **keycrux ls**: List key storage services
- **keycrux ping**: Check connectivity to key storage service
- **keycrux inspect**: View detailed information about a key storage
- **keycrux status**: Check status of key storage service
- **keycrux has**: Check if keys exist for a particular EC2 instance

### Wallet Management

Commands for managing wallets:

- **wallet create**: Create a new wallet
- **wallet add**: Add an existing wallet
- **wallet remove**: Remove a wallet
- **wallet default**: Set or view the default wallet
- **wallet balance**: Check wallet balance
- **wallet invoice**: Create a payment invoice
- **wallet pay**: Pay an invoice

### Nostr Wallet Connect

Commands related to Nostr Wallet Connect (NWC):

- **nwc get-info**: Get information about the NWC wallet service

### Docker Image Management

Commands for working with Docker images:

- **docker sign-release**: Sign a Docker image release
- **docker publish-release**: Publish a Docker image release announcement
- **docker inspect**: Inspect Docker image from remote hub

### Enclave Image Format (EIF)

Commands for working with Enclave Image Format files:

- **eif sign-build**: Sign an EIF image
- **eif sign-release**: Sign an EIF image release (PCR values)

## Usage

```bash
# Display help
encli --help

# Display help for a specific command group
encli enclave --help

# Run a command
encli enclave ls
```

## Development

### Setup

```bash
# Clone the repository
git clone <repository-url>
cd encli

# Install dependencies
npm install
```

### Build

```bash
npm run build
```

### Run locally

```bash
# Run the CLI directly
npm start

# Or run a specific command
npm start -- enclave ls
```

## License

MIT
