#!/usr/bin/env bun

import { dirname } from 'path';
import { fileURLToPath } from 'url';
import { run } from '@oclif/core';
import { pluginManager } from '@devx/common';

// Import plugins
import '@devx/plugin-podman';
import '@devx/plugin-podman-compose';
import '@devx/plugin-router';

// Get the directory name of the current module
const __dirname = dirname(fileURLToPath(import.meta.url));

// Initialize plugins
console.log('DevX CLI Initializing...');

// Log registered plugins
const enginePlugins = pluginManager.getEnginePlugins();
const builderPlugins = pluginManager.getBuilderPlugins();

console.log(
  'Registered Engine Plugins:',
  enginePlugins.map((p) => p.name)
);
console.log(
  'Registered Builder Plugins:',
  builderPlugins.map((p) => p.name)
);

// Run the CLI
await run().catch((error) => {
  console.error(error);
  process.exit(1);
});
