import fs from 'fs/promises';
import path from 'path';
// import yaml from 'js-yaml';
import YAML from 'yaml';
import { ZodError } from 'zod';
import { StackConfig, StackConfigSchema } from './schema';

export class StackParseError extends Error {
  constructor(message: string, public originalError?: Error | ZodError) {
    super(message);
    this.name = 'StackParseError';
  }
}

/**
 * Parses and validates a stack configuration file (YAML or JSON).
 * @param filePath The absolute path to the stack configuration file.
 * @returns The validated StackConfig object.
 * @throws StackParseError if parsing or validation fails.
 */
export async function parseStackConfigFile(filePath: string): Promise<StackConfig> {
  let rawContent: string;
  try {
    rawContent = await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    throw new StackParseError(`Failed to read stack file: ${filePath}`, error);
  }

  let parsedConfig: any;
  const fileExt = path.extname(filePath).toLowerCase();

  try {
    if (fileExt === '.yaml' || fileExt === '.yml') {
      // parsedConfig = yaml.load(rawContent);
      parsedConfig = YAML.parse(rawContent);
    } else if (fileExt === '.json') {
      parsedConfig = JSON.parse(rawContent);
    } else {
      throw new Error(`Unsupported file extension: ${fileExt}. Use .yaml, .yml, or .json.`);
    }
  } catch (error: any) {
    throw new StackParseError(`Failed to parse stack file: ${filePath}`, error);
  }

  if (typeof parsedConfig !== 'object' || parsedConfig === null) {
    throw new StackParseError(`Invalid stack configuration format in ${filePath}. Expected an object.`);
  }

  try {
    const validatedConfig = StackConfigSchema.parse(parsedConfig);
    return validatedConfig;
  } catch (error: any) {
    if (error instanceof ZodError) {
        // TODO: Improve error reporting for Zod errors
        console.error("Validation Errors:", JSON.stringify(error.errors, null, 2));
        throw new StackParseError(`Stack configuration validation failed for ${filePath}: ${error.errors.map(e => `${e.path.join('.')} - ${e.message}`).join('; ')}`, error);
    }
    throw new StackParseError(`An unexpected validation error occurred for ${filePath}`, error);
  }
} 