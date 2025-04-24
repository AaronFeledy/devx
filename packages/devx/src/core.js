import { loadStackConfig } from '@devx/stack';
import { builderManager } from '@devx/builder';
import { engineManager } from '@devx/engine';
import { getGlobalConfig } from './config/index.js';
import {
  getStackState,
  updateStackState,
  removeStackState,
  getInitialStackState,
  StackBuildStatus,
} from './state/index.js';
import { dirname } from 'path';
import { logger, StackStatus } from '@devx/common';
/**
 * Finds and loads the stack configuration for a given name or path.
 * Also initializes its state if it's the first time seeing this stack.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @returns A tuple containing the loaded StackConfig and its absolute config path.
 * @throws {Error} If the stack config cannot be found or parsed.
 */
async function loadStack(stackIdentifier) {
  try {
    const result = await loadStackConfig(stackIdentifier);
    if (!result) {
      throw new Error(
        `Stack configuration not found for '${stackIdentifier}'.`
      );
    }
    const { stackConfig, configPath } = result;
    const state = await getStackState(stackConfig.name);
    if (!state) {
      logger.debug(`Initializing state for new stack: ${stackConfig.name}`);
      const initialState = getInitialStackState(stackConfig, configPath);
      await updateStackState(stackConfig.name, initialState);
    }
    return [stackConfig, configPath];
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    logger.error(
      `Failed to load stack configuration for '${stackIdentifier}': ${errorMessage}`,
      error
    );
    throw new Error(
      `Failed to load stack configuration for '${stackIdentifier}'.`,
      { cause: error }
    );
  }
}
/**
 * Retrieves the builder plugin instance based on stack config or global defaults.
 *
 * @param stackConfig - The loaded stack configuration.
 * @returns The appropriate BuilderPlugin instance.
 * @throws {Error} If the specified or default builder plugin is not found.
 */
async function getBuilder(stackConfig) {
  const globalConfig = await getGlobalConfig();
  const builderName = stackConfig.builder?.name ?? globalConfig.defaultBuilder;
  if (!builderName) {
    throw new Error(
      `No builder specified for stack '${stackConfig.name}' and no default builder configured.`
    );
  }
  try {
    if (!builderManager || typeof builderManager.getPlugin !== 'function') {
      throw new Error('builderManager is not correctly setup or implemented.');
    }
    return builderManager.getPlugin(builderName);
  } catch (error) {
    logger.error(
      `Failed to get builder plugin '${builderName}' for stack '${stackConfig.name}'`,
      error
    );
    throw new Error(
      `Failed to get builder plugin '${builderName}' for stack '${stackConfig.name}'`,
      { cause: error }
    );
  }
}
/**
 * Retrieves the engine plugin instance based on stack config or global defaults.
 *
 * @param stackConfig - The loaded stack configuration.
 * @returns The appropriate EnginePlugin instance.
 * @throws {Error} If the specified or default engine plugin is not found.
 */
async function getEngine(stackConfig) {
  const globalConfig = await getGlobalConfig();
  const engineName = stackConfig.engine?.name ?? globalConfig.defaultEngine;
  if (!engineName) {
    throw new Error(
      `No engine specified for stack '${stackConfig.name}' and no default engine configured.`
    );
  }
  try {
    return engineManager.getPlugin(engineName);
  } catch (error) {
    logger.error(
      `Failed to get engine plugin '${engineName}' for stack '${stackConfig.name}'`,
      error
    );
    throw new Error(
      `Failed to get engine plugin '${engineName}' for stack '${stackConfig.name}'`,
      { cause: error }
    );
  }
}
/**
 * Builds the specified stack using the configured builder plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {Error} If the build process fails.
 */
export async function build(stackIdentifier) {
  const [stackConfig, configPath] = await loadStack(stackIdentifier);
  const builder = await getBuilder(stackConfig);
  const projectPath = dirname(configPath);
  logger.info(
    `Building stack '${stackConfig.name}' using builder '${builder.name}'...`
  );
  try {
    await builder.build(stackConfig, projectPath);
    await updateStackState(stackConfig.name, {
      buildStatus: StackBuildStatus.Built,
      lastBuiltAt: new Date(),
      lastError: null,
    });
    logger.info(`Stack '${stackConfig.name}' built successfully.`);
  } catch (error) {
    await updateStackState(stackConfig.name, {
      buildStatus: StackBuildStatus.Error,
      lastError: error instanceof Error ? error.message : String(error),
    });
    logger.error(`Failed to build stack '${stackConfig.name}'`, error);
    throw new Error(`Failed to build stack '${stackConfig.name}'`, {
      cause: error,
    });
  }
}
/**
 * Starts the specified stack using the configured builder plugin.
 * Ensures the stack is built first.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {Error} If the start process fails.
 */
