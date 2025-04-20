import { Command, Flags, Args, Interfaces } from '@oclif/core';
import { loadStackConfig } from '@devx/stack';
import { DevxCoreError } from '@devx/devx';
import nconf from 'nconf';
import path from 'path';
import { homedir } from 'os';

// Define the shape of flags and args
// We define base flags here, subclasses will merge their own
interface BaseFlags {
  // verbose?: boolean; // Example
}

// Define a base interface for args if needed, though usually specific to command
// interface BaseArgs {}

/**
 * Base class for DevX CLI commands.
 * Provides shared functionality like configuration loading, error handling,
 * and stack identification.
 */
export abstract class BaseCommand<T extends typeof Command> extends Command {
  // Define base flags accessible statically
  static baseFlags = {
    // verbose: Flags.boolean({char: 'v', description: 'Enable verbose output'}),
  };

  // These will be populated by oclif's parsing lifecycle
  // Use `this.flags` and `this.args` directly in run method
  protected flags!: Interfaces.InferredFlags<
    T['flags'] & typeof BaseCommand.baseFlags
  >;
  protected args!: Interfaces.InferredArgs<T['args']>;

  // Configuration object using nconf
  protected configProvider: nconf.Provider = new nconf.Provider();

  /**
   * Initializes the base command, loads configuration, and parses args/flags.
   */
  public async init(): Promise<void> {
    await super.init(); // Calls the oclif init

    // Parse flags and args using the command's definition
    const { args, flags } = await this.parse({
      flags: this.ctor.flags, // Use flags defined in the subclass
      args: this.ctor.args, // Use args defined in the subclass
      strict: this.ctor.strict, // Use strictness defined in subclass
    });
    this.flags = flags as typeof this.flags; // Type assertion
    this.args = args as typeof this.args;

    this.loadConfig();
  }

  /**
   * Loads configuration using nconf hierarchy:
   * 1. Command-line arguments (handled by oclif parsing)
   * 2. Environment variables (prefixed with DEVX_)
   * 3. Global config file (`~/.devx/config.json`)
   * 4. Defaults (if any)
   */
  protected loadConfig(): void {
    const globalConfigPath = path.join(homedir(), '.devx', 'config.json');

    this.configProvider
      // .argv() // Oclif flags take precedence via this.flags
      .env({
        separator: '__',
        lowerCase: true,
        parseValues: true,
      })
      .file('global', { file: globalConfigPath });

    // Merge oclif flags into nconf for unified access (optional)
    // this.configProvider.defaults(this.flags);
  }

  /**
   * Centralized error handling for commands.
   * Catches specific DevX errors and formats them nicely.
   *
   * @param error - The error caught.
   * @returns Promise<unknown>
   */
  public async catch(error: Error): Promise<unknown> {
    if (error instanceof DevxCoreError) {
      this.error(`DevX Error: ${error.message}`, {
        code: error.name,
        exit: 1,
        suggestions: error.cause ? [`Cause: ${error.cause.toString()}`] : undefined,
      });
    } else if (error.name === 'ValidationError') {
      // Assuming nconf throws ValidationError
      this.error(`Configuration Error: ${error.message}`, { exit: 1 });
    } else {
      // Use return instead of await for super.catch
      return super.catch(error);
    }
    // Ensure exit if handled here (this.error usually exits)
    // If this.error doesn't exit, uncomment:
    // process.exit(1);
  }

  /**
   * Finds the target stack identifier (name or path).
   * Priority:
   * 1. Explicit stack argument provided to the command.
   * 2. Search for `.stack.yml` in the current directory and parent directories.
   *
   * @param stackArg - The optional stack argument passed to the command.
   * @returns The identified stack identifier (usually the resolved path or name).
   * @throws {Error} If no stack argument is provided and no `.stack.yml` is found.
   */
  protected async getStackIdentifier(stackArg?: string): Promise<string> {
    if (stackArg) {
      // If an argument is given, use it directly (it could be a name or path)
      // We might still want to validate/load it here to ensure it's valid early
      // For now, just return it, assuming core functions will handle validation
      return stackArg;
    }

    // If no argument, search for .stack.yml
    this.log(
      'No stack specified, searching for .stack.yml in current and parent directories...'
    );
    try {
      // Use loadStackConfig, which finds the file and parses/validates it
      // We only need the path here, but loading confirms its existence and validity
      const config = await loadStackConfig(); // Load from current dir upwards
      this.log(
        `Found and loaded stack configuration: ${config.name} (${config.configPath})`
      );
      // Return the path to the file, as this seems to be the expected identifier format
      if (!config.configPath) {
        // This case should theoretically not happen if loadStackConfig succeeds without a path identifier
        throw new Error(
          'Loaded stack configuration is missing its configPath.'
        );
      }
      return config.configPath;
    } catch (error: any) {
      // Handle specific errors from loadStackConfig if needed
      if (error instanceof Error && error.message.includes('not found')) {
        throw new Error(
          'No stack specified and no .stack.yml/.yaml/.json found in the current or parent directories.'
        );
      } else {
        // Re-throw other errors (like parsing/validation errors)
        throw new Error(
          `Failed to find or load local stack configuration: ${error.message}`,
          { cause: error }
        );
      }
    }
  }

  // Make run method abstract to force subclasses to implement it
  abstract run(): Promise<void>;
}
