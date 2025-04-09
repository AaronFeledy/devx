# @devx/cli

This package provides the Command Line Interface (CLI) for DevX.

[![oclif](https://img.shields.io/badge/cli-oclif-brightgreen.svg)](https://oclif.io)
[![Version](https://img.shields.io/npm/v/@devx/cli.svg)](https://npmjs.org/package/@devx/cli)
[![Downloads/week](https://img.shields.io/npm/dw/@devx/cli.svg)](https://npmjs.org/package/@devx/cli)
[![License](https://img.shields.io/npm/l/@devx/cli.svg)](https://github.com/AaronFeledy/devx/blob/main/packages/cli/package.json)

<!-- toc -->
* [Usage](#usage)
* [Commands](#commands)
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
* [`devx help [COMMANDS]`](#devx-help-commands)
* [`devx init`](#devx-init)
* [`devx plugins`](#devx-plugins)
* [`devx plugins:install PLUGIN...`](#devx-pluginsinstall-plugin)
* [`devx plugins:inspect PLUGIN...`](#devx-pluginsinspect-plugin)
* [`devx plugins:install PLUGIN...`](#devx-pluginsinstall-plugin-1)
* [`devx plugins:link PLUGIN`](#devx-pluginslink-plugin)
* [`devx plugins:uninstall PLUGIN...`](#devx-pluginsuninstall-plugin)
* [`devx plugins:uninstall PLUGIN...`](#devx-pluginsuninstall-plugin-1)
* [`devx plugins:uninstall PLUGIN...`](#devx-pluginsuninstall-plugin-2)
* [`devx plugins update`](#devx-plugins-update)
* [`devx start [STACK]`](#devx-start-stack)
* [`devx stop [STACK]`](#devx-stop-stack)

### `devx build [STACK]`

Builds the specified development stack.

```
USAGE
  $ devx build [STACK]

ARGUMENTS
  STACK  Name or path of the stack to build. If omitted, searches in current/parent directories.

DESCRIPTION
  Builds the specified development stack.
  Uses the builder plugin defined in the .stack.yml or the global default.
  Generates necessary container images and configurations.

EXAMPLES
  $ devx build my-app

  $ devx build ./path/to/my-project/
```

### `devx destroy [STACK]`

Destroys the specified development stack and associated resources.

```
USAGE
  $ devx destroy [STACK]

ARGUMENTS
  STACK  Name or path of the stack to destroy. If omitted, searches in current/parent directories.

DESCRIPTION
  Destroys the specified development stack and associated resources.
  Removes containers, volumes, networks, and potentially build artifacts.

EXAMPLES
  $ devx destroy my-app
```

### `devx help [COMMANDS]`

Display help for devx.

```
USAGE
  $ devx help [COMMANDS] [-n]

ARGUMENTS
  COMMANDS  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for devx.
```

*See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.5/src/commands/help.ts)*

### `devx init`

Initializes a new DevX stack configuration (`.stack.yml`).

```
USAGE
  $ devx init [-f]

FLAGS
  -f, --force  Overwrite existing .stack.yml file.

DESCRIPTION
  Initializes a new DevX stack configuration (`.stack.yml`).
  Prompts the user for stack details if not provided via arguments or flags (TUI).

EXAMPLES
  $ devx init

  $ devx init db=postgres web=nginx cache=redis
```

### `devx plugins`

List installed plugins.

```
USAGE
  $ devx plugins [--core]

FLAGS
  --core  Show core plugins.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ devx plugins
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/index.ts)*

### `devx plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ devx plugins:install PLUGIN... [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ devx plugins add

EXAMPLES
  Install a plugin from npm registry

    $ devx plugins:install myplugin


  Install a plugin from a github URL

    $ devx plugins:install https://github.com/someuser/someplugin


  Install a plugin from a github URL using a specific tag

    $ devx plugins:install https://github.com/someuser/someplugin#tag


  Install a plugin from a github URL using a specific branch

    $ devx plugins:install https://github.com/someuser/someplugin#branch


  Install a plugin from a github URL using a specific commit sha

    $ devx plugins:install https://github.com/someuser/someplugin#commit


  Install a plugin locally from ./some/path/nested/plugin

    $ devx plugins:install ./some/path/nested/plugin


  Install a plugin from npm registry with tag

    $ devx plugins:install myplugin@tag


  Install a plugin from npm registry with version

    $ devx plugins:install myplugin@1.0.0


  Install a plugin from npm registry with version range

    $ devx plugins:install myplugin@^1.0.0


  Install a plugin from a url

    $ devx plugins:install https://example.com/myplugin.tgz
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/install.ts)*

### `devx plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ devx plugins:inspect PLUGIN... [-h] [-v]

ARGUMENTS
  PLUGIN  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ devx plugins:inspect myplugin
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/inspect.ts)*

### `devx plugins:install PLUGIN...`

Installs a plugin into the CLI.

```
USAGE
  $ devx plugins:install PLUGIN... [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN  Plugin to install.

FLAGS
  -f, --force    Run yarn install with force flag.
  -h, --help     Show CLI help.
  -s, --silent   Silences yarn output.
  -v, --verbose  Show verbose yarn output.

DESCRIPTION
  Installs a plugin into the CLI.
  Can be installed from npm or a git url.

  Installation of a user-installed plugin will override a core plugin.

  e.g. If you have a core plugin that has a 'hello' command, installing a user-installed plugin with a 'hello' command
  will override the core plugin implementation. This is useful if a user needs to update core plugin functionality in
  the CLI without the need to patch and update the whole CLI.

ALIASES
  $ devx plugins add

EXAMPLES
  Install a plugin from npm registry

    $ devx plugins:install myplugin


  Install a plugin from a github URL

    $ devx plugins:install https://github.com/someuser/someplugin


  Install a plugin from a github URL using a specific tag

    $ devx plugins:install https://github.com/someuser/someplugin#tag


  Install a plugin from a github URL using a specific branch

    $ devx plugins:install https://github.com/someuser/someplugin#branch


  Install a plugin from a github URL using a specific commit sha

    $ devx plugins:install https://github.com/someuser/someplugin#commit


  Install a plugin locally from ./some/path/nested/plugin

    $ devx plugins:install ./some/path/nested/plugin


  Install a plugin from npm registry with tag

    $ devx plugins:install myplugin@tag


  Install a plugin from npm registry with version

    $ devx plugins:install myplugin@1.0.0


  Install a plugin from npm registry with version range

    $ devx plugins:install myplugin@^1.0.0


  Install a plugin from a url

    $ devx plugins:install https://example.com/myplugin.tgz
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/install.ts)*

### `devx plugins:link PLUGIN`

Links a plugin into the CLI for development.

```
USAGE
  $ devx plugins:link PLUGIN [-h] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Links a plugin into the CLI for development.
  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a
  'hello' command will override the user-installed or core plugin implementation. This is useful for development work.

EXAMPLES
  $ devx plugins:link myplugin
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/link.ts)*

### `devx plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ devx plugins:uninstall PLUGIN... [-h] [-v]

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ devx plugins unlink
  $ devx plugins remove
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/uninstall.ts)*

### `devx plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ devx plugins:uninstall PLUGIN... [-h] [-v]

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ devx plugins unlink
  $ devx plugins remove
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/uninstall.ts)*

### `devx plugins:uninstall PLUGIN...`

Removes a plugin from the CLI.

```
USAGE
  $ devx plugins:uninstall PLUGIN... [-h] [-v]

ARGUMENTS
  PLUGIN  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ devx plugins unlink
  $ devx plugins remove
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/uninstall.ts)*

### `devx plugins update`

Update installed plugins.

```
USAGE
  $ devx plugins update [-h] [-v]

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Update installed plugins.
```

*See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.1.1/src/commands/plugins/update.ts)*

### `devx start [STACK]`

Starts the specified development stack.

```
USAGE
  $ devx start [STACK]

ARGUMENTS
  STACK  Name or path of the stack to start. If omitted, searches in current/parent directories.

DESCRIPTION
  Starts the specified development stack.
  Builds the stack first if it hasn't been built.
  Uses the engine plugin defined in the .stack.yml or the global default to run the stack components.

EXAMPLES
  $ devx start my-app
```

### `devx stop [STACK]`

Stops the specified development stack.

```
USAGE
  $ devx stop [STACK]

ARGUMENTS
  STACK  Name or path of the stack to stop. If omitted, searches in current/parent directories.

DESCRIPTION
  Stops the specified development stack.
  Uses the engine plugin to stop the running components.

EXAMPLES
  $ devx stop my-app
```
<!-- commandsstop -->