export async function start(stackIdentifier) {
  const [stackConfig, configPath] = await loadStack(stackIdentifier);
  const builder = await getBuilder(stackConfig);
  const projectPath = dirname(configPath);
  let state = await getStackState(stackConfig.name);
  if (!state || state.buildStatus !== StackBuildStatus.Built) {
    logger.warn(
      `Stack '${stackConfig.name}' is not built or build status is unknown. Attempting to build first...`
    );
    try {
      await build(stackIdentifier);
      state = await getStackState(stackConfig.name);
      if (!state || state.buildStatus !== StackBuildStatus.Built) {
        throw new Error('Build completed but state indicates failure.');
      }
    } catch (buildError) {
      logger.error(
        `Build failed for stack '${stackConfig.name}', cannot start.`,
        buildError
      );
      throw new Error(
        `Build failed for stack '${stackConfig.name}', cannot start.`,
        { cause: buildError }
      );
    }
  }
  logger.info(
    `Starting stack '${stackConfig.name}' using builder '${builder.name}'...`
  );
  try {
    await builder.start(stackConfig, projectPath);
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Running,
      lastStartedAt: new Date(),
      lastError: null,
    });
    logger.info(`Stack '${stackConfig.name}' started successfully.`);
  } catch (error) {
    logger.error(`Failed to start stack '${stackConfig.name}'`, error);
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Error,
      lastError: error.message || 'Unknown error during start',
    });
    throw new Error(`Failed to start stack '${stackConfig.name}'`, {
      cause: error,
    });
  }
}
/**
 * Stops the specified stack using the configured builder plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {Error} If the stop process fails.
 */
export async function stop(stackIdentifier) {
  const [stackConfig, configPath] = await loadStack(stackIdentifier);
  const builder = await getBuilder(stackConfig);
  const projectPath = dirname(configPath);
  logger.info(
    `Stopping stack '${stackConfig.name}' using builder '${builder.name}'...`
  );
  try {
    await builder.stop(stackConfig, projectPath);
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Stopped,
      lastStartedAt: null,
      lastError: null,
    });
    logger.info(`Stack '${stackConfig.name}' stopped successfully.`);
  } catch (error) {
    logger.error(`Failed to stop stack '${stackConfig.name}'`, error);
    await updateStackState(stackConfig.name, {
      lastError: error.message || 'Unknown error during stop',
    });
    throw new Error(`Failed to stop stack '${stackConfig.name}'`, {
      cause: error,
    });
  }
}
/**
 * Destroys the specified stack using the configured builder plugin.
 * Also removes the stack's state from the state file.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @param options - Options for destruction, e.g., removing volumes.
 * @throws {Error} If the destroy process fails.
 */
export async function destroy(stackIdentifier, options) {
  const [stackConfig, configPath] = await loadStack(stackIdentifier);
  const builder = await getBuilder(stackConfig);
  const projectPath = dirname(configPath);
  logger.info(
    `Destroying stack '${stackConfig.name}' using builder '${builder.name}'...`
  );
  try {
    await builder.destroy(stackConfig, projectPath, options);
    logger.info(
      `Stack '${stackConfig.name}' resources destroyed successfully.`
    );
    await removeStackState(stackConfig.name);
    logger.info(`Removed state file for stack '${stackConfig.name}'.`);
  } catch (error) {
    logger.error(`Failed to destroy stack '${stackConfig.name}'`, error);
    throw new Error(`Failed to destroy stack '${stackConfig.name}'`, {
      cause: error,
    });
  }
}
/**
 * Gets the status of the specified stack using the configured engine plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @returns The stack status information.
 * @throws {Error} If getting the status fails.
 */
export async function status(stackIdentifier) {
  const [stackConfig, configPath] = await loadStack(stackIdentifier);
  const engine = await getEngine(stackConfig);
  const projectPath = dirname(configPath);
  logger.debug(
    `Getting status for stack '${stackConfig.name}' using engine '${engine.name}'...`
  );
  try {
    const statusInfo = await engine.getStackStatus(
      stackConfig.name,
      projectPath
    );
    await updateStackState(stackConfig.name, {
      runtimeStatus: statusInfo.status,
      lastError:
        statusInfo.status === StackStatus.Error ? statusInfo.message : null,
    });
    logger.debug(`Stack '${stackConfig.name}' status: ${statusInfo.status}`);
    return statusInfo;
  } catch (error) {
    logger.error(`Failed to get status for stack '${stackConfig.name}'`, error);
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Error,
      lastError: error.message || 'Unknown error getting status',
    });
    return {
      status: StackStatus.Error,
      message: `Failed to get status: ${error.message}`,
    };
  }
}
