import type { StackConfig } from '@devx/stack';

/**
 * Represents the configuration for a development stack,
 * typically parsed from a .stack.yml file.
 */

/**
 * Represents the result of a successful build operation.
 */
export interface BuildResult {
    /** Optional path to a generated manifest file (e.g., Kubernetes YAML). */
    manifestPath?: string;
}

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
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves with the configuration file content as a string.
   * @throws {Error} If the configuration generation fails.
   */
  generateConfig(stack: StackConfig, projectPath: string): Promise<string>;

  /**
   * Builds the necessary container images or configurations defined in the stack.
   *
   * @param stack - The `StackConfig` object.
   * @param options - Builder-specific options from the stack config or global config.
   * @returns A promise that resolves with BuildResult (e.g., path to generated manifest) or void.
   * @throws {Error} If the build process fails.
   */
  build(stack: StackConfig, options?: Record<string, any>): Promise<BuildResult | void>;

  /**
   * Starts the services defined in the stack configuration.
   * This typically involves creating networks, volumes, and containers.
   * Implies build if not already built.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves when the stack is successfully started.
   * @throws {Error} If starting the stack fails.
   */
  start(stack: StackConfig, projectPath: string): Promise<void>;

  /**
   * Stops the running services defined in the stack configuration.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves when the stack is successfully stopped.
   * @throws {Error} If stopping the stack fails.
   */
  stop(stack: StackConfig, projectPath: string): Promise<void>;

  /**
   * Stops and removes all resources associated with the stack configuration.
   *
   * @param stack - The `StackConfig` object.
   * @param projectPath - The absolute path to the project directory.
   * @returns A promise that resolves when the stack is completely destroyed.
   * @throws {Error} If destroying the stack fails.
   */
  destroy(stack: StackConfig, projectPath: string): Promise<void>;
} 