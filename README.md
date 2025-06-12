# encli

CLI utilities for working with enclaved application server for TEEs.

## Installation

```bash
npm install -g encli
```

Or use it directly with npx:

```bash
npx encli [command]
```

## Usage

```bash
# Display help
encli --help

# Run the test command
encli test

# Run the test command with verbose output
encli test --verbose
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
npm start -- test
```

### Test

```bash
npm test
```

## License

MIT
