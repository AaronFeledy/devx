import { Plugin } from './types.js';

/**
 * Manages the registration and retrieval of DevX plugins.
 */
class PluginManager {
  private registeredPlugins: Map<string, Plugin> = new Map();

  /**
   * Registers a new plugin.
   * @param plugin - The plugin instance to register.
   * @throws Error if a plugin with the same name is already registered.
   */
  public registerPlugin(plugin: Plugin): void {
    if (this.registeredPlugins.has(plugin.name)) {
      throw new Error(
        `Plugin with name '${plugin.name}' is already registered.`
      );
    }
    this.registeredPlugins.set(plugin.name, plugin);
    console.log(`Plugin registered: ${plugin.name} (v${plugin.version})`);
    // Optionally call plugin.initialize() here or manage lifecycle separately
  }

  /**
   * Retrieves a registered plugin by name.
   * @param name - The name of the plugin to retrieve.
   * @returns The plugin instance or undefined if not found.
   */
  public getPlugin(name: string): Plugin | undefined {
    return this.registeredPlugins.get(name);
  }

  /**
   * Retrieves all registered plugins.
   * @returns An array of all registered plugin instances.
   */
  public getAllPlugins(): Plugin[] {
    return Array.from(this.registeredPlugins.values());
  }

  /**
   * Retrieves all plugins that provide an Engine capability.
   * @returns An array of plugins with an EnginePlugin.
   */
  public getEnginePlugins(): Plugin[] {
    return this.getAllPlugins().filter((p) => !!p.engine);
  }

  /**
   * Retrieves all plugins that provide a Builder capability.
   * @returns An array of plugins with a BuilderPlugin.
   */
  public getBuilderPlugins(): Plugin[] {
    return this.getAllPlugins().filter((p) => !!p.builder);
  }

  // Add similar methods for Tasks, Recipes etc. as needed
}

// Export a singleton instance
export const pluginManager = new PluginManager();

/**
 * Convenience function to register a plugin using the singleton manager.
 * @param plugin - The plugin instance to register.
 */
export function registerPlugin(plugin: Plugin): void {
  pluginManager.registerPlugin(plugin);
}
