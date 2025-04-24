import { Args } from '@oclif/core';
import { BaseCommand } from '../base-command';
// import { TaskExecutor } from '@devx/tasks';
import { status } from '@devx/devx';
import type { StackStatusInfo } from '@devx/common';

/**
 * Oclif command to check the status of a DevX stack.
 */
export default class Status extends BaseCommand {
  static description = 'Displays the status of services within a stack.';

  static examples = ['$ devx status', '$ devx status my-stack'];

  static flags = {
    // Potentially add flags like --all to show stopped containers?
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
    const { args } = await this.parse(Status);
    const stackArg = args.stack;
    const stackIdentifier = await this.getStackIdentifier(stackArg as string);

    try {
      this.log(`Checking status for stack: ${stackIdentifier}...`);

      // Remove executor usage
      const statusInfo = await status(stackIdentifier);

      if (!statusInfo) {
        this.warn(`Could not retrieve status for stack: ${stackIdentifier}`);
        return;
      }

      this.log(`Stack Name: ${stackIdentifier}`); // Assuming stack name is identifier for display
      this.log(`Status: ${statusInfo.status}`);

      if (statusInfo.message) {
        this.log(`Message: ${statusInfo.message}`);
      }

      if (statusInfo.services && Object.keys(statusInfo.services).length > 0) {
        this.log('Services:');
        for (const [name, service] of Object.entries(statusInfo.services)) {
          // Directly use status from StackStatusInfo
          this.log(`  - ${name}: ${service.status}`);
          if (service.ports && service.ports.length > 0) {
            const portDetails = service.ports
              .map(
                (p) => `${p.hostPort}:${p.containerPort}/${p.protocol || 'tcp'}`
              )
              .join(', ');
            this.log(`    Ports: ${portDetails}`);
          }
        }
      } else if (
        statusInfo.status !== 'unknown' &&
        statusInfo.status !== 'error' &&
        statusInfo.status !== 'stopped' && // Don't warn if intentionally stopped
        statusInfo.status !== 'not_created' // Don't warn if not created yet
      ) {
        // Only warn if status isn't already indicating a problem or known stopped/absent state
        this.warn('No detailed service information available.');
      }

      if (statusInfo.status === 'error') {
        this.warn('Stack is in an error state.');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(`Failed to get stack status: ${message}`, { exit: 1 });
    }
  }
}