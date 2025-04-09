import fs from 'fs/promises';
import path from 'path';
// import yaml from 'js-yaml';
import YAML from 'yaml';
import { ZodError } from 'zod';
import { StackConfig, StackConfigSchema } from './schema';

/**
 * Custom error class for stack configuration parsing and validation errors.
 */
export class StackParseError extends Error {
  /**
   * Creates an instance of StackParseError.
   * @param message - The error message.
   * @param originalError - The original error (e.g., from fs, yaml, or Zod) that caused this error.
   */
  constructor(message: string, public originalError?: Error | ZodError) {
    super(message);
    this.name = 'StackParseError';
    // Capture stack trace
    if (originalError?.stack) {
        this.stack = `${this.stack}\nCaused by: ${originalError.stack}`;
    }
  }
}

/**
 * Parses and validates a stack configuration file (YAML or JSON).
 *
 * Supports `.yaml`, `.yml`, and `.json` file extensions.
 *
 * @param filePath - The absolute path to the stack configuration file.
 * @returns A promise that resolves with the validated StackConfig object.
 * @throws {StackParseError} If reading the file fails, parsing fails (invalid YAML/JSON),
 *                           or the configuration does not match the StackConfigSchema.
 */
export async function parseStackConfigFile(filePath: string): Promise<StackConfig> {
  let rawContent: string;
  try {
    rawContent = await fs.readFile(filePath, 'utf-8');
  } catch (error: any) {
    throw new StackParseError(`Failed to read stack file: ${filePath}`, error);
  }

  let parsedConfig: unknown; // Use unknown for safer type handling
  const fileExt = path.extname(filePath).toLowerCase();

  try {
    if (fileExt === '.yaml' || fileExt === '.yml') {
      // parsedConfig = yaml.load(rawContent);
      parsedConfig = YAML.parse(rawContent);
    } else if (fileExt === '.json') {
      parsedConfig = JSON.parse(rawContent);
    } else {
      // Should ideally be caught by file finding logic, but good to double-check
      throw new Error(`Unsupported file extension: ${fileExt}. Only .yaml, .yml, or .json are supported.`);
    }
  } catch (error: any) {
    // Catch errors from YAML.parse or JSON.parse
    throw new StackParseError(`Failed to parse stack file content: ${filePath}`, error);
  }

  // Basic check before Zod parsing
  if (typeof parsedConfig !== 'object' || parsedConfig === null) {
    throw new StackParseError(`Invalid stack configuration format in ${filePath}. Expected a root object.`);
  }

  try {
    // Validate the parsed object against the Zod schema
    const validatedConfig = StackConfigSchema.parse(parsedConfig);
    return validatedConfig;
  } catch (error: unknown) {
    if (error instanceof ZodError) {
        // Log the detailed Zod error for debugging
        console.error("Stack configuration validation failed:", JSON.stringify(error.errors, null, 2));
        // Create a more user-friendly error message
        const errorSummary = error.errors.map(e => `${e.path.join('.') || 'root'}: ${e.message}`).join('; ');
        throw new StackParseError(`Stack configuration validation failed for ${filePath}: ${errorSummary}`, error);
    }
    // Handle unexpected errors during validation
    throw new StackParseError(`An unexpected validation error occurred for ${filePath}`, error instanceof Error ? error : new Error(String(error)));
  }
} 