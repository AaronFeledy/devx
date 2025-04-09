import { StackConfig } from '@devx/stack';

/**
 * Represents the configuration for a development stack,
 * typically parsed from a .stack.yml file.
 */

/**
 * Interface defining the contract for a Builder Plugin.
 * Builder plugins are responsible for interacting with specific container orchestrators
 * (like podman-compose, docker-compose, or Kubernetes) to manage the lifecycle
 * of a development stack based on a `StackConfig`.
 */
export interface BuilderPlugin {
  /**
   * A unique identifier for the builder plugin.
   * This name is used to select the appropriate plugin via configuration.
   * @example 'podman-compose'
   * @example 'docker-compose'
   */
  name: string;

  /**
   * Generates the orchestrator-specific configuration file content (e.g., podman-compose.yaml)
   * based on the provided stack configuration.
   *
   * @param stack - The parsed `StackConfig` object representing the desired state.
   * @returns A promise that resolves with the configuration file content as a string.
   * @throws {Error} If the configuration generation fails.
   */
  generateConfig(stack: StackConfig): Promise<string>;

  /**
   * Builds the necessary container images defined in the stack configuration.
   * This maps to commands like `docker-compose build` or might be part of `up`.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory containing the stack configuration.
   *                    This is often needed to resolve relative paths in the stack config (e.g., build contexts).
   * @returns A promise that resolves when the build process is complete.
   * @throws {Error} If the build process fails.
   */
  build(stack: StackConfig, projectPath: string): Promise<void>;

  /**
   * Starts the services defined in the stack configuration.
   * This typically involves creating networks, volumes, and containers.
   * It often implies building images if they don't exist or if specified.
   * Maps to commands like `podman-compose up -d`.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves when the stack is successfully started.
   * @throws {Error} If starting the stack fails.
   */
  start(stack: StackConfig, projectPath: string): Promise<void>;

  /**
   * Stops the running services defined in the stack configuration.
   * This usually stops and removes the containers but leaves networks and volumes intact.
   * Maps to commands like `podman-compose down`.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves when the stack is successfully stopped.
   * @throws {Error} If stopping the stack fails.
   */
  stop(stack: StackConfig, projectPath: string): Promise<void>;

  /**
   * Stops and removes all resources associated with the stack configuration,
   * including containers, networks, and potentially volumes.
   * Maps to commands like `podman-compose down --volumes`.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves when the stack is completely destroyed.
   * @throws {Error} If destroying the stack fails.
   */
  destroy(stack: StackConfig, projectPath: string): Promise<void>;
} 