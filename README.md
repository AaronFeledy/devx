# DevX

**DevX** is a powerful, flexible tool designed to simplify the creation and management of development environments across different platforms. Whether you're working on local development or setting up environments for CI/CD pipelines, DevX provides a seamless experience by abstracting container management and orchestration tools like Podman and podman-compose. Built with Bun and TypeScript, DevX is a monorepo project that offers a CLI, a REST API, and a modular plugin system for extensibility.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [CLI](#cli)
  - [REST API](#rest-api)
- [Configuration](#configuration)
  - [Stack Definition (`.stack.yml`)](#stack-definition-stackyml)
  - [Global Configuration](#global-configuration)
- [Architecture](#architecture)
  - [Core Packages](#core-packages)
  - [Plugin System](#plugin-system)
    - [Engine Plugins](#engine-plugins)
    - [Builder Plugins](#builder-plugins)
    - [Recipes](#recipes)
    - [Tasks](#tasks)
- [Global Stacks](#global-stacks)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Cross-Platform Support**: Works on Linux, macOS, and Windows.
- **Container Management Abstraction**: Supports multiple container engines (initially Podman) through Engine plugins.
- **Orchestration Abstraction**: Supports orchestrators like podman-compose via Builder plugins, with easy extension to others.
- **Stack Definitions**: Define development environments using a simple YAML configuration (`.stack.yml`), inspired by docker-compose and Lando.
- **CLI and REST Interfaces**: Manage environments via command-line or REST API.
- **Recipes**: Use pre-configured stack templates (e.g., LAMP) for quick setup.
- **Global Stacks**: Automatically start services like a Traefik-based router for easy access to web servers.
- **Task Automation**: Define and run tasks on the host or within containers.
- **Isolation**: Manage multiple stacks simultaneously without conflicts.

## Installation

DevX is distributed as a single executable file, making installation straightforward.

### Prerequisites

- [Bun](https://bun.sh/) (for development and building the project from source)
- Container Engine: Podman is the default and recommended engine. DevX may attempt to help with installation or provide guidance.
- Orchestrator (for default Builder): Podman Compose is used by the default builder plugin.

### Install DevX

1. Download the latest release from the [releases page](https://github.com/AaronFeledy/devx/releases) (Link TBD).
2. Make the binary executable (on Linux/macOS):
   ```sh
   chmod +x devx
   ```
3. Move it to a directory in your PATH:
   ```sh
   mv devx /usr/local/bin/
   ```

### Build from Source

```sh
# Clone the repository
git clone https://github.com/AaronFeledy/devx.git
cd devx

# Install dependencies
bun install

# Build the project
bun run build

# The executable is in packages/cli/dist/index.js
# Make it executable and move it to your PATH
chmod +x packages/cli/dist/index.js
mv packages/cli/dist/index.js /usr/local/bin/devx
```

The build process:

1. Compiles TypeScript code
2. Generates the oclif manifest
3. Bundles the CLI and all plugins into a single executable
4. Creates source maps for debugging

## Usage

### CLI

The DevX CLI provides a simple interface to manage your development environments based on a `.stack.yml` file in your project.

#### Basic Commands

- **Initialize a new stack**: `devx init [recipe-name] [options]` (Creates a `.stack.yml`)
- **Build stack images**: `devx build [stack-name]`
- **Start a stack**: `devx start [stack-name]` (Implies build if needed)
- **Stop a stack**: `devx stop [stack-name]`
- **Destroy a stack**: `devx destroy [stack-name]` (Stops and removes containers, networks, volumes)
- **Get stack status**: `devx status [stack-name]`
- **List available stacks**: `devx list`

If no `stack-name` is provided, DevX will look for a `.stack.yml` in the current or parent directories and use the `name` property within that file.

#### Initialization Examples

```sh
# Interactively create a .stack.yml
devx init

# Create a .stack.yml using the 'lamp' recipe
devx init lamp

# Create a .stack.yml for lamp with specific overrides
devx init lamp database=mysql web=nginx runtime=php:8.2
```

### REST API

DevX can run as a daemon providing a REST API for programmatic control.

- Start the daemon: `devx daemon start`
- Stop the daemon: `devx daemon stop`
- API Endpoints (Example - TBD):
  - `GET /stacks` - List managed stacks
  - `POST /stacks` - Create/initialize a stack from config
  - `GET /stacks/:name` - Get status of a specific stack
  - `POST /stacks/:name/start`
  - `POST /stacks/:name/stop`
  - `POST /stacks/:name/build`
  - `DELETE /stacks/:name` (Destroy)
  - `GET /stacks/:name/config` (Get the config definition for the stack)

> **Note:** The REST API server is not a standalone executable. The recommended way to run the REST API is via the CLI (`devx daemon start`), which handles dependency injection and server startup for you.
>
> For advanced/programmatic use, you can create and run the REST API server yourself:
>
> ```ts
> import { createApp } from '@devx/rest';
> import { logger } from '@devx/common';
> import * as stackManager from '@devx/stack';
>
> const app = createApp({ stackManager, logger });
> app.listen(3000);
> ```

## Configuration

### Stack Definition (`.stack.yml`)

Stacks are defined using a `.stack.yml` file in your project root, similar to docker-compose but potentially with higher-level abstractions provided by DevX recipes and plugins.

```yaml
# .stack.yml
name: my-web-app # Unique name for this stack

# Optional: Specify which builder/engine plugins to use (if not default)
# builder: podman-compose
# engine: podman

services:
  app:
    # Can be an image name or a build context
    image: my-custom-app:latest
    # Or use build:
    # build: ./app
    ports:
      - '8080:80'
    volumes:
      - ./app:/var/www/html
    environment:
      - APP_ENV=development
    depends_on:
      - db

  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: supersecret
      MYSQL_DATABASE: myapp_db
    volumes:
      - db_data:/var/lib/mysql

# Define named volumes
volumes:
  db_data: {}
# Define networks (often handled automatically)
# networks:
#   frontend:
#   backend:
```

### Global Configuration

Global settings (like the default engine and builder plugins, path to configurations, etc.) are stored in `~/.config/devx/config.yml` or a similar platform-specific location. These can be overridden by environment variables or settings within a specific `.stack.yml`.

## Architecture

DevX utilizes a monorepo structure managed with Bun workspaces. The project is built with TypeScript and uses Bun's bundler to create a single executable that includes all necessary plugins and dependencies.

### Core Packages

- **`@devx/cli`**: Provides the command-line interface.
- **`@devx/stack`**: Handles parsing, validation, and management of `.stack.yml` configurations.
- **`@devx/builder`**: Abstract interface and plugin system for orchestrators (like podman-compose).
- **`@devx/engine`**: Abstract interface and plugin system for container runtimes (like Podman).
- **`@devx/rest`**: Provides the REST API daemon.
- **`@devx/common`**: Shared utilities, types, and plugin management.

### Plugin System

DevX is designed to be extensible through various plugin types.

#### Engine Plugins

Engine plugins manage the interaction with container runtimes (Podman, Docker, etc.). They handle tasks like pulling images, managing containers directly (if needed), and inspecting runtime state.
The default engine is Podman.

#### Builder Plugins

Builder plugins abstract the container _orchestration_ layer. They take the validated `StackConfig` from the `@devx/stack` package and translate it into the format required by a specific orchestrator (like podman-compose, docker-compose, Kubernetes Kompose, etc.). They then invoke the orchestrator's commands (`up`, `down`, `build`). The default builder is `podman-compose`.

#### Recipes

Recipes provide pre-configured `.stack.yml` templates for common development setups (e.g., LAMP, MEAN, WordPress). The `devx init [recipe]` command uses these.

#### Tasks

Tasks allow defining and running sequences of commands either on the host machine or within specific service containers of a running stack (e.g., database migrations, dependency installation).

## Global Stacks

Global stacks, like the Traefik-based router, could be automatically started when any DevX-managed stack is active. They provide shared services (like reverse proxying) across all local development stacks.

## Contributing

We welcome contributions! Please see our [CONTRIBUTING.md](CONTRIBUTING.md) (to be created) for guidelines on setting up the development environment, coding standards, and submitting pull requests.

Key Steps:

1. Fork the repository.
2. Clone your fork.
3. Run `bun install` in the root directory.
4. Make your changes in the relevant package(s).
5. Add tests for your changes.
6. Run `bun run build` and `bun run lint`.
7. Submit a pull request.
