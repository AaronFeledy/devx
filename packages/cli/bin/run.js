#!/usr/bin/env node

// This is the main entry point for the CLI

// Use dynamic import for ESM compatibility if needed in the future
// but for now, commonjs require is simpler for bin scripts.
const oclif = require('@oclif/core');

// In dev mode -> use ts-node and dev path
process.env.NODE_ENV = 'development';

oclif
  .run(process.argv.slice(2), __dirname)
  .then(oclif.flush)
  .catch(oclif.Errors.handle);
