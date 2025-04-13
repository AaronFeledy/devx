#!/usr/bin/env node

import { run } from '@oclif/core';
import '@devx/plugin-podman';
import '@devx/plugin-podman-compose';
import '@devx/plugin-router';
import { pluginManager } from '@devx/common';

// Register plugins
console.log('DevX CLI Initializing...');
console.log(
  'Registered Engine Plugins:',
  pluginManager.getEnginePlugins().map((p) => p.name)
);
console.log(
  'Registered Builder Plugins:',
  pluginManager.getBuilderPlugins().map((p) => p.name)
);

// Run the CLI
run().catch((error) => {
  console.error(error);
  process.exit(1);
});
