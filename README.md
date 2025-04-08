# DevX

**DevX** is a powerful, flexible tool designed to simplify the creation and management of development environments across different platforms. Whether you're working on local development or setting up environments for CI/CD pipelines, DevX provides a seamless experience by abstracting container management and orchestration tools like Podman and podman-compose. Built with Bun and TypeScript, DevX is a monorepo project that offers a CLI, a REST API, and a modular plugin system for extensibility.

## Table of Contents

- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)
  - [CLI](#cli)
  - [REST API](#rest-api)
- [Configuration](#configuration)
  - [Stack Definition](#stack-definition)
  - [Global Configuration](#global-configuration)
- [Plugins](#plugins)
  - [Engine Plugins](#engine-plugins)
  - [Builder Plugins](#builder-plugins)
  - [Recipes](#recipes)
  - [Tasks](#tasks)
- [Global Stacks](#global-stacks)
- [Contributing](#contributing)
- [License](#license)

## Features

- **Cross-Platform Support**: Works on Linux, macOS, and Windows.
- **Container Management Abstraction**: Supports multiple container engines (initially Podman) through a plugin system.
- **Orchestration Abstraction**: Supports orchestrators like podman-compose, with easy extension to others.
- **Stack Definitions**: Define development environments using a simple YAML or JSON configuration, inspired by docker-compose and Lando.
- **CLI and REST Interfaces**: Manage environments via command-line or REST API.
- **Recipes**: Use pre-configured stack templates (e.g., LAMP) for quick setup.
- **Global Stacks**: Automatically start services like a Traefik-based router for easy access to web servers.
- **Task Automation**: Define and run tasks on the host or within containers.
- **Isolation**: Manage multiple stacks simultaneously without conflicts.

## Installation

DevX is distributed as a single executable file, making installation straightforward.

### Prerequisites

- [Bun](https://bun.sh/) (for development and building)
- [Podman](https://podman.io/) (downloaded automatically on first run)

### Install DevX

1. Download the latest release from the [releases page](https://github.com/your-org/devx/releases).
2. Make the binary executable (on Linux/macOS):
   ```sh
   chmod +x devx
   ```
3. Move it to a directory in your PATH:
   ```sh
   mv devx /usr/local/bin/
   ```

Alternatively, you can build DevX from source:

```sh
git clone https://github.com/your-org/devx.git
cd devx
bun install
bun build ./packages/cli/index.ts --outdir dist --target bun
```

## Usage

### CLI

The DevX CLI provides a simple interface to manage your development environments.

#### Basic Commands

- **Build a stack**: `devx build [stack-name]`
- **Start a stack**: `devx start [stack-name]`
- **Stop a stack**: `devx stop [stack-name]`
- **Destroy a stack**: `devx destroy [stack-name]`
- **Initialize a new stack**: `devx init [options]`

If no `stack-name` is provided, DevX will look for a `.stack.yml` in the current or parent directories.

#### Initialization

To create a new stack, use the `init` command. You can pass options directly or use the interactive TUI.

- **Interactive**: `devx init` or `devx init lamp`
- **With options**: `devx init lamp database=mysql web=apache`

### REST API

DevX also provides a REST API for programmatic control.

- Start the daemon: `devx daemon`
- API Endpoints:
  - `POST /stacks/:name/build`
  - `POST /stacks/:name/start`
  - `POST /stacks/:name/stop`
  - `POST /stacks/:name/destroy`
  - `GET /stacks/:name/status`

## Configuration

### Stack Definition

Stacks are defined using a `.stack.yml` file, similar to docker-compose. Here's an example:

```yaml
name: my-stack
services:
  app:
    image: my-app:latest
    ports:
      - "8080:80"
  db:
    image: mysql:8.0
    environment:
      MYSQL_ROOT_PASSWORD: secret
```

### Global Configuration

Global settings, such as the default engine and builder plugins, are stored in `~/.devx/config.yml`. You can override these settings in individual stack configurations.

## Plugins

DevX is highly extensible through its plugin system.

### Engine Plugins

Engine plugins manage container runtimes. The default plugin is for Podman.

### Builder Plugins

Builder plugins handle orchestration. The default plugin is for podman-compose.

### Recipes

Recipes provide pre-configured stack templates. For example, the LAMP recipe sets up a Linux, Apache, MySQL, and PHP environment.

### Tasks

Tasks allow you to define and run sequences of commands on the host or within containers.

## Global Stacks

Global stacks, like the Traefik router, are automatically started when any stack is active. They provide shared services across all stacks.

## Contributing

We welcome contributions! Please see our [contributing guidelines](CONTRIBUTING.md) for more details.
