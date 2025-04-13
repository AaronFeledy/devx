import { existsSync, promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { loadStackConfig as loadStackConfigFileContent, StackParseError, } from './parser';
/** Default filenames to search for stack configurations. */
const DEFAULT_STACK_FILES = ['.stack.yml', '.stack.yaml', '.stack.json'];
/** Base directory for DevX configuration and data. */
const DEVX_DIR = path.join(os.homedir(), '.devx');
/** Directory where metadata about managed stacks is stored. */
const STACKS_METADATA_DIR = path.join(DEVX_DIR, 'stacks');
/**
 * Finds the stack configuration file (`.stack.yml`, `.stack.yaml`, or `.stack.json`)
 * by searching upwards from the given directory.
 *
 * @param startDir - The directory to start searching from.
 * @returns A promise that resolves with the absolute path to the found stack file, or null if not found.
 */
async function findStackFile(startDir) {
    let currentDir = path.resolve(startDir);
    const root = path.parse(currentDir).root;
    while (true) {
        for (const filename of DEFAULT_STACK_FILES) {
            const filePath = path.join(currentDir, filename);
            try {
                await fs.access(filePath); // Check if file exists and is accessible
                return filePath;
            }
            catch {
                // File doesn't exist or isn't accessible, continue searching
            }
        }
        // Stop if we reach the root directory
        if (currentDir === root) {
            break;
        }
        // Move to the parent directory
        currentDir = path.dirname(currentDir);
    }
    return null; // Not found
}
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
export async function loadStackConfig(identifier, cwd = process.cwd()) {
    let stackFilePath = null;
    // If an identifier is provided, resolve it relative to CWD if not absolute
    if (identifier) {
        stackFilePath = path.resolve(cwd, identifier);
        if (!existsSync(stackFilePath)) {
            // Maybe it's just a name? Try finding metadata
            const metadata = await getStackMetadata(identifier);
            if (metadata?.configPath) {
                stackFilePath = metadata.configPath;
                console.log(`Found stack config path from metadata for name '${identifier}': ${stackFilePath}`);
            }
            else {
                // If identifier was given but doesn't resolve to file or metadata, throw.
                throw new Error(`Stack identifier '${identifier}' provided, but no corresponding configuration file or metadata found at '${stackFilePath}' or in ~/.devx/stacks.`);
            }
        }
        // If it exists but isn't a file, throw error. Could be a directory.
        else if (!(await fs.stat(stackFilePath)).isFile()) {
            throw new Error(`Specified stack path '${stackFilePath}' exists but is not a file.`);
        }
    }
    else {
        // If no identifier, search upwards from CWD for .stack.yml or .stack.json
        stackFilePath = await findStackFile(cwd);
        if (!stackFilePath) {
            throw new Error(`Could not find a stack configuration file (.stack.yml or .stack.json) in the current directory or any parent directories.`);
        }
    }
    if (!stackFilePath) {
        throw new Error('Unexpected error: Stack file path could not be determined.');
    }
    console.log(`Loading stack configuration from: ${stackFilePath}`);
    try {
        // Use the imported function that handles reading and parsing
        const config = loadStackConfigFileContent(stackFilePath);
        // --- Metadata Update ---
        // Ensure the metadata directory exists before trying to save
        await ensureMetadataDir();
        // Save/update metadata about this loaded stack
        await saveStackMetadata(config.name, {
            configPath: stackFilePath, // Store the path it was loaded from
            status: 'loaded', // Initial status after loading
        });
        // ---------------------\
        return config;
    }
    catch (error) {
        // Catch unknown for better type safety
        // Provide more context to the error based on where it originated
        let errorMessage = `Failed to load stack configuration from ${stackFilePath || identifier || 'local directory'}`;
        if (error instanceof StackParseError) {
            // Use the detailed message from StackParseError
            errorMessage += `: ${error.message}`;
            // Use error.details for the cause, ensuring it's an Error if possible
            const cause = error.details instanceof Error ? error.details : error;
            throw new Error(errorMessage, { cause });
        }
        else if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
            // error is already an Error instance here
            throw new Error(errorMessage, { cause: error });
        }
        else {
            // Handle non-Error exceptions
            errorMessage += `: An unknown error occurred.`;
            // Create a new error to wrap the unknown cause if it's meaningful
            throw new Error(errorMessage, { cause: error });
        }
    }
}
/**
 * Ensures that the stack metadata directory (`~/.devx/stacks`) exists.
 * Creates it recursively if it doesn't.
 *
 * @throws {Error} If the directory cannot be created (and doesn't already exist).
 */
