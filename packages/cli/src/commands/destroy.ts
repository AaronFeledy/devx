import { Flags, Args } from '@oclif/core';
import { BaseCommand } from '../base-command';
import { destroy } from '@devx/devx';

export default class Destroy extends BaseCommand {
  static description =
    'Stops and removes the containers, networks, and optionally volumes for a stack.';

  static examples = [
    '$ devx destroy',
    '$ devx destroy my-stack',
    '$ devx destroy --volumes', // Remove volumes too
  ];

  static flags = {
    volumes: Flags.boolean({
      char: 'v',
      description: 'Remove named volumes declared in the stack configuration',
    }),
    force: Flags.boolean({
      char: 'f',
      description: 'Force destroy without confirmation',
    }), // Placeholder if confirmation added
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
    // Parse arguments and flags
    const { args, flags } = await this.parse(Destroy);

    const stackArg = args.stack;
    const removeVolumes = flags.volumes;
    // const forceFlag = flags.force; // Use if confirmation is added

    // Resolve stack identifier
    const stackIdentifier = await this.getStackIdentifier(stackArg as string);

    // Prepare options
    const destroyOptions = {
      removeVolumes: removeVolumes,
      // force: forceFlag,
    };

    try {
      // Instantiate and run executor
      await destroy(stackIdentifier, { removeVolumes: flags.volumes });
      this.log(`Destroy initiated for stack: ${stackIdentifier}`);
    } catch (error) {
      this.error(
        `Destroy failed: ${error instanceof Error ? error.message : String(error)}`,
        { exit: 1 }
      );
    }
  }
}
