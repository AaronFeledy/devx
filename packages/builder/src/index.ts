import { BuilderPlugin } from './types';
import { PodmanComposeBuilderPlugin } from './plugins/podman-compose';

/**
 * A registry to store available builder plugins.
 * Plugins are stored with their name as the key for easy retrieval.
 * @internal
 */
const availablePlugins: Record<string, BuilderPlugin> = {};

/**
 * Registers a builder plugin, making it available for use.
 * If a plugin with the same name already exists, it will be overwritten,
 * and a warning will be logged.
 *
 * @param plugin - An instance of a class that implements the `BuilderPlugin` interface.
 * @example
 * ```typescript
 * import { registerBuilderPlugin } from '@devx/builder';
 * import { MyCustomBuilder } from './my-custom-builder';
 *
 * registerBuilderPlugin(new MyCustomBuilder());
 * ```
 */
export function registerBuilderPlugin(plugin: BuilderPlugin): void {
  if (!plugin || !plugin.name) {
    console.error('Cannot register invalid plugin:', plugin);
    return;
  }
  if (availablePlugins[plugin.name]) {
    console.warn(`Builder plugin "${plugin.name}" is already registered. Overwriting.`);
  }
  availablePlugins[plugin.name] = plugin;
  console.log(`Registered builder plugin: ${plugin.name}`);
}

/**
 * Retrieves a registered builder plugin by its unique name.
 *
 * @param name - The name of the builder plugin to retrieve (e.g., 'podman-compose').
 * @returns The `BuilderPlugin` instance if found, otherwise `undefined`.
 * @example
 * ```typescript
 * import { getBuilderPlugin } from '@devx/builder';
 *
 * const podmanComposeBuilder = getBuilderPlugin('podman-compose');
 * if (podmanComposeBuilder) {
 *   // Use the builder
 * }
 * ```
 */
export function getBuilderPlugin(name: string): BuilderPlugin | undefined {
  const plugin = availablePlugins[name];
  if (!plugin) {
    console.error(`Builder plugin "${name}" not found. Available plugins: ${Object.keys(availablePlugins).join(', ')}`);
  }
  return plugin;
}

/**
 * Gets the names of all currently registered builder plugins.
 *
 * @returns An array of strings, where each string is the name of a registered plugin.
 */
export function getAvailableBuilderPlugins(): string[] {
  return Object.keys(availablePlugins);
}

// --- Default Plugin Registration --- //
// Register the built-in plugins here so they are available by default.

/**
 * Instance of the default Podman Compose builder plugin.
 * @internal
 */
const podmanComposePlugin = new PodmanComposeBuilderPlugin();
registerBuilderPlugin(podmanComposePlugin);

// --- Exports --- //
// Export the core plugin interface and the registry functions.
export * from './types'; 