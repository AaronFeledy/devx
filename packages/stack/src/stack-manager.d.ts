import type { StackConfig } from '@devx/common';
type StackId = string;
export interface StackInfo {
  id: StackId;
  name: string;
  status: 'running' | 'stopped' | 'starting' | 'stopping' | 'error' | 'unknown';
}
/**
 * Lists all managed stacks.
 * @returns A promise resolving to an array of StackInfo objects.
 */
export declare const listStacks: () => Promise<StackInfo[]>;
/**
 * Gets the status of a specific stack.
 * @param stackId - The ID or name of the stack.
 * @returns A promise resolving to the StackInfo object or null if not found.
 */
export declare const getStackStatus: (
  stackId: StackId
) => Promise<StackInfo | null>;
/**
 * Initializes or creates a stack based on configuration.
 * This might involve parsing a .stack.yml or taking a config object.
 * @param config - The stack configuration.
 * @returns A promise resolving to the new StackInfo.
 */
export declare const createStack: (config: StackConfig) => Promise<StackInfo>;
/**
 * Starts a stack.
 * @param stackId - The ID or name of the stack.
 * @returns A promise resolving when the start command is initiated.
 */
export declare const startStack: (stackId: StackId) => Promise<void>;
/**
 * Stops a stack.
 * @param stackId - The ID or name of the stack.
 * @returns A promise resolving when the stop command is initiated.
 */
export declare const stopStack: (stackId: StackId) => Promise<void>;
/**
 * Destroys a stack (stops and removes containers, volumes, networks).
 * @param stackId - The ID or name of the stack.
 * @returns A promise resolving when the destroy command is initiated.
 */
export declare const destroyStack: (stackId: StackId) => Promise<void>;
export {};
