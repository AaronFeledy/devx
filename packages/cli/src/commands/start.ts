import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command';
import { start as coreStart } from '@devx/devx';

/**
 * Oclif command to start a DevX development stack.
 * It parses user arguments/flags and invokes the core start functionality.
 */
export default class Start extends BaseCommand<typeof Start> {
  static description = 'Starts the specified development stack.';

  static examples = [
    '$ devx start my-app',
    '$ devx start', // Infer stack
  ];

  static flags = {
    // Example: Attach to logs flag
    // attach: Flags.boolean({ char: 'a', description: 'Attach to container logs after starting' }),
    ...BaseCommand.baseFlags,
  };

  static args = {
    stack: Args.string({
      name: 'stack',
      required: false,
      description:
        'Name or path of the stack to start. If omitted, searches in current/parent directories.',
    }),
  };

  async run(): Promise<void> {
    const stackArg = this.args.stack;

    try {
      const stackIdentifier = await this.getStackIdentifier(stackArg);
      this.log(`Attempting to start stack: ${stackIdentifier}`);

      // Call the core start function
      await coreStart(stackIdentifier);

      this.log(`Stack start initiated successfully for: ${stackIdentifier}`);
      // Core function handles build-if-needed logic and logs
    } catch (error) {
      await this.catch(error as Error);
    }
  }
} 