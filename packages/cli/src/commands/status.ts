import { BaseCommand } from '../lib/base-command.js';
import { Args, Command, Flags } from '@oclif/core';
import { status as coreStatus } from '@devx/devx';
import { StackStatus, type StackStatusInfo } from '@devx/common';
import { findStack, loadStackConfig } from '@devx/stack';

/**
 * Oclif command to check the status of a DevX stack.
 */
export default class Status extends BaseCommand {
  static description = 'Get the status of a DevX stack.';

  static examples = [
    '$ devx status', // Checks status in current directory
    '$ devx status my-app', // Checks status for named stack 'my-app'
    '$ devx status ./path/to/project', // Checks status using config path
  ];

  // Define argument for stack identifier (optional)
  static args = {
    stackIdentifier: Args.string({
      name: 'stackIdentifier',
      required: false,
      description:
        'Name of the stack or path to its configuration file (defaults to finding .stack.yml in current or parent dirs)',
      default: '.', // Default to current directory for search
    }),
  };

  public async run(): Promise<void> {
    const { args } = await this.parse(Status); // Parse args using the command class
    const stackIdentifier = args.stackIdentifier;

    this.log(`Checking status for stack: ${stackIdentifier}...`);

    try {
      const statusInfo: StackStatusInfo = await coreStatus(stackIdentifier);

      this.log(`Stack Name: ${stackIdentifier}`); // Use identifier for now, could resolve name later
      this.log(`Status: ${statusInfo.status}`);
      if (statusInfo.message) {
        this.log(`Message: ${statusInfo.message}`);
      }

      if (statusInfo.services && Object.keys(statusInfo.services).length > 0) {
        this.log('Services:');
        for (const [name, service] of Object.entries(statusInfo.services)) {
          this.log(`  - ${name}: ${service.status}`);
          if (service.ports && service.ports.length > 0) {
            const portDetails = service.ports
              .map((p) => `${p.hostPort}:${p.containerPort}/${p.protocol}`)
              .join(', ');
            this.log(`    Ports: ${portDetails}`);
          }
        }
      } else if (
        statusInfo.status !== StackStatus.Stopped &&
        statusInfo.status !== StackStatus.NotCreated
      ) {
        // Only show no services warning if not explicitly stopped/not created
        this.warn('No detailed service information available.');
      }

      if (statusInfo.status === StackStatus.Error) {
        this.warn('Stack is in an error state.');
        // Consider exiting with non-zero code
        // this.exit(1);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.error(`Failed to get stack status: ${message}`, { exit: 1 });
    }
  }
}
