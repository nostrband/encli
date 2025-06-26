# Context file for AI agents

This project is a command-line interface for "enclaved" server and it's ecosystem. 

## Building and testing

The project is built into "encli" binary. 

When adding new features, project must be rebuilt using `npm run build` and then the built code can be launched using `npm start -- <params>`.

## Configuration file

The utility relies on `~/.encli.json` file to store it's configuration, the config file is managed by the `modules/conf.ts` module. 

## Nostr Wallet Connect (NWC)

The `nwc` group of commands relies on `@getalby/sdk` package, check `commands/nwc/get_info.ts` for an example of usage.