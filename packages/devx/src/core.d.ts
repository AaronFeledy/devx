import { type StackStatusInfo } from '@devx/common';
/**
 * Builds the specified stack using the configured builder plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {Error} If the build process fails.
 */
export declare function build(stackIdentifier: string): Promise<void>;
/**
 * Starts the specified stack using the configured builder plugin.
 * Ensures the stack is built first.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {Error} If the start process fails.
 */
export declare function start(stackIdentifier: string): Promise<void>;
/**
 * Stops the specified stack using the configured builder plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {Error} If the stop process fails.
 */
export declare function stop(stackIdentifier: string): Promise<void>;
/**
 * Destroys the specified stack using the configured builder plugin.
 * Also removes the stack's state from the state file.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @param options - Options for destruction, e.g., removing volumes.
 * @throws {Error} If the destroy process fails.
 */
export declare function destroy(stackIdentifier: string, options?: {
    removeVolumes?: boolean;
}): Promise<void>;
/**
 * Gets the status of the specified stack using the configured engine plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @returns The stack status information.
 * @throws {Error} If getting the status fails.
 */
export declare function status(stackIdentifier: string): Promise<StackStatusInfo>;
