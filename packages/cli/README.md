# @devx/cli

This package provides the Command Line Interface (CLI) for DevX.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@devx/cli.svg)](https://npmjs.org/package/@devx/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@devx/cli.svg)](https://npmjs.org/package/@devx/cli)
[![License](https://img.shields.io/npm/l/@devx/cli.svg)](https://github.com/AaronFeledy/devx/blob/main/packages/cli/package.json)

<!-- toc -->
* [@devx/cli](#devxcli)
<!-- tocstop -->

## Usage

```sh
$ npm install -g @devx/cli
$ devx COMMAND
running command...
$ devx (--version)
@devx/cli/0.1.0
$ devx --help [COMMAND]
USAGE
  $ devx COMMAND
...
```

## Commands

<!-- commands -->
* [`devx build [STACK]`](#devx-build-stack)
* [`devx destroy [STACK]`](#devx-destroy-stack)
* [`devx init`](#devx-init)
* [`devx start [STACK]`](#devx-start-stack)
* [`devx status [STACKIDENTIFIER]`](#devx-status-stackidentifier)
* [`devx stop [STACK]`](#devx-stop-stack)

## `devx build [STACK]`

Builds the specified development stack.

```
USAGE
  $ devx build [STACK]

ARGUMENTS
  STACK  Name or path of the stack to build. If omitted, searches in current/parent directories.

DESCRIPTION
  Builds the specified development stack.

EXAMPLES
  $ devx build my-app

  $ devx build ./path/to/my-project/

  $ devx build
```

## `devx destroy [STACK]`

Destroys the specified development stack and associated resources.

```
USAGE
  $ devx destroy [STACK] [-f]

ARGUMENTS
  STACK  Name or path of the stack to destroy. If omitted, searches in current/parent directories.

FLAGS
  -f, --force  Force destruction without confirmation

DESCRIPTION
  Destroys the specified development stack and associated resources.

EXAMPLES
  $ devx destroy my-app

  $ devx destroy

  $ devx destroy my-app --force
```

## `devx init`

Initializes a new DevX stack configuration (`.stack.yml`).

```
USAGE
  $ devx init [-f] [--name <value>] [--recipe <value>]

FLAGS
  -f, --force           Overwrite existing .stack.yml file.
      --name=<value>    Name of the stack (defaults to directory name)
      --recipe=<value>  Use a predefined recipe (e.g., lamp)

DESCRIPTION
  Initializes a new DevX stack configuration (`.stack.yml`).

EXAMPLES
  $ devx init

  $ devx init --name my-project

  $ devx init --recipe lamp

  $ devx init --recipe lamp db=postgres web=nginx

  $ devx init web=nginx:latest db=postgres:15 ports.web=8080:80
```

## `devx start [STACK]`

Starts the specified development stack.

```
USAGE
  $ devx start [STACK]

ARGUMENTS
  STACK  Name or path of the stack to start. If omitted, searches in current/parent directories.

DESCRIPTION
  Starts the specified development stack.

EXAMPLES
  $ devx start my-app

  $ devx start
```

## `devx status [STACKIDENTIFIER]`

Gets the current status of a DevX stack.

```
USAGE
  $ devx status [STACKIDENTIFIER]

ARGUMENTS
  STACKIDENTIFIER  [default: .] Name of the stack or path to its configuration file (defaults to finding .stack.yml in
                   current or parent dirs)

DESCRIPTION
  Gets the current status of a DevX stack.

EXAMPLES
  $ devx status

  $ devx status my-app

  $ devx status ./path/to/project
```

## `devx stop [STACK]`

Stops the specified development stack.

```
USAGE
  $ devx stop [STACK]

ARGUMENTS
  STACK  Name or path of the stack to stop. If omitted, searches in current/parent directories.

DESCRIPTION
  Stops the specified development stack.

EXAMPLES
  $ devx stop my-app

  $ devx stop
```
<!-- commandsstop -->
