import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseStackConfigFile, StackParseError } from './parser';
import type { StackConfig } from './schema';
import { resolve } from 'path';
import findUp from 'find-up';

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
async function findStackFile(startDir: string): Promise<string | null> {
  let currentDir = path.resolve(startDir);
  const root = path.parse(currentDir).root;

  while (true) {
    for (const filename of DEFAULT_STACK_FILES) {
      const filePath = path.join(currentDir, filename);
      try {
        await fs.access(filePath); // Check if file exists and is accessible
        return filePath;
      } catch {
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
 * @throws {Error} If a stack file cannot be found based on the criteria.
 * @throws {StackParseError} If the found file cannot be read, parsed, or validated against the schema.
 */
export async function loadStackConfig(identifier?: string, cwd: string = process.cwd()): Promise<StackConfig> {
    let stackFilePath: string | null = null;

    if (identifier) {
        // Try interpreting identifier as a direct path first
        const potentialPath = path.resolve(cwd, identifier);
        try {
            const stats = await fs.stat(potentialPath);
            if (stats.isFile()) {
                const ext = path.extname(potentialPath).toLowerCase();
                if (['.yml', '.yaml', '.json'].includes(ext)) {
                    stackFilePath = potentialPath;
                } else {
                     throw new Error(`Specified file is not a valid stack file (must be .yml, .yaml, or .json): ${identifier}`);
                }
            } else {
                // If it's a directory or something else, treat it as a name (handled below)
            }
        } catch {
             // If stat fails, it's likely not a path, treat it as a name
        }

        // If not resolved as a path, treat identifier as a stack name (global stack lookup - future feature)
        if (!stackFilePath) {
             // TODO: Implement lookup for named global stacks in ~/.devx/stacks/<name>/.stack.yml
            console.warn(`Named stack lookup ('${identifier}') is not yet implemented. Searching locally.`);
            // Fallback to local search for now
             stackFilePath = await findStackFile(cwd);
             if (!stackFilePath) {
                throw new Error(`Stack configuration not found locally, and named stack '${identifier}' lookup is not implemented.`);
             }
        }

    } else {
        // No identifier provided, search locally
        stackFilePath = await findStackFile(cwd);
        if (!stackFilePath) {
            throw new Error(`Stack configuration file (${DEFAULT_STACK_FILES.join(' or ')}) not found in ${cwd} or parent directories.`);
        }
    }

    console.log(`Loading stack configuration from: ${stackFilePath}`);
    try {
        const config = await parseStackConfigFile(stackFilePath);

        // --- Metadata Update --- 
        // Ensure the metadata directory exists before trying to save
        await ensureMetadataDir(); 
        // Save/update metadata about this loaded stack
        await saveStackMetadata(config.name, {
            configPath: stackFilePath, // Store the path it was loaded from
            status: 'loaded' // Initial status after loading
        });
        // ---------------------

        return config;
    } catch (error: unknown) { // Catch unknown for better type safety
        // Provide more context to the error based on where it originated
        let errorMessage = `Failed to load stack configuration from ${stackFilePath || identifier || 'local directory'}`;
        if (error instanceof StackParseError) {
            // Use the detailed message from StackParseError
            errorMessage += `: ${error.message}`;
            // Rethrow maintaining the original error type if needed upstream, or wrap
            throw new Error(errorMessage, { cause: error.originalError || error });
        } else if (error instanceof Error) {
            errorMessage += `: ${error.message}`;
            throw new Error(errorMessage, { cause: error });
        } else {
            // Handle non-Error exceptions
             errorMessage += `: An unknown error occurred.`;
            throw new Error(errorMessage);
        }
    }
}

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
    // Add other relevant metadata (e.g., container IDs, network names) as needed later
}

/**
 * Ensures that the stack metadata directory (`~/.devx/stacks`) exists.
 * Creates it recursively if it doesn't.
 *
 * @throws {Error} If the directory cannot be created (and doesn't already exist).
 */
async function ensureMetadataDir(): Promise<void> {
    try {
        await fs.mkdir(STACKS_METADATA_DIR, { recursive: true });
    } catch (error: any) {
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
async function saveStackMetadata(stackName: string, metadata: StackMetadata): Promise<void> {
    await ensureMetadataDir(); // Make sure the directory exists first
    const metadataFilePath = path.join(STACKS_METADATA_DIR, `${stackName}.json`);
    try {
        // Update timestamp before saving
        const dataToSave: StackMetadata = { ...metadata, lastStatusUpdate: Date.now() };
        await fs.writeFile(metadataFilePath, JSON.stringify(dataToSave, null, 2), 'utf-8');
        console.log(`Saved metadata for stack '${stackName}' to ${metadataFilePath}`);
    } catch (error: unknown) {
        console.error(`Error saving metadata for stack '${stackName}' to ${metadataFilePath}:`, error);
        throw new Error(`Failed to save metadata for stack ${stackName}`, { cause: error instanceof Error ? error : undefined });
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
export async function listStacks(): Promise<string[]> {
    await ensureMetadataDir(); // Ensure dir exists, might be empty
    try {
        const files = await fs.readdir(STACKS_METADATA_DIR);
        return files
            .filter(file => file.endsWith('.json')) // Only consider .json files
            .map(file => path.basename(file, '.json')); // Extract name from filename
    } catch (error: unknown) {
        // If the directory doesn't exist, return an empty list gracefully
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return [];
        }
        // Log and rethrow other errors
        console.error(`Error listing stack metadata files from ${STACKS_METADATA_DIR}:`, error);
        throw new Error('Failed to list stack metadata files', { cause: error instanceof Error ? error : undefined });
    }
}

/**
 * Retrieves the metadata for a specific stack.
 *
 * @param stackName - The name of the stack.
 * @returns A promise that resolves with the `StackMetadata` object, or null if no metadata exists for that name.
 * @throws {Error} If reading the metadata file fails for reasons other than it not existing.
 */
export async function getStackMetadata(stackName: string): Promise<StackMetadata | null> {
    const metadataFilePath = path.join(STACKS_METADATA_DIR, `${stackName}.json`);
    try {
        const content = await fs.readFile(metadataFilePath, 'utf-8');
        // TODO: Add validation for the loaded metadata content (e.g., using Zod)
        return JSON.parse(content) as StackMetadata;
    } catch (error: unknown) {
        // If the file doesn't exist (ENOENT), return null gracefully
        if (error instanceof Error && (error as NodeJS.ErrnoException).code === 'ENOENT') {
            return null;
        }
        // Log and rethrow other read errors
        console.error(`Error reading metadata for stack '${stackName}' from ${metadataFilePath}:`, error);
        throw new Error(`Failed to read metadata for stack ${stackName}`, { cause: error instanceof Error ? error : undefined });
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
export async function updateStackStatus(stackName: string, status: StackMetadata['status'], errorMessage?: string): Promise<void> {
    const existingMetadata = await getStackMetadata(stackName);
    if (!existingMetadata) {
        throw new Error(`Cannot update status: Metadata for stack '${stackName}' not found.`);
    }

    const updatedMetadata: StackMetadata = {
        ...existingMetadata,
        status: status,
        errorMessage: errorMessage, // Set or clear the error message
        // lastStatusUpdate will be set by saveStackMetadata
    };

    await saveStackMetadata(stackName, updatedMetadata);
}


// TODO: Add function to delete stack metadata when a stack is destroyed. 