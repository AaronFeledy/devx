# @devx/engine

This package provides the core engine functionality for DevX, abstracting container management tools for runtime operations.

## Overview

The engine package defines a standard interface (`EnginePlugin`) for interacting with different container runtimes (like Podman or Docker). It allows DevX to start, stop, check the status of, and destroy application stacks defined in `.stack.yml` files.

## Features

- Pluggable architecture for supporting different container runtimes.
- Interface for managing the lifecycle of containerized stacks.
- Initial implementation for Podman.

## Usage

This package is primarily used internally by the `@devx/devx` package. Users typically interact with the engine through the DevX CLI commands (`devx start`, `devx stop`, etc.).
