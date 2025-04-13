import type { EnginePlugin } from '@devx/common';
/**
 * Manages available engine plugins.
 * Responsible for selecting and providing access to registered engine plugins.
 */
export declare class EngineManager {
    /**
     * Retrieves an engine plugin by its name from the central plugin manager.
     *
     * @param name - The name of the plugin to retrieve (e.g., 'podman').
     * @returns The engine plugin instance.
     * @throws {Error} If no plugin with the specified name is found or if the found plugin doesn't have an engine implementation.
     */
    getPlugin(name: string): EnginePlugin;
    /**
     * Retrieves the default engine plugin.
     * Currently defaults to 'podman'. This should be configurable later.
     *
     * @returns The default engine plugin instance.
     * @throws {Error} If the default plugin ('podman') is not found or doesn't provide an engine.
     */
    getDefaultPlugin(): EnginePlugin;
    /**
     * Lists the names of all registered plugins that provide an engine implementation.
     *
     * @returns An array of registered engine plugin names.
     */
    listPlugins(): string[];
}
export declare const engineManager: EngineManager;
