import type { StackConfig } from '@devx/stack';

/**
 * Represents the possible runtime statuses of a DevX stack.
 */
export enum StackStatus {
  /** The stack is not currently running or known to the engine. */
  Stopped = 'stopped',
  /** The stack is currently running. */
  Running = 'running',
  /** The stack is in an error state or some components failed. */
  Error = 'error',
  /** The status of the stack is unknown. */
  Unknown = 'unknown',
}

/**
 * Interface for DevX engine plugins.
 * Each plugin provides methods to manage the lifecycle of a stack
 * using a specific container runtime (e.g., Podman, Docker).
 */
export interface EnginePlugin {
  /**
   * The unique name of the engine plugin (e.g., 'podman', 'docker').
   */
  name: string;

  /**
   * Starts the services defined in the stack configuration.
   *
   * @param stack - The configuration of the stack to start.
   * @returns A promise that resolves when the stack has been started, or rejects on error.
   */
  start(stack: StackConfig): Promise<void>;

  /**
   * Stops the services associated with the given stack configuration.
   *
   * @param stack - The configuration of the stack to stop.
   * @returns A promise that resolves when the stack has been stopped, or rejects on error.
   */
  stop(stack: StackConfig): Promise<void>;

  /**
   * Retrieves the current runtime status of the stack.
   *
   * @param stack - The configuration of the stack to check.
   * @returns A promise that resolves with the current StackStatus.
   */
  status(stack: StackConfig): Promise<StackStatus>;

  /**
   * Destroys all resources associated with the stack (containers, volumes, networks).
   *
   * @param stack - The configuration of the stack to destroy.
   * @returns A promise that resolves when the stack has been destroyed, or rejects on error.
   */
  destroy(stack: StackConfig): Promise<void>;
} 