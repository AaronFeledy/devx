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
* [`devx help [COMMAND]`](#devx-help-command)
* [`devx plugins`](#devx-plugins)
* [`devx plugins add PLUGIN`](#devx-plugins-add-plugin)
* [`devx plugins:inspect PLUGIN...`](#devx-pluginsinspect-plugin)
* [`devx plugins install PLUGIN`](#devx-plugins-install-plugin)
* [`devx plugins link PATH`](#devx-plugins-link-path)
* [`devx plugins remove [PLUGIN]`](#devx-plugins-remove-plugin)
* [`devx plugins reset`](#devx-plugins-reset)
* [`devx plugins uninstall [PLUGIN]`](#devx-plugins-uninstall-plugin)
* [`devx plugins unlink [PLUGIN]`](#devx-plugins-unlink-plugin)
* [`devx plugins update`](#devx-plugins-update)

## `devx help [COMMAND]`

Display help for devx.

```
USAGE
  $ devx help [COMMAND...] [-n]

ARGUMENTS
  COMMAND...  Command to show help for.

FLAGS
  -n, --nested-commands  Include all nested commands in the output.

DESCRIPTION
  Display help for devx.
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v6.2.27/src/commands/help.ts)_

## `devx plugins`

List installed plugins.

```
USAGE
  $ devx plugins [--json] [--core]

FLAGS
  --core  Show core plugins.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  List installed plugins.

EXAMPLES
  $ devx plugins
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/index.ts)_

## `devx plugins add PLUGIN`

Installs a plugin into devx.

```
USAGE
  $ devx plugins add PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into devx.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the DEVX_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the DEVX_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ devx plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ devx plugins add myplugin

  Install a plugin from a github url.

    $ devx plugins add https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ devx plugins add someuser/someplugin
```

## `devx plugins:inspect PLUGIN...`

Displays installation properties of a plugin.

```
USAGE
  $ devx plugins inspect PLUGIN...

ARGUMENTS
  PLUGIN...  [default: .] Plugin to inspect.

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Displays installation properties of a plugin.

EXAMPLES
  $ devx plugins inspect myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/inspect.ts)_

## `devx plugins install PLUGIN`

Installs a plugin into devx.

```
USAGE
  $ devx plugins install PLUGIN... [--json] [-f] [-h] [-s | -v]

ARGUMENTS
  PLUGIN...  Plugin to install.

FLAGS
  -f, --force    Force npm to fetch remote resources even if a local copy exists on disk.
  -h, --help     Show CLI help.
  -s, --silent   Silences npm output.
  -v, --verbose  Show verbose npm output.

GLOBAL FLAGS
  --json  Format output as json.

DESCRIPTION
  Installs a plugin into devx.

  Uses npm to install plugins.

  Installation of a user-installed plugin will override a core plugin.

  Use the DEVX_NPM_LOG_LEVEL environment variable to set the npm loglevel.
  Use the DEVX_NPM_REGISTRY environment variable to set the npm registry.

ALIASES
  $ devx plugins add

EXAMPLES
  Install a plugin from npm registry.

    $ devx plugins install myplugin

  Install a plugin from a github url.

    $ devx plugins install https://github.com/someuser/someplugin

  Install a plugin from a github slug.

    $ devx plugins install someuser/someplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/install.ts)_

## `devx plugins link PATH`

Links a plugin into the CLI for development.

```
USAGE
  $ devx plugins link PATH [-h] [--install] [-v]

ARGUMENTS
  PATH  [default: .] path to plugin

FLAGS
  -h, --help          Show CLI help.
  -v, --verbose
      --[no-]install  Install dependencies after linking the plugin.

DESCRIPTION
  Links a plugin into the CLI for development.

  Installation of a linked plugin will override a user-installed or core plugin.

  e.g. If you have a user-installed or core plugin that has a 'hello' command, installing a linked plugin with a 'hello'
  command will override the user-installed or core plugin implementation. This is useful for development work.


EXAMPLES
  $ devx plugins link myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/link.ts)_

## `devx plugins remove [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ devx plugins remove [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ devx plugins unlink
  $ devx plugins remove

EXAMPLES
  $ devx plugins remove myplugin
```

## `devx plugins reset`

Remove all user-installed and linked plugins.

```
USAGE
  $ devx plugins reset [--hard] [--reinstall]

FLAGS
  --hard       Delete node_modules and package manager related files in addition to uninstalling plugins.
  --reinstall  Reinstall all plugins after uninstalling.
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/reset.ts)_

## `devx plugins uninstall [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ devx plugins uninstall [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ devx plugins unlink
  $ devx plugins remove

EXAMPLES
  $ devx plugins uninstall myplugin
```

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/uninstall.ts)_

## `devx plugins unlink [PLUGIN]`

Removes a plugin from the CLI.

```
USAGE
  $ devx plugins unlink [PLUGIN...] [-h] [-v]

ARGUMENTS
  PLUGIN...  plugin to uninstall

FLAGS
  -h, --help     Show CLI help.
  -v, --verbose

DESCRIPTION
  Removes a plugin from the CLI.

ALIASES
  $ devx plugins unlink
  $ devx plugins remove

EXAMPLES
  $ devx plugins unlink myplugin
```

## `devx plugins update`

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

_See code: [@oclif/plugin-plugins](https://github.com/oclif/plugin-plugins/blob/v5.4.36/src/commands/plugins/update.ts)_
<!-- commandsstop -->
