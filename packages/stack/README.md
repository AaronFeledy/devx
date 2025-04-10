# @devx/stack

This package is responsible for defining, parsing, validating, and managing DevX stack configurations.

Stacks define the services, networks, volumes, and other resources required for a development environment, typically specified in a `.stack.yml` file within a project.

## Features

- **Stack Configuration Schema**: Defines the structure of `.stack.yml` files using Zod, inspired by `docker-compose` and Lando.
- **Parsing**: Reads and parses stack configurations from `.yaml`, `.yml`, or `.json` files using the `yaml` library (chosen to preserve comments if needed later).
- **Validation**: Validates the parsed configuration against the defined schema, providing detailed error messages.
- **Stack Loading**: Finds stack configuration files by searching upwards from the current directory or by direct path/name (future).
- **Metadata Management**: Stores and retrieves basic metadata about managed stacks (like configuration path and status) in `~/.devx/stacks/`.

## Core Concepts

- **`.stack.yml`**: The primary configuration file for defining a DevX stack.
- **`StackConfig`**: The TypeScript type representing a validated stack configuration object.
- **`ServiceConfig`**: The TypeScript type representing the configuration for a single service within a stack.
- **Stack Metadata**: Information about managed stacks stored persistently in the user's home directory.

## Key Exports

- `StackConfigSchema`: The Zod schema for validating stack configurations.
- `StackConfig`, `ServiceConfig`: TypeScript types inferred from the schemas.
- `parseStackConfigFile(filePath: string): Promise<StackConfig>`: Parses and validates a configuration file.
- `loadStackConfig(identifier?: string, cwd?: string): Promise<StackConfig>`: Finds, loads, and validates a stack configuration based on an identifier or local search, and saves metadata.
- `listStacks(): Promise<string[]>`: Lists the names of all known stacks based on stored metadata.
- `getStackMetadata(stackName: string): Promise<StackMetadata | null>`: Retrieves the stored metadata for a specific stack.
- `updateStackStatus(stackName: string, status: StackMetadata['status'], errorMessage?: string): Promise<void>`: Updates the status field in a stack's metadata.
- `StackParseError`: Custom error class for parsing/validation issues.

## Usage Example (Internal)

```typescript
import { loadStackConfig, listStacks, StackParseError } from '@devx/stack';

try {
  // Load stack config from .stack.yml found in current or parent dir
  const config = await loadStackConfig();
  console.log(`Loaded stack: ${config.name}`);

  // List known stacks
  const stacks = await listStacks();
  console.log('Known stacks:', stacks);
} catch (error) {
  if (error instanceof StackParseError) {
    console.error(`Stack Configuration Error: ${error.message}`);
    if (error.originalError) {
      console.error('Caused by:', error.originalError);
    }
  } else {
    console.error('Failed to load stack:', error);
  }
}
```
