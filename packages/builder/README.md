# `@devx/builder`

This package provides the abstraction layer for container orchestrators within the DevX ecosystem.

## Overview

The primary goal of the `@devx/builder` package is to decouple the core DevX logic from specific orchestration tools like `podman-compose`, `docker-compose`, or potentially Kubernetes controllers.

It achieves this through a plugin system:

1.  **`BuilderPlugin` Interface**: Defines a standard contract (`src/types.ts`) that all builder plugins must implement. This interface includes methods for core lifecycle operations: `generateConfig`, `build`, `start`, `stop`, and `destroy`.
2.  **Plugin Registry**: A simple registry (`src/index.ts`) allows different builder plugins to be registered and retrieved by name.
3.  **Concrete Implementations**: Specific plugins (like `src/plugins/podman-compose.ts`) implement the `BuilderPlugin` interface, handling the translation of the generic `StackConfig` (from `@devx/stack`) into the orchestrator's specific format and executing the necessary commands.

## Features

- **Orchestrator Abstraction**: Allows DevX to support different backend orchestrators without changing the core CLI or stack definition logic.
- **Extensibility**: New orchestrators can be supported by creating a new class that implements the `BuilderPlugin` interface and registering it.
- **Configuration Generation**: Handles the creation of orchestrator-specific configuration files (e.g., `podman-compose.yaml`) based on the DevX stack definition.

## Default Plugin

- **`podman-compose`**: The default builder plugin uses `podman-compose` to manage the stack.

## Usage (Internal)

This package is primarily intended for internal use by `@devx/devx`.

Example Usage

```typescript
import { PodmanComposeBuilder } from '@devx/plugin-podman-compose';
import type { StackConfig } from '@devx/common';
import { logger } from '@devx/common';
import { getBuilderPlugin, BuilderPlugin } from '@devx/builder';

async function manageStack(
  stackConfig: StackConfig,
  projectPath: string,
  action: 'start' | 'stop'
) {
  // Determine the builder name (from config or default)
  const builderName = stackConfig.builder || 'podman-compose';

  const builder: BuilderPlugin | undefined = getBuilderPlugin(builderName);

  if (!builder) {
    throw new Error(`Builder plugin "${builderName}" not found.`);
  }

  try {
    switch (action) {
      case 'start':
        await builder.start(stackConfig, projectPath);
        console.log(
          `Stack "${stackConfig.name}" started using ${builder.name}.`
        );
        break;
      case 'stop':
        await builder.stop(stackConfig, projectPath);
        console.log(
          `Stack "${stackConfig.name}" stopped using ${builder.name}.`
        );
        break;
      // Add cases for build, destroy, generateConfig etc.
    }
  } catch (error) {
    console.error(`Failed to ${action} stack "${stackConfig.name}":`, error);
  }
}
```

## Contributing

To add support for a new orchestrator:

1.  Create a new file in `src/plugins/` (e.g., `docker-compose.ts`).
2.  Implement the `BuilderPlugin` interface from `src/types.ts`.
    - Translate the `StackConfig` fields to the target orchestrator's format in `generateConfig`.
    - Implement the `build`, `start`, `stop`, and `destroy` methods using the orchestrator's CLI commands or API (potentially using a shared `runCommand` utility).
3.  Register an instance of your new plugin in `src/index.ts`.
4.  Add tests for your plugin.

## Testing

To run unit tests for this package:

```sh
bun run test
```

This will execute all tests in the `test/` directory using Bun's test runner. Ensure you have Bun installed and all dependencies are installed via `bun install`.
