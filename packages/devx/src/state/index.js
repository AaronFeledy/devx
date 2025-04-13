import { homedir } from 'os';
import { join } from 'path';
import { StackStatus } from '@devx/common';
import { existsSync, mkdirSync } from 'fs';
export * from './types.js';
// Import schemas and enums as values, types as types
import { DevxStateSchema, StackStateSchema, StackBuildStatus, } from './types.js';
const DEVX_DIR = join(homedir(), '.devx');
const STATE_FILE_PATH = join(DEVX_DIR, 'state.json');
// In-memory cache of the state
let currentState = null;
/**
 * Ensures that the DevX configuration directory (~/.devx) exists.
 * (Copied from config/index.ts - could be moved to a shared utility)
 */
function ensureDevxDirExists() {
    if (!existsSync(DEVX_DIR)) {
        try {
            mkdirSync(DEVX_DIR, { recursive: true });
            console.debug(`Created DevX directory: ${DEVX_DIR}`);
        }
        catch (error) {
            console.error(`Failed to create DevX directory at ${DEVX_DIR}:`, error);
        }
    }
}
/**
 * Loads the DevX state from `~/.devx/state.json`.
 * If the file doesn't exist or is invalid, it returns an empty state object.
 *
 * @returns The loaded or initial DevX state.
 */
export async function loadDevxState() {
    ensureDevxDirExists();
    if (currentState !== null) {
        return currentState; // Return cached state if available
    }
    try {
        const stateFile = Bun.file(STATE_FILE_PATH);
        if (!(await stateFile.exists())) {
            console.debug(`State file not found at ${STATE_FILE_PATH}. Initializing empty state.`);
            currentState = {};
            return {};
        }
        const content = await stateFile.json();
        // Need to handle date deserialization manually if needed, or store as ISO strings
        const parsedState = DevxStateSchema.safeParse(content);
        if (!parsedState.success) {
            console.error(`Invalid state file at ${STATE_FILE_PATH}:`, parsedState.error.errors);
            console.warn('Initializing empty state due to invalid file.');
            currentState = {};
            return {};
        }
        console.debug(`Loaded state from ${STATE_FILE_PATH}`);
        // TODO: Potentially revive Date objects if stored as strings
        currentState = parsedState.data;
        return parsedState.data;
    }
    catch (error) {
        console.error(`Error loading state file ${STATE_FILE_PATH}:`, error);
        console.warn('Initializing empty state due to error.');
        currentState = {};
        return {};
    }
}
/**
 * Saves the current DevX state object to `~/.devx/state.json`.
 *
 * @param state - The DevX state object to save.
 */
export async function saveDevxState(state) {
    ensureDevxDirExists();
    try {
        // Validate before saving (optional)
        const validatedState = DevxStateSchema.parse(state);
        // TODO: Potentially stringify Date objects before saving
        const content = JSON.stringify(validatedState, null, 2); // Pretty print
        await Bun.write(STATE_FILE_PATH, content);
        currentState = validatedState; // Update cache
        console.debug(`Saved state to ${STATE_FILE_PATH}`);
    }
    catch (error) {
        console.error(`Failed to save state to ${STATE_FILE_PATH}:`, error);
        throw new Error(`Failed to save state: ${error}`);
    }
}
/**
 * Retrieves the state for a specific stack by its name.
 *
 * @param stackName - The name of the stack.
 * @returns The StackState object if found, otherwise undefined.
 */
export async function getStackState(stackName) {
    const state = await loadDevxState();
    return state[stackName];
}
/**
 * Updates the state for a specific stack.
 * Creates a new entry if the stack doesn't exist in the state.
 * Merges the update with existing state.
 *
 * @param stackName - The name of the stack to update.
 * @param update - A partial StackState object containing the changes.
 */
export async function updateStackState(stackName, update) {
    const state = await loadDevxState();
    const existingState = state[stackName];
    if (!existingState && !update.configPath) {
        throw new Error(`Cannot create new state for stack '${stackName}' without providing 'configPath'.`);
    }
    const newState = StackStateSchema.parse({
        ...(existingState || { name: stackName, configPath: update.configPath }), // Initialize if new
        ...update,
        // Ensure name and configPath are preserved or set correctly
        name: stackName,
        configPath: update.configPath ?? existingState?.configPath,
    });
    state[stackName] = newState;
    await saveDevxState(state);
    console.debug(`Updated state for stack: ${stackName}`);
}
/**
 * Removes a stack's state from the state file.
 *
 * @param stackName - The name of the stack to remove.
 */
export async function removeStackState(stackName) {
    const state = await loadDevxState();
    if (state[stackName]) {
        delete state[stackName];
        await saveDevxState(state);
        console.debug(`Removed state for stack: ${stackName}`);
    }
    else {
        console.debug(`No state found for stack '${stackName}' to remove.`);
    }
}
/**
 * Gets the initial state object for a new stack based on its config.
 *
 * @param stackConfig - The configuration of the stack.
 * @param configPath - The absolute path to the configuration file.
 * @returns A new StackState object.
 */
export function getInitialStackState(stackConfig, configPath) {
    return StackStateSchema.parse({
        name: stackConfig.name,
        configPath: configPath,
        buildStatus: StackBuildStatus.NotBuilt,
        runtimeStatus: StackStatus.Unknown,
        lastStartedAt: null,
        lastError: null,
    });
}
