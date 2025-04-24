import type { EnginePlugin, Plugin } from '@devx/common';
// Re-export the type for use in other modules within the package
export type { EnginePlugin };
import { pluginManager } from '@devx/common';
import { logger } from '@devx/common';

/**
 * Manages available engine plugins.
 * Responsible for selecting and providing access to registered engine plugins.
 */
export class EngineManager {
  /**
   * Retrieves an engine plugin by its name from the central plugin manager.
   *
   * @param name - The name of the plugin to retrieve (e.g., 'podman').
   * @returns The engine plugin instance.
   * @throws {Error} If no plugin with the specified name is found or if the found plugin doesn't have an engine implementation.
   */
  getPlugin(name: string): EnginePlugin {
    const plugin = pluginManager.getPlugin(name);
    if (!plugin) {
      logger.error(`Engine plugin '${name}' not registered.`);
      throw new Error(`Engine plugin '${name}' not registered.`);
    }
    if (!plugin.engine) {
      logger.error(
        `Registered plugin '${name}' does not provide an engine implementation.`
      );
      throw new Error(
        `Registered plugin '${name}' does not provide an engine implementation.`
      );
    }
    return plugin.engine;
  }

  /**
   * Retrieves the default engine plugin.
   * Currently defaults to 'podman'. This should be configurable later.
   *
   * @returns The default engine plugin instance.
   * @throws {Error} If the default plugin ('podman') is not found or doesn't provide an engine.
   */
  getDefaultPlugin(): EnginePlugin {
    const defaultPluginName = 'podman';
    try {
      return this.getPlugin(defaultPluginName);
    } catch (error) {
      logger.error(
        `Failed to get default engine plugin '${defaultPluginName}':`,
        error
      );
      throw new Error(
        `Default engine plugin '${defaultPluginName}' could not be loaded.`,
        { cause: error }
      );
    }
  }

  /**
   * Lists the names of all registered plugins that provide an engine implementation.
   *
   * @returns An array of registered engine plugin names.
   */
  listPlugins(): string[] {
    return pluginManager.getEnginePlugins().map((p: Plugin) => p.engine!.name);
  }
}

// Export a singleton instance of the manager
export const engineManager = new EngineManager();
