import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command';
import { build as coreBuild } from '@devx/devx'; // Import the core build function

/**
 * Oclif command responsible for building a DevX development stack.
 * It parses user arguments/flags and invokes the core build functionality.
 */
export default class Build extends BaseCommand<typeof Build> {

  static description = 'Builds the specified development stack.';

  static examples = [
    '$ devx build my-app',
    '$ devx build ./path/to/my-project/', // Example using path
    '$ devx build', // Example inferring from current dir
  ];

  static flags = {
    // Example: force rebuild flag
    // force: Flags.boolean({ char: 'f', description: 'Force rebuild even if up-to-date' }),
    ...BaseCommand.baseFlags, // Include flags from BaseCommand
  };

  static args = {
    stack: Args.string({
      name: 'stack', // argument name
      required: false, // Stack is optional, will search if omitted
      description:
        'Name or path of the stack to build. If omitted, searches in current/parent directories.',
    }),
  };

  async run(): Promise<void> {
    // Access parsed args/flags directly from this.args and this.flags
    const stackArg = this.args.stack;
    // const forceFlag = this.flags.force; // Example flag access

    try {
      const stackIdentifier = await this.getStackIdentifier(stackArg);
      this.log(`Attempting to build stack: ${stackIdentifier}`);

      // Call the core build function
      await coreBuild(stackIdentifier);

      this.log(`Stack build initiated successfully for: ${stackIdentifier}`);
      // Note: The core function handles logging success/failure details
    } catch (error) {
      // Let BaseCommand catch handler manage errors
      throw error;
    }
  }
} 