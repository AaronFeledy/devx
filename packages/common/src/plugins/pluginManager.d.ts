import { Plugin } from './types';
/**
 * Manages the registration and retrieval of DevX plugins.
 */
declare class PluginManager {
    private registeredPlugins;
    /**
     * Registers a new plugin.
     * @param plugin - The plugin instance to register.
     * @throws Error if a plugin with the same name is already registered.
     */
    registerPlugin(plugin: Plugin): void;
    /**
     * Retrieves a registered plugin by name.
     * @param name - The name of the plugin to retrieve.
     * @returns The plugin instance or undefined if not found.
     */
    getPlugin(name: string): Plugin | undefined;
    /**
     * Retrieves all registered plugins.
     * @returns An array of all registered plugin instances.
     */
    getAllPlugins(): Plugin[];
    /**
     * Retrieves all plugins that provide an Engine capability.
     * @returns An array of plugins with an EnginePlugin.
     */
    getEnginePlugins(): Plugin[];
    /**
     * Retrieves all plugins that provide a Builder capability.
     * @returns An array of plugins with a BuilderPlugin.
     */
    getBuilderPlugins(): Plugin[];
}
export declare const pluginManager: PluginManager;
/**
 * Convenience function to register a plugin using the singleton manager.
 * @param plugin - The plugin instance to register.
 */
export declare function registerPlugin(plugin: Plugin): void;
export {};
