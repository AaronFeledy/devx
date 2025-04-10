#!/usr/bin/env -S node --loader ts-node/esm --no-warnings=ExperimentalWarning

// This script allows running the CLI directly from TypeScript source
// using ts-node during development.

import oclif from '@oclif/core';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name in an ESM context
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set NODE_ENV to development if not already set
process.env.NODE_ENV = process.env.NODE_ENV || 'development';

// Find the root of the CLI project (packages/cli)
const projectRoot = path.join(__dirname, '..');

async function runDev() {
  try {
    // Execute oclif's run method, pointing to the project root
    await oclif.execute({ development: true, dir: projectRoot });
  } catch (error) {
    oclif.Errors.handle(error);
  }
}

runDev();
