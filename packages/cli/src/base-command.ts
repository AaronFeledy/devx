import { Command, Flags } from '@oclif/core';
import { pluginManager, logger } from '@devx/common'; // Assuming logger and pluginManager are exported from common
import { loadStackConfig } from '@devx/stack';

export abstract class BaseCommand extends Command {
  // Optional: Define global flags common to all commands here
  static globalFlags = {
    // Example: log level flag
    'log-level': Flags.string({
      options: ['debug', 'info', 'warn', 'error'],
      description: 'Specify logging level',
    }),
  };

  // Add baseFlags definition for consistency
  static baseFlags = {
    'log-level': Flags.string({
      options: ['debug', 'info', 'warn', 'error'],
      description: 'Specify logging level',
    }),
  };

  private static engineInitialized = false; // Prevent multiple initializations

  async init(): Promise<void> {
    // Run the standard oclif init first
    await super.init();
    // logger.info('BaseCommand init() called - TEMPORARILY NO PLUGIN INIT');

    // Now that baseFlags are defined, parse can be more specific
    // Use Interfaces.ParserOutput for better typing if desired
    const { flags } = await this.parse({
      flags: (this.constructor as any).baseFlags,
    });
    const logLevel = flags['log-level'];
    if (logLevel) {
      // Assuming logger has a setLevel method
      // logger.setLevel(logLevel);
      logger.info(`Log level set to: ${logLevel}`);
    }

    // Initialize required plugins, e.g., the default engine
    if (!BaseCommand.engineInitialized) {
      logger.info('Initializing DevX engine...');
      try {
        // Correct call using method on pluginManager instance
        const enginePlugins = pluginManager.getEnginePlugins();
        // Assuming the first engine found or a configured default
        const engine =
          enginePlugins.length > 0 ? enginePlugins[0].engine : undefined;

        if (engine) {
          if (!engine.initialize) {
            logger.warn(
              `Engine plugin '${engine.name}' does not have an initialize method.`
            );
          } else {
            logger.debug(`Calling initialize for engine: ${engine.name}`);
            await engine.initialize(); // Await the initialization
            logger.info(`Engine '${engine.name}' initialized successfully.`);
            BaseCommand.engineInitialized = true;
          }
        } else {
          logger.error('No engine plugin found. Cannot proceed.');
          // Exit or throw, as the application cannot function
          this.error('No engine plugin found.', { exit: 1 });
        }
      } catch (error) {
        logger.error('Failed to initialize engine:', error);
        this.error(
          `Engine initialization failed: ${error instanceof Error ? error.message : String(error)}`,
          { exit: 1 }
        );
      }
    } else {
      logger.debug('Engine already initialized, skipping.');
    }

    // TODO: Add initialization for other essential plugin types if needed (e.g., default builder)
  }

  // Define getStackIdentifier as a protected helper method
  protected async getStackIdentifier(
    stackArg?: string,
    fileFlag?: string
  ): Promise<string> {
    const identifier = fileFlag || stackArg; // Prioritize file flag
    try {
      // Pass identifier (path or name) and cwd (implicitly process.cwd())
      const config = await loadStackConfig(identifier);
      return config.name;
    } catch (error) {
      let message = `Failed to load stack configuration`;
      if (identifier) {
        message += ` for identifier: ${identifier}`;
      } else {
        message += ` from current directory or parents`;
      }
      if (error instanceof Error) {
        message += `: ${error.message}`;
      }
      this.error(message, { exit: 1 });
    }
  }

  // Optional: Override catch to provide custom error handling
  async catch(err: Error): Promise<any> {
    // Add custom error logging or handling
    logger.error(`Command Error: ${err.message}`, err);
    // Then re-throw or handle as needed (oclif's default handler will run if not caught here)
    // Example: Exit with a specific code
    // this.exit(1);
    // Let oclif handle it by default
    return super.catch(err);
  }
}
