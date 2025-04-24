import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command';
import { stop } from '@devx/devx';

/**
 * Oclif command to stop a DevX development stack.
 * It parses user arguments/flags and invokes the core stop functionality.
 */
export default class Stop extends BaseCommand {
  static description = 'Stops the specified development stack.';

  static examples = [
    '$ devx stop my-app',
    '$ devx stop', // Infer stack
  ];

  static flags = {
    // Define flags *specific* to stop, if any
    // Example: timeout flag
    // timeout: Flags.integer({ description: 'Timeout in seconds for stopping services'}),
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
    const { args, flags: _flags } = await this.parse(Stop);
    const stackArg = args.stack;

    try {
      const stackIdentifier = await this.getStackIdentifier(stackArg as string);
      this.log(`Attempting to stop stack: ${stackIdentifier}`);

      // Prepare options, removing the non-existent 'service' flag
      const stopOptions = {
        // timeout: flags.timeout, // Pass timeout if flag exists
      };

      // Instantiate and run executor
      await stop(stackIdentifier);

      this.log(`Stop initiated for stack: ${stackIdentifier}`);
    } catch (error) {
      this.error(
        `Stop failed: ${error instanceof Error ? error.message : String(error)}`,
        { exit: 1 }
      );
    }
  }
}
