import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command';
import { status as coreStatus, StackStatus } from '@devx/devx';

/**
 * Oclif command to check the current status of a DevX development stack.
 * It determines the target stack and calls the core status function.
 */
export default class Status extends BaseCommand<typeof Status> {

  static description = 'Checks the current status of the specified development stack.';

  static examples = [
    '$ devx status my-app',
    '$ devx status', // Infer stack
  ];

  static flags = {
    // TODO: Add flags specific to status if needed (e.g., --detailed)
    ...BaseCommand.baseFlags,
  };

  static args = {
    stack: Args.string({
      name: 'stack',
      required: false,
      description:
        'Name or path of the stack to check status. If omitted, searches in current/parent directories.',
    }),
  };

  /**
   * Main execution method for the `status` command.
   * Identifies the stack, calls the core status function, and displays the result.
   *
   * @throws {Error} Propagates errors from stack identification or the core status function.
   */
  async run(): Promise<void> {
    const stackArg = this.args.stack;

    try {
      const stackIdentifier = await this.getStackIdentifier(stackArg);
      this.log(`Checking status for stack: ${stackIdentifier}`);

      // Call the core status function
      const currentStatus: StackStatus = await coreStatus(stackIdentifier);

      // Display the status to the user
      this.log(`Status for stack '${stackIdentifier}': ${currentStatus.toUpperCase()}`);

      // Optionally provide more details based on status
      switch (currentStatus) {
        case StackStatus.Running:
          this.log('Stack appears to be running correctly.');
          break;
        case StackStatus.Stopped:
          this.log('Stack is stopped.');
          break;
        case StackStatus.Error:
          this.warn('Stack is in an error state. Check logs or component status.');
          // TODO: Could potentially fetch and display the lastError from state
          break;
        case StackStatus.Unknown:
          this.warn('Could not determine the exact status of the stack.');
          break;
        default:
          this.warn(`Unexpected status received: ${currentStatus}`);
      }
    } catch (error) {
      await this.catch(error as Error);
    }
  }
} 