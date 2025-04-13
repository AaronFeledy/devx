import type { StackConfig } from '@devx/common';
/**
 * Loads and validates a stack configuration.
 *
 * It determines the configuration file to load based on the following priority:
 * 1. If `identifier` is provided and resolves to an existing `.yml`, `.yaml`, or `.json` file path,
 *    that file is loaded.
 * 2. If `identifier` is provided but is not a valid file path, it's treated as a stack name.
 *    (Currently warns and falls back to local search, future: lookup in `~/.devx/stacks/<name>/`).
 * 3. If `identifier` is not provided, it searches for `.stack.yml`, `.stack.yaml`, or `.stack.json`
 *    in the `cwd` and its parent directories.
 *
 * After finding and parsing the file, it validates the content against the `StackConfigSchema`.
 *
 * @param identifier - Optional. A specific stack name or a path to a stack configuration file.
 *                     If omitted, searches locally starting from `cwd`.
 * @param cwd - Optional. The directory to start searching from when `identifier` is not a path
 *              or is omitted. Defaults to `process.cwd()`.
 * @returns A promise that resolves with the validated `StackConfig` object.
 * @throws {Error} If the configuration cannot be found or loaded.
 */
export declare function loadStackConfig(identifier?: string, cwd?: string): Promise<StackConfig>;
/**
 * Represents the metadata stored for a managed stack.
 */
interface StackMetadata {
    /** The absolute path to the stack configuration file (`.stack.yml`, etc.). */
    configPath: string;
    /** The current operational status of the stack. */
    status: 'loaded' | 'starting' | 'running' | 'stopping' | 'stopped' | 'error' | 'unknown';
    /** Timestamp of the last status update. */
    lastStatusUpdate?: number;
    /** Optional error message if the status is 'error'. */
    errorMessage?: string;
}
/**
 * Lists the names of all stacks for which metadata exists.
 *
 * Reads the contents of the metadata directory and extracts stack names from the filenames.
 *
 * @returns A promise that resolves with an array of stack names.
 * @throws {Error} If the metadata directory cannot be read (excluding ENOENT).
 */
export declare function listStacks(): Promise<string[]>;
/**
 * Retrieves the metadata for a specific stack.
 *
 * @param stackName - The name of the stack.
 * @returns A promise that resolves with the `StackMetadata` object, or null if no metadata exists for that name.
 * @throws {Error} If reading the metadata file fails for reasons other than it not existing.
 */
export declare function getStackMetadata(stackName: string): Promise<StackMetadata | null>;
/**
 * Updates the status (and optionally an error message) for a specific stack's metadata.
 *
 * Loads existing metadata, updates the status and timestamp, and saves it back.
 *
 * @param stackName - The name of the stack to update.
 * @param status - The new status to set.
 * @param errorMessage - Optional error message to set (clears existing if not provided).
 * @returns A promise that resolves when the metadata is updated.
 * @throws {Error} If metadata for the stack doesn't exist or saving fails.
 */
export declare function updateStackStatus(stackName: string, status: StackMetadata['status'], errorMessage?: string): Promise<void>;
export {};