async function ensureMetadataDir() {
    try {
        await fs.mkdir(STACKS_METADATA_DIR, { recursive: true });
    }
    catch (error) {
        // Ignore EEXIST error (directory already exists), rethrow others
        if (error.code !== 'EEXIST') {
            console.error(`Error creating metadata directory ${STACKS_METADATA_DIR}:`, error);
            throw new Error(`Failed to create stack metadata directory: ${STACKS_METADATA_DIR}`, { cause: error });
        }
    }
}
/**
 * Saves metadata for a specific stack to a JSON file in the metadata directory.
 * If metadata already exists, it will be overwritten.
 *
 * @param stackName - The name of the stack (from `StackConfig.name`).
 * @param metadata - The `StackMetadata` object to save.
 * @throws {Error} If the metadata directory cannot be created or the file cannot be written.
 */
async function saveStackMetadata(stackName, metadata) {
    await ensureMetadataDir(); // Make sure the directory exists first
    const metadataFilePath = path.join(STACKS_METADATA_DIR, `${stackName}.json`);
    try {
        // Update timestamp before saving
        const dataToSave = {
            ...metadata,
            lastStatusUpdate: Date.now(),
        };
        await fs.writeFile(metadataFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
        console.log(`Saved metadata for stack '${stackName}' to ${metadataFilePath}`);
    }
    catch (error) {
        console.error(`Error saving metadata for stack '${stackName}' to ${metadataFilePath}:`, error);
        throw new Error(`Failed to save metadata for stack ${stackName}`, {
            cause: error instanceof Error ? error : undefined,
        });
    }
}
/**
 * Lists the names of all stacks for which metadata exists.
 *
 * Reads the contents of the metadata directory and extracts stack names from the filenames.
 *
 * @returns A promise that resolves with an array of stack names.
 * @throws {Error} If the metadata directory cannot be read (excluding ENOENT).
 */
export async function listStacks() {
    await ensureMetadataDir(); // Ensure dir exists, might be empty
    try {
        const files = await fs.readdir(STACKS_METADATA_DIR);
        return files
            .filter((file) => file.endsWith('.json')) // Only consider .json files
            .map((file) => path.basename(file, '.json')); // Extract name from filename
    }
    catch (error) {
        // If the directory doesn't exist, return an empty list gracefully
        if (error instanceof Error &&
            error.code === 'ENOENT') {
            return [];
        }
        // Log and rethrow other errors
        console.error(`Error listing stack metadata files from ${STACKS_METADATA_DIR}:`, error);
        throw new Error('Failed to list stack metadata files', {
            cause: error instanceof Error ? error : undefined,
        });
    }
}
/**
 * Retrieves the metadata for a specific stack.
 *
 * @param stackName - The name of the stack.
 * @returns A promise that resolves with the `StackMetadata` object, or null if no metadata exists for that name.
 * @throws {Error} If reading the metadata file fails for reasons other than it not existing.
 */
export async function getStackMetadata(stackName) {
    const metadataFilePath = path.join(STACKS_METADATA_DIR, `${stackName}.json`);
    try {
        const content = await fs.readFile(metadataFilePath, 'utf-8');
        // TODO: Add validation for the loaded metadata content (e.g., using Zod)
        return JSON.parse(content);
    }
    catch (error) {
        // If the file doesn't exist (ENOENT), return null gracefully
        if (error instanceof Error &&
            error.code === 'ENOENT') {
            return null;
        }
        // Log and rethrow other read errors
        console.error(`Error reading metadata for stack '${stackName}' from ${metadataFilePath}:`, error);
        throw new Error(`Failed to read metadata for stack ${stackName}`, {
            cause: error instanceof Error ? error : undefined,
        });
    }
}
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
export async function updateStackStatus(stackName, status, errorMessage) {
    const existingMetadata = await getStackMetadata(stackName);
    if (!existingMetadata) {
        throw new Error(`Cannot update status: Metadata for stack '${stackName}' not found.`);
    }
    const updatedMetadata = {
        ...existingMetadata,
        status: status,
        errorMessage: errorMessage, // Set or clear the error message
        // lastStatusUpdate will be set by saveStackMetadata
    };
    await saveStackMetadata(stackName, updatedMetadata);
}
// TODO: Add function to delete stack metadata when a stack is destroyed.
