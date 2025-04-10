import type { BuilderPlugin } from '@devx/common'; // Use common type
import { pluginManager } from '@devx/common';
import { logger } from '@devx/common';

/**
 * Manages available builder plugins.
 * Responsible for selecting and providing access to registered builder plugins.
 */
export class BuilderManager {
  /**
   * Retrieves a builder plugin by its name from the central plugin manager.
   *
   * @param name - The name of the plugin to retrieve (e.g., 'podman-compose').
   * @returns The builder plugin instance.
   * @throws {Error} If no plugin with the specified name is found or if the found plugin doesn't have a builder implementation.
   */
  getPlugin(name: string): BuilderPlugin {
    const plugin = pluginManager.getPlugin(name);
    if (!plugin) {
      logger.error(`Builder plugin '${name}' not registered.`);
      throw new Error(`Builder plugin '${name}' not registered.`);
    }
    if (!plugin.builder) {
      logger.error(
        `Registered plugin '${name}' does not provide a builder implementation.`
      );
      throw new Error(
        `Registered plugin '${name}' does not provide a builder implementation.`
      );
    }
    return plugin.builder;
  }

  /**
   * Retrieves the default builder plugin.
   * Currently defaults to 'podman-compose'. This should be configurable later.
   *
   * @returns The default builder plugin instance.
   * @throws {Error} If the default plugin ('podman-compose') is not found or doesn't provide a builder.
   */
  getDefaultPlugin(): BuilderPlugin {
    // TODO: Make the default plugin name configurable (e.g., via global config)
    const defaultPluginName = 'podman-compose';
    try {
      return this.getPlugin(defaultPluginName);
    } catch (error) {
      logger.error(
        `Failed to get default builder plugin '${defaultPluginName}':`,
        error
      );
      throw new Error(
        `Default builder plugin '${defaultPluginName}' could not be loaded.`,
        { cause: error }
      );
    }
  }

  /**
   * Lists the names of all registered plugins that provide a builder implementation.
   *
   * @returns An array of registered builder plugin names.
   */
  listPlugins(): string[] {
    return pluginManager.getBuilderPlugins().map((p) => p.builder!.name);
  }
}

// Export a singleton instance of the manager
export const builderManager = new BuilderManager();
