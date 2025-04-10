import { z } from 'zod';
import { existsSync, readFileSync } from 'fs';
import * as yaml from 'yaml';
import { StackConfigSchema, type StackConfig } from '@devx/common';
import { logger } from '@devx/common';

/**
 * Custom error class for stack configuration parsing and validation errors.
 */
export class StackParseError extends Error {
  /**
   * Creates an instance of StackParseError.
   * @param message - The error message.
   * @param details - Additional details about the error.
   */
  constructor(
    message: string,
    public details?: any
  ) {
    super(message);
    this.name = 'StackParseError';
  }
}

/**
 * Parses the raw content of a stack configuration file (YAML or JSON).
 *
 * @param content - The string content of the configuration file.
 * @param filePath - The path to the file (used for error messages).
 * @returns The parsed and validated StackConfig object.
 * @throws {StackParseError} If parsing or validation fails.
 */
export function parseStackConfigFile(
  content: string,
  filePath: string
): StackConfig {
  let rawConfig: unknown;
  try {
    // Try parsing as YAML first, then fall back to JSON
    if (filePath.endsWith('.yml') || filePath.endsWith('.yaml')) {
      rawConfig = yaml.parse(content);
    } else {
      rawConfig = JSON.parse(content);
    }
  } catch (error: any) {
    logger.error(`Failed to parse configuration file: ${filePath}`, error);
    throw new StackParseError(
      `Failed to parse configuration file: ${filePath}. Invalid ${filePath.endsWith('.yml') || filePath.endsWith('.yaml') ? 'YAML' : 'JSON'}.`,
      error
    );
  }

  const result = StackConfigSchema.safeParse(rawConfig);

  if (!result.success) {
    logger.error(
      `Invalid stack configuration in ${filePath}:`,
      result.error.issues
    );
    throw new StackParseError(
      `Invalid stack configuration in ${filePath}`,
      result.error.issues
    );
  }

  return result.data;
}

/**
 * Loads and validates a stack configuration file from a given path.
 *
 * @param filePath - The absolute or relative path to the `.stack.yml` or `.stack.json` file.
 * @returns The validated StackConfig object.
 * @throws {StackParseError} If the file doesn't exist, cannot be read, or is invalid.
 */
export function loadStackConfig(filePath: string): StackConfig {
  if (!existsSync(filePath)) {
    throw new StackParseError(
      `Stack configuration file not found: ${filePath}`
    );
  }

  let content: string;
  try {
    content = readFileSync(filePath, 'utf-8');
  } catch (error: any) {
    logger.error(`Failed to read configuration file: ${filePath}`, error);
    throw new StackParseError(
      `Failed to read configuration file: ${filePath}`,
      error
    );
  }

  return parseStackConfigFile(content, filePath);
}
