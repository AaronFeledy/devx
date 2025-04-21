import { Command, Flags } from '@oclif/core';
import { pluginManager, logger, EnginePlugin } from '@devx/common'; // Assuming logger and pluginManager are exported from common

export abstract class BaseCommand extends Command {
  // Optional: Define global flags common to all commands here
  static globalFlags = {
    // Example: log level flag
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

    // Parse global flags if needed (example)
    const { flags } = await this.parse(this.constructor as any);
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
        // Find the default engine (assuming it's Podman for now)
        // TODO: This should ideally use the configured default engine name
        const engine = pluginManager.getEnginePlugin('podman'); // Hardcoding 'podman' for now

        if (engine) {
          if (!engine.initialize) {
             logger.warn(`Engine plugin '${engine.name}' does not have an initialize method.`);
          } else {
            logger.debug(`Calling initialize for engine: ${engine.name}`);
            await engine.initialize(); // Await the initialization
            logger.info(`Engine '${engine.name}' initialized successfully.`);
            BaseCommand.engineInitialized = true;
          }
        } else {
          // This case should ideally not happen if podman plugin is imported
          logger.error(
            'Default engine plugin (podman) not found. Cannot proceed.'
          );
           // Exit or throw, as the application cannot function
          this.error('Default engine plugin (podman) not found.', { exit: 1 });
        }
      } catch (error) {
        logger.error('Failed to initialize engine:', error);
        // Handle error appropriately - maybe exit or throw
        this.error(
          `Engine initialization failed: ${error instanceof Error ? error.message : String(error)}`,
          { exit: 1 } // Exit the CLI
        );
      }
    } else {
       logger.debug('Engine already initialized, skipping.');
    }

    // TODO: Add initialization for other essential plugin types if needed (e.g., default builder)
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