import { Args, Flags } from '@oclif/core';
import { BaseCommand } from '../lib/base-command';
import { destroy as coreDestroy } from '@devx/devx';
import prompts from 'prompts';

export default class Destroy extends BaseCommand<typeof Destroy> {
  static description =
    'Destroys the specified development stack and associated resources.';

  static examples = [
    '$ devx destroy my-app',
    '$ devx destroy', // Infer stack
    '$ devx destroy my-app --force', // Skip confirmation
  ];

  static flags = {
    force: Flags.boolean({
      char: 'f',
      description: 'Force destruction without confirmation',
      default: false,
    }),
    ...BaseCommand.baseFlags,
  };

  static args = {
    stack: Args.string({
      name: 'stack',
      required: false,
      description:
        'Name or path of the stack to destroy. If omitted, searches in current/parent directories.',
    }),
  };

  async run(): Promise<void> {
    const stackArg = this.args.stack;
    const forceFlag = this.flags.force;

    try {
      const stackIdentifier = await this.getStackIdentifier(stackArg);

      if (!forceFlag) {
        const response = await prompts({
          type: 'confirm',
          name: 'confirm',
          message: `Are you sure you want to destroy the stack '${stackIdentifier}' and all its resources (containers, volumes, potentially build artifacts)? This action cannot be undone.`,
          initial: false,
        });

        if (!response.confirm) {
          this.log('Destroy operation cancelled by user.');
          return; // Exit gracefully
        }
      }

      this.log(`Attempting to destroy stack: ${stackIdentifier}`);

      // Call the core destroy function
      await coreDestroy(stackIdentifier);

      this.log(`Stack destroy initiated successfully for: ${stackIdentifier}`);
    } catch (error) {
      await this.catch(error as Error);
    }
  }
} 