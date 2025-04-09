# @devx/devx

This package provides the core functionality for DevX, integrating the `stack`, `builder`, and `engine` packages.

## Overview

The `devx` package acts as the central coordinator. It exposes the main APIs (`build`, `start`, `stop`, `destroy`) that are consumed by the CLI or potentially other integrations. It handles loading stack configurations, managing global settings, tracking stack state, and orchestrating the builder and engine plugins.

## Features

- Core API for managing the lifecycle of development stacks.
- Integration with `@devx/stack` for configuration loading.
- Integration with `@devx/builder` for building container images and configurations.
- Integration with `@devx/engine` for running and managing containers.
- Global configuration management (`~/.devx/config.json`).
- Stack state tracking (`~/.devx/state.json`).

## Usage

This package is primarily used by the `@devx/cli` and `@devx/rest packages. Direct usage is possible for programmatic control over DevX stacks.

```typescript
import { build, start, stop, destroy } from '@devx/devx';

// Example (assuming a .stack.yml exists for 'my-app')
async function manageStack() {
  await build('my-app');
  await start('my-app');
  // ... do something ...
  await stop('my-app');
  await destroy('my-app');
}
```
