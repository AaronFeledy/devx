import fs from 'fs/promises';
import path from 'path';
import os from 'os';
import { parseStackConfigFile, StackParseError } from './parser';
import { StackConfig } from './schema';

const DEFAULT_STACK_FILES = ['.stack.yml', '.stack.yaml', '.stack.json'];
const DEVX_DIR = path.join(os.homedir(), '.devx');
const STACKS_METADATA_DIR = path.join(DEVX_DIR, 'stacks');

/**
 * Finds the stack configuration file in the given directory or its parent directories.
 * @param startDir The directory to start searching from.
 * @returns The absolute path to the stack file, or null if not found.
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
 * Loads the stack configuration based on the current working directory or an explicit name.
 *
 * If a name is provided, it attempts to load a globally stored stack (not implemented yet).
 * If no name is provided, it searches for a .stack.yml/.yaml/.json file in the current
 * directory and its parents.
 *
 * @param identifier Optional stack name or path to a specific stack file.
 * @param cwd The current working directory to start searching from if identifier is not a path.
 * @returns The parsed StackConfig.
 * @throws Error if the stack file cannot be found or parsed.
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
        // TODO: Store stack metadata (e.g., file path, status) in STACKS_METADATA_DIR
        // await ensureMetadataDir();
        // await saveStackMetadata(config.name, { configPath: stackFilePath, status: 'loaded' });
        return config;
    } catch (error: any) {
        if (error instanceof StackParseError) {
            // Re-throw parser errors with more context if needed
            throw new Error(`Failed to load stack configuration from ${stackFilePath}: ${error.message}`, { cause: error.originalError });
        }
        throw new Error(`An unexpected error occurred while loading ${stackFilePath}: ${error.message}`, { cause: error });
    }
}

// --- Metadata Management (Placeholders) ---

interface StackMetadata {
    configPath: string;
    status: 'loaded' | 'running' | 'stopped' | 'error';
    // Add other relevant metadata
}

async function ensureMetadataDir(): Promise<void> {
    try {
        await fs.mkdir(STACKS_METADATA_DIR, { recursive: true });
    } catch (error: any) {
        if (error.code !== 'EEXIST') {
            throw new Error(`Failed to create stack metadata directory: ${STACKS_METADATA_DIR}`, { cause: error });
        }
    }
}

async function saveStackMetadata(stackName: string, metadata: StackMetadata): Promise<void> {
    await ensureMetadataDir(); // Ensure directory exists
    const metadataFilePath = path.join(STACKS_METADATA_DIR, `${stackName}.json`);
    try {
        await fs.writeFile(metadataFilePath, JSON.stringify(metadata, null, 2));
        console.log(`Saved metadata for stack '${stackName}' to ${metadataFilePath}`);
    } catch (error: any) {
        throw new Error(`Failed to save metadata for stack ${stackName}`, { cause: error });
    }
}

export async function listStacks(): Promise<string[]> {
    await ensureMetadataDir();
    try {
        const files = await fs.readdir(STACKS_METADATA_DIR);
        return files
            .filter(file => file.endsWith('.json'))
            .map(file => path.basename(file, '.json'));
    } catch (error: any) {
        if (error.code === 'ENOENT') {
            return []; // No metadata directory exists yet
        }
        throw new Error('Failed to list stack metadata files', { cause: error });
    }
}

// TODO: Add functions to get/update individual stack metadata 