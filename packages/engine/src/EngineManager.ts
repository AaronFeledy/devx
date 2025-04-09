import type { EnginePlugin } from './types';
import { PodmanEnginePlugin } from './plugins/podman/PodmanEnginePlugin';

/**
 * Manages available engine plugins.
 * Responsible for loading, selecting, and providing access to engine plugins.
 */
export class EngineManager {
  private plugins: Map<string, EnginePlugin> = new Map();

  /**
   * Initializes the EngineManager and loads available plugins.
   * Currently, it explicitly loads the Podman plugin.
   * TODO: Implement dynamic plugin discovery (e.g., scanning a directory).
   */
  constructor() {
    this.loadPlugins();
  }

  /**
   * Loads the engine plugins.
   * For now, manually adds the Podman plugin.
   */
  private loadPlugins(): void {
    const podmanPlugin = new PodmanEnginePlugin();
    this.registerPlugin(podmanPlugin);
    console.debug(`Loaded engine plugin: ${podmanPlugin.name}`);
    // In the future, this could scan a plugins directory or use configuration
  }

  /**
   * Registers an engine plugin with the manager.
   *
   * @param plugin - The engine plugin instance to register.
   * @throws {Error} If a plugin with the same name is already registered.
   */
  registerPlugin(plugin: EnginePlugin): void {
    if (this.plugins.has(plugin.name)) {
      throw new Error(`Engine plugin with name '${plugin.name}' is already registered.`);
    }
    this.plugins.set(plugin.name, plugin);
  }

  /**
   * Retrieves an engine plugin by its name.
   *
   * @param name - The name of the plugin to retrieve.
   * @returns The engine plugin instance.
   * @throws {Error} If no plugin with the specified name is found.
   */
  getPlugin(name: string): EnginePlugin {
    const plugin = this.plugins.get(name);
    if (!plugin) {
      throw new Error(`Engine plugin '${name}' not found.`);
    }
    return plugin;
  }

  /**
   * Retrieves the default engine plugin.
   * Currently defaults to 'podman'. This should be configurable later.
   *
   * @returns The default engine plugin instance.
   * @throws {Error} If the default plugin ('podman') is not loaded.
   */
  getDefaultPlugin(): EnginePlugin {
    // TODO: Make the default plugin name configurable (e.g., via global config)
    const defaultPluginName = 'podman';
    return this.getPlugin(defaultPluginName);
  }

  /**
   * Lists the names of all loaded engine plugins.
   *
   * @returns An array of loaded plugin names.
   */
  listPlugins(): string[] {
    return Array.from(this.plugins.keys());
  }
}

// Export a singleton instance of the manager
export const engineManager = new EngineManager(); 