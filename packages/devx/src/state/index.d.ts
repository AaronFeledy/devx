import type { StackConfig } from '@devx/common';
export * from './types.js';
import type { DevxState, StackState } from './types.js';
/**
 * Loads the DevX state from `~/.devx/state.json`.
 * If the file doesn't exist or is invalid, it returns an empty state object.
 *
 * @returns The loaded or initial DevX state.
 */
export declare function loadDevxState(): Promise<DevxState>;
/**
 * Saves the current DevX state object to `~/.devx/state.json`.
 *
 * @param state - The DevX state object to save.
 */
export declare function saveDevxState(state: DevxState): Promise<void>;
/**
 * Retrieves the state for a specific stack by its name.
 *
 * @param stackName - The name of the stack.
 * @returns The StackState object if found, otherwise undefined.
 */
export declare function getStackState(stackName: string): Promise<StackState | undefined>;
/**
 * Updates the state for a specific stack.
 * Creates a new entry if the stack doesn't exist in the state.
 * Merges the update with existing state.
 *
 * @param stackName - The name of the stack to update.
 * @param update - A partial StackState object containing the changes.
 */
export declare function updateStackState(stackName: string, update: Partial<Omit<StackState, 'name' | 'configPath'> & {
    configPath?: string;
}>): Promise<void>;
/**
 * Removes a stack's state from the state file.
 *
 * @param stackName - The name of the stack to remove.
 */
export declare function removeStackState(stackName: string): Promise<void>;
/**
 * Gets the initial state object for a new stack based on its config.
 *
 * @param stackConfig - The configuration of the stack.
 * @param configPath - The absolute path to the configuration file.
 * @returns A new StackState object.
 */
export declare function getInitialStackState(stackConfig: StackConfig, configPath: string): StackState;
