import { type StackConfig } from '@devx/common';
/**
 * Custom error class for stack configuration parsing and validation errors.
 */
export declare class StackParseError extends Error {
    details?: any;
    /**
     * Creates an instance of StackParseError.
     * @param message - The error message.
     * @param details - Additional details about the error.
     */
    constructor(message: string, details?: any);
}
/**
 * Parses the raw content of a stack configuration file (YAML or JSON).
 *
 * @param content - The string content of the configuration file.
 * @param filePath - The path to the file (used for error messages).
 * @returns The parsed and validated StackConfig object.
 * @throws {StackParseError} If parsing or validation fails.
 */
export declare function parseStackConfigFile(content: string, filePath: string): StackConfig;
/**
 * Loads and validates a stack configuration file from a given path.
 *
 * @param filePath - The absolute or relative path to the `.stack.yml` or `.stack.json` file.
 * @returns The validated StackConfig object.
 * @throws {StackParseError} If the file doesn't exist, cannot be read, or is invalid.
 */
export declare function loadStackConfig(filePath: string): StackConfig;
