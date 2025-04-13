import type { BuilderPlugin } from '@devx/common';
/**
 * Manages available builder plugins.
 * Responsible for selecting and providing access to registered builder plugins.
 */
export declare class BuilderManager {
    /**
     * Retrieves a builder plugin by its name from the central plugin manager.
     *
     * @param name - The name of the plugin to retrieve (e.g., 'podman-compose').
     * @returns The builder plugin instance.
     * @throws {Error} If no plugin with the specified name is found or if the found plugin doesn't have a builder implementation.
     */
    getPlugin(name: string): BuilderPlugin;
    /**
     * Retrieves the default builder plugin.
     * Currently defaults to 'podman-compose'. This should be configurable later.
     *
     * @returns The default builder plugin instance.
     * @throws {Error} If the default plugin ('podman-compose') is not found or doesn't provide a builder.
     */
    getDefaultPlugin(): BuilderPlugin;
    /**
     * Lists the names of all registered plugins that provide a builder implementation.
     *
     * @returns An array of registered builder plugin names.
     */
    listPlugins(): string[];
}
export declare const builderManager: BuilderManager;
