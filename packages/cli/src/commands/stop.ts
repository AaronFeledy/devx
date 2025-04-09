import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command';
import { stop as coreStop } from '@devx/devx';

/**
 * Oclif command to stop a DevX development stack.
 * It parses user arguments/flags and invokes the core stop functionality.
 */
export default class Stop extends BaseCommand<typeof Stop> {
  static description = 'Stops the specified development stack.';

  static examples = [
    '$ devx stop my-app',
    '$ devx stop', // Infer stack
  ];

  static flags = {
    // Example: remove volumes flag
    // volumes: Flags.boolean({ char: 'v', description: 'Remove persistent volumes associated with the stack' }),
    ...BaseCommand.baseFlags,
  };

  static args = {
    stack: Args.string({
      name: 'stack',
      required: false,
      description:
        'Name or path of the stack to stop. If omitted, searches in current/parent directories.',
    }),
  };

  async run(): Promise<void> {
    const stackArg = this.args.stack;

    try {
      const stackIdentifier = await this.getStackIdentifier(stackArg);
      this.log(`Attempting to stop stack: ${stackIdentifier}`);

      // Call the core stop function
      await coreStop(stackIdentifier);

      this.log(`Stack stop initiated successfully for: ${stackIdentifier}`);
    } catch (error) {
      await this.catch(error as Error);
    }
  }
} 