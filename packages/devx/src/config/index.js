import { homedir } from 'os';
import { join } from 'path';
import { GlobalConfigSchema } from './types.js';
import { existsSync } from 'fs';
const DEVX_DIR = join(homedir(), '.devx');
const CONFIG_FILE_PATH = join(DEVX_DIR, 'config.yml'); // Assuming YAML
// In-memory cache
let cachedConfig = null;
/**
 * Ensures that the DevX configuration directory (~/.devx) exists.
 */
function ensureDevxDirExists() {
  // ... (implementation)
}
/**
 * Loads the global DevX configuration from `~/.devx/config.yml`.
 * Provides default values if the file doesn't exist or is invalid.
 *
 * @returns The loaded or default GlobalConfig.
 */
export async function getGlobalConfig() {
  if (cachedConfig) {
    return cachedConfig;
  }
  ensureDevxDirExists();
  let configData = {};
  if (existsSync(CONFIG_FILE_PATH)) {
    try {
      const file = Bun.file(CONFIG_FILE_PATH);
      // TODO: Add YAML parsing (need a library like js-yaml)
      // For now, assume JSON or handle error
      // configData = yaml.load(await file.text());
      configData = await file.json(); // Placeholder using JSON
      console.debug(`Loaded global config from ${CONFIG_FILE_PATH}`);
    } catch (error) {
      console.error(
        `Error reading or parsing global config ${CONFIG_FILE_PATH}:`,
        error
      );
      // Fallback to default if file is corrupt
      configData = {};
    }
  }
  const validationResult = GlobalConfigSchema.safeParse(configData);
  if (!validationResult.success) {
    console.warn(
      'Invalid global configuration file. Using default values:',
      validationResult.error.flatten().fieldErrors
    );
    // If parsing failed, just use the default config
    cachedConfig = GlobalConfigSchema.parse({});
  } else {
    // If parsing succeeded, use the parsed data
    cachedConfig = validationResult.data;
  }
  // Provide defaults for missing keys
  const defaults = GlobalConfigSchema.parse({});
  cachedConfig = { ...defaults, ...cachedConfig };
  return cachedConfig;
}
// TODO: Add function to save/update global config if needed.
