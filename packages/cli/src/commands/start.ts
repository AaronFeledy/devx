import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../base-command';
import { start } from '@devx/devx';

/**
 * Oclif command to start a DevX development stack.
 * It parses user arguments/flags and invokes the core start functionality.
 */
export default class Start extends BaseCommand {
  static description =
    'Starts the services defined in the stack configuration.';

  static examples = [
    '$ devx start',
    '$ devx start my-stack',
    '$ devx start --service web --service api', // Start specific services
  ];

  static flags = {
    service: Flags.string({
      multiple: true,
      char: 's',
      description: 'Start specific service(s) only',
    }),
    // Add other relevant flags like --recreate, --build etc. if needed
    ...BaseCommand.baseFlags,
  };

  static args = {
    stack: Args.string({
      name: 'stack',
      required: false,
      description: 'Name or path of the stack. If omitted, searches locally.',
    }),
  };

  async run(): Promise<void> {
    // Parse args and flags
    const { args, flags } = await this.parse(Start);

    const stackArg = args.stack;

    // Resolve stack identifier
    const stackIdentifier = await this.getStackIdentifier(stackArg as string);

    // Prepare options
    const startOptions = {
      services: flags.service,
      // Pass other options like recreate, build based on flags
    };

    try {
      // Instantiate and run executor
      await start(stackIdentifier);
      this.log(`Start initiated for stack: ${stackIdentifier}`);
    } catch (error) {
      this.error(
        `Start failed: ${error instanceof Error ? error.message : String(error)}`,
        { exit: 1 }
      );
    }
  }
}
