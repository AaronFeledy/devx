import { BaseCommand } from '../base-command';
import { Flags, Args } from '@oclif/core';
import { build } from '@devx/devx';

/**
 * Oclif command responsible for building a DevX development stack.
 * It parses user arguments/flags and invokes the core build functionality.
 */
export default class Build extends BaseCommand {
  static description =
    'Builds the services defined in the stack configuration.';

  static examples = [
    '$ devx build',
    '$ devx build my-stack', // Specify stack by name/path
    '$ devx build --no-cache',
    '$ devx build --service web',
  ];

  static flags = {
    'no-cache': Flags.boolean({
      description: 'Do not use cache when building images',
    }),
    pull: Flags.boolean({
      description: 'Always attempt to pull newer versions of images',
    }),
    service: Flags.string({
      multiple: true,
      char: 's',
      description: 'Build specific service(s) only',
    }),
    ...BaseCommand.baseFlags, // Include global flags
  };

  static args = {
    stack: Args.string({
      name: 'stack',
      required: false,
      description: 'Name or path of the stack. If omitted, searches locally.',
    }),
  };

  async run(): Promise<void> {
    // Parse arguments and flags using the command class itself
    const { args, flags } = await this.parse(Build);

    const stackArg = args.stack;
    // We need a way to resolve the stack identifier (name/path)
    // Using the helper method from BaseCommand
    const stackIdentifier = await this.getStackIdentifier(stackArg as string);

    // Prepare options for the core build task
    const buildOptions = {
      noCache: flags['no-cache'],
      pull: flags.pull,
      services: flags.service,
      // Pass other relevant options from flags/args
    };

    try {
      await build(stackIdentifier);
      this.log(`Build initiated for stack: ${stackIdentifier}`);
    } catch (error) {
      this.error(
        `Build failed: ${error instanceof Error ? error.message : String(error)}`,
        { exit: 1 }
      );
    }
  }
}
