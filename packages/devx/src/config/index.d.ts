import type { GlobalConfig } from './types.js';
export type { GlobalConfig } from './types.js';
/**
 * Loads the global DevX configuration from `~/.devx/config.yml`.
 * Provides default values if the file doesn't exist or is invalid.
 *
 * @returns The loaded or default GlobalConfig.
 */
export declare function getGlobalConfig(): Promise<GlobalConfig>;
