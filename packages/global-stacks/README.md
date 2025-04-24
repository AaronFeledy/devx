# @devx/global-stacks

Global stack management for DevX.

This package provides the logic for managing global stacks—services that are automatically started and stopped alongside any DevX stack. Typical use cases include shared infrastructure like routers, proxies, or databases that should always be available during development.

## Features

- Loads global stack definitions from `~/.devx/global-stacks/*.yml`
- Starts all enabled global stacks in priority order
- Stops all global stacks in reverse priority order
- Provides status for all global stacks
- Validates stack configuration using Zod schemas

## Usage

This package is not intended to be used directly. It is consumed by the DevX CLI and daemon. However, you can use the main API for testing or advanced scripting.

### Example

```ts
import { GlobalStackManager } from '@devx/global-stacks';
import { mockEngine, mockBuilder } from './mocks';

const manager = new GlobalStackManager(mockEngine, mockBuilder);
await manager.startGlobalStacks();
const status = await manager.getStatus();
await manager.stopGlobalStacks();
```

## API

### `GlobalStackManager`

- `constructor(engine: EnginePlugin, builder: BuilderPlugin)`
- `startGlobalStacks(): Promise<void>`
- `stopGlobalStacks(): Promise<void>`
- `getStatus(): Promise<Record<string, string>>`

### Configuration

- Global stacks are defined as YAML files in `~/.devx/global-stacks/`.
- Each file should match the `GlobalStackConfig` schema.

## Development

### Build

```sh
bun run build
```

### Lint

```sh
bun run lint
```

### Format

```sh
bun run format
```

### Test

```sh
bun run test
```

Tests are written with Bun's test runner. The test suite will create and clean up files in a temporary directory under your home directory.

## Notes

- This package is not meant to be run directly; use via the DevX CLI or daemon.
- For more information, see the main [DevX README](../../README.md).
