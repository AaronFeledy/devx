import type { BuilderPlugin } from './types';

/**
 * Manages available builder plugins.
 * Responsible for loading, selecting, and providing access to builder plugins.
 */
export class BuilderManager {
  private plugins: Map<string, BuilderPlugin> = new Map();

  /**
   * Initializes the BuilderManager.
   * Plugins are registered externally.
   */
  constructor() {
    // Plugin loading/discovery could happen here or be manual
  }

  /**
   * Registers a builder plugin with the manager.
   *
   * @param plugin - The builder plugin instance to register.
   * @throws {Error} If a plugin with the same name is already registered.
   */
  registerPlugin(plugin: BuilderPlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Builder plugin with name '${plugin.name}' is already registered.`);
    }
    this.plugins.set(plugin.name, plugin);
    console.debug(`Registered builder plugin: ${plugin.name}`);
  }

  /**
   * Retrieves a builder plugin by its name.
   *
   * @param name - The name of the plugin to retrieve.
   * @returns The builder plugin instance.
   * @throws {Error} If no plugin with the specified name is found.
   */
  getPlugin(name: string): BuilderPlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Builder plugin '${name}' not found.`);
    }
    return plugin;
  }

  /**
   * Lists the names of all registered builder plugins.
   *
   * @returns An array of registered plugin names.
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
} 