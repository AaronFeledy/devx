import { loadStackConfig, parseStackConfigFile } from '@devx/stack';
import type { StackConfig } from '@devx/stack';
import { builderManager } from '@devx/builder';
import { engineManager, StackStatus } from '@devx/engine';
import { getGlobalConfig } from './config';
import {
  getStackState,
  updateStackState,
  removeStackState,
  getInitialStackState,
  StackBuildStatus,
} from './state';
import { resolve } from 'path';
import { homedir } from 'os';
import { join } from 'path';

/**
 * Error class for DevX core operations.
 */
export class DevxCoreError extends Error {
  constructor(message: string, public cause?: unknown) {
    super(message);
    this.name = 'DevxCoreError';
  }
}

/**
 * Finds and loads the stack configuration for a given name or path.
 * Also initializes its state if it's the first time seeing this stack.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @returns A tuple containing the loaded StackConfig and its absolute config path.
 * @throws {DevxCoreError} If the stack config cannot be found or parsed.
 */
async function loadStack(
  stackIdentifier: string
): Promise<[StackConfig, string]> {
  try {
    const stackConfig = await loadStackConfig(stackIdentifier);
    if (!stackConfig.configPath) {
        throw new Error(`Stack configuration loaded for '${stackIdentifier}' but is missing its configPath property.`);
    }
    const absoluteConfigPath = stackConfig.configPath;

    // Initialize state if it doesn't exist
    let state = await getStackState(stackConfig.name);
    if (!state) {
      console.debug(`Initializing state for new stack: ${stackConfig.name}`);
      state = getInitialStackState(stackConfig, absoluteConfigPath);
      await updateStackState(stackConfig.name, state); // Save initial state
    }

    return [stackConfig, absoluteConfigPath];
  } catch (error) {
    throw new DevxCoreError(
      `Failed to load stack configuration for '${stackIdentifier}'`,
      error
    );
  }
}

/**
 * Retrieves the builder plugin instance based on stack config or global defaults.
 *
 * @param stackConfig - The loaded stack configuration.
 * @returns The appropriate BuilderPlugin instance.
 * @throws {DevxCoreError} If the specified or default builder plugin is not found.
 */
async function getBuilder(stackConfig: StackConfig) {
  const globalConfig = await getGlobalConfig();
  const builderName = stackConfig.builder?.name ?? globalConfig.defaultBuilder;
  if (!builderName) {
    throw new DevxCoreError(
      `No builder specified for stack '${stackConfig.name}' and no default builder configured.`
    );
  }
  try {
    return builderManager.getPlugin(builderName);
  } catch (error) {
    throw new DevxCoreError(
      `Failed to get builder plugin '${builderName}' for stack '${stackConfig.name}'`,
      error
    );
  }
}

/**
 * Retrieves the engine plugin instance based on stack config or global defaults.
 *
 * @param stackConfig - The loaded stack configuration.
 * @returns The appropriate EnginePlugin instance.
 * @throws {DevxCoreError} If the specified or default engine plugin is not found.
 */
async function getEngine(stackConfig: StackConfig) {
  const globalConfig = await getGlobalConfig();
  const engineName = stackConfig.engine?.name ?? globalConfig.defaultEngine;
  if (!engineName) {
    throw new DevxCoreError(
      `No engine specified for stack '${stackConfig.name}' and no default engine configured.`
    );
  }
  try {
    return engineManager.getPlugin(engineName);
  } catch (error) {
    throw new DevxCoreError(
      `Failed to get engine plugin '${engineName}' for stack '${stackConfig.name}'`,
      error
    );
  }
}

/**
 * Builds the specified stack using the configured builder plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {DevxCoreError} If the build process fails.
 */
export async function build(stackIdentifier: string): Promise<void> {
  const [stackConfig] = await loadStack(stackIdentifier);
  const builder = await getBuilder(stackConfig);

  console.log(`Building stack '${stackConfig.name}' using builder '${builder.name}'...`);

  try {
    // Pass builder-specific options from stack config if they exist
    const builderOptions = stackConfig.builder?.options ?? {};
    const buildResult = await builder.build(stackConfig, builderOptions);

    // Update state with build success and manifest path
    await updateStackState(stackConfig.name, {
      buildStatus: StackBuildStatus.Built,
      lastBuiltAt: new Date(),
      manifestPath: buildResult?.manifestPath, // Store path from builder result
      lastError: null, // Clear previous errors
    });

    console.log(`Stack '${stackConfig.name}' built successfully.`);
    if (buildResult?.manifestPath) {
        console.log(`Manifest generated at: ${buildResult.manifestPath}`);
    }
  } catch (error) {
    // Update state with build failure
    await updateStackState(stackConfig.name, {
      buildStatus: StackBuildStatus.BuildFailed,
      lastError: error instanceof Error ? error.message : String(error),
    });
    throw new DevxCoreError(
      `Failed to build stack '${stackConfig.name}'`,
      error
    );
  }
}

/**
 * Starts the specified stack using the configured engine plugin.
 * If the stack is not built, it attempts to build it first.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {DevxCoreError} If the start process fails.
 */
export async function start(stackIdentifier: string): Promise<void> {
  const [stackConfig] = await loadStack(stackIdentifier);
  const engine = await getEngine(stackConfig);
  let state = await getStackState(stackConfig.name);

  // Check if built, build if necessary
  if (!state || state.buildStatus !== StackBuildStatus.Built) {
    console.warn(
      `Stack '${stackConfig.name}' is not built or build status is unknown. Attempting to build first...`
    );
    try {
      await build(stackIdentifier); // Use the identifier to rebuild
      state = await getStackState(stackConfig.name); // Re-fetch state after build
      if (!state || state.buildStatus !== StackBuildStatus.Built) {
        throw new Error('Build completed but state indicates failure.');
      }
    } catch (error) {
      throw new DevxCoreError(
        `Build failed for stack '${stackConfig.name}', cannot start.`, error);
    }
  }

  // Refinement: The engine might need the manifest path. We assume the engine
  // plugin knows how to find it based on convention or state for now.
  // We added manifestPath to StackState, the engine could potentially retrieve it.
  // Alternatively, we could pass it explicitly if required by the EnginePlugin interface.

  console.log(`Starting stack '${stackConfig.name}' using engine '${engine.name}'...`);

  try {
    await engine.start(stackConfig);

    // Update state with runtime status
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Running, // Assume Running, status check might refine this
      lastStartedAt: new Date(),
      lastError: null,
    });

    console.log(`Stack '${stackConfig.name}' started successfully.`);
  } catch (error) {
    // Update state with runtime error
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Error,
      lastError: error instanceof Error ? error.message : String(error),
    });
    throw new DevxCoreError(
      `Failed to start stack '${stackConfig.name}'`,
      error
    );
  }
}

/**
 * Stops the specified stack using the configured engine plugin.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {DevxCoreError} If the stop process fails.
 */
export async function stop(stackIdentifier: string): Promise<void> {
  const [stackConfig] = await loadStack(stackIdentifier);
  const engine = await getEngine(stackConfig);

  console.log(`Stopping stack '${stackConfig.name}' using engine '${engine.name}'...`);

  try {
    await engine.stop(stackConfig);

    // Update state with runtime status
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Stopped,
      lastStartedAt: null, // Clear start time
      lastError: null,
    });

    console.log(`Stack '${stackConfig.name}' stopped successfully.`);
  } catch (error) {
     // Even if stop fails, update state to Unknown as we can't be sure
    await updateStackState(stackConfig.name, {
      runtimeStatus: StackStatus.Unknown,
      lastError: error instanceof Error ? error.message : String(error),
    });
    throw new DevxCoreError(
      `Failed to stop stack '${stackConfig.name}'`,
      error
    );
  }
}

/**
 * Destroys the specified stack using the configured engine plugin.
 * Also removes the stack's state from the state file.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @throws {DevxCoreError} If the destroy process fails.
 */
export async function destroy(stackIdentifier: string): Promise<void> {
  const [stackConfig] = await loadStack(stackIdentifier);
  const engine = await getEngine(stackConfig);

  console.log(
    `Destroying stack '${stackConfig.name}' using engine '${engine.name}'...`
  );

  try {
    await engine.destroy(stackConfig);
    console.log(`Stack '${stackConfig.name}' resources destroyed successfully.`);

    // Remove state after successful destruction
    await removeStackState(stackConfig.name);
    console.log(`Removed state information for stack '${stackConfig.name}'.`);

     // TODO: Optionally remove builder artifacts (e.g., generated manifest)
     const state = await getStackState(stackConfig.name); // Get state before removing
     if (state?.manifestPath) {
         try {
             const manifestFile = Bun.file(state.manifestPath);
             if (await manifestFile.exists()) {
                 // Use rm command or Bun fs utilities when stable
                 await Bun.spawn(['rm', state.manifestPath]).exited;
                 console.log(`Removed generated manifest: ${state.manifestPath}`);
             }
         } catch (rmError) {
             console.warn(`Failed to remove manifest file ${state.manifestPath}:`, rmError);
         }
     }

  } catch (error) {
     // Don't remove state if destroy fails, but update status to Error
     try {
         await updateStackState(stackConfig.name, {
             runtimeStatus: StackStatus.Error,
             lastError: `Destroy failed: ${error instanceof Error ? error.message : String(error)}`,
         });
     } catch (stateError) {
         console.error(`Failed to update state after destroy error for stack '${stackConfig.name}':`, stateError);
     }
    throw new DevxCoreError(
      `Failed to destroy stack '${stackConfig.name}'`,
      error
    );
  }
}

/**
 * Gets the current status of the specified stack from the engine.
 *
 * @param stackIdentifier - The name of the stack or path to its config file.
 * @returns The current StackStatus.
 * @throws {DevxCoreError} If checking status fails.
 */
export async function status(stackIdentifier: string): Promise<StackStatus> {
    const [stackConfig] = await loadStack(stackIdentifier);
    const engine = await getEngine(stackConfig);
    const state = await getStackState(stackConfig.name);

    console.log(`Checking status for stack '${stackConfig.name}' using engine '${engine.name}'...`);

    // If state says it's definitely not built, we can assume Stopped
    if (state?.buildStatus === StackBuildStatus.NotBuilt) {
        console.log(`Stack '${stackConfig.name}' is not built, reporting status as Stopped.`);
        // Ensure state reflects this if it was Unknown
        if (state.runtimeStatus !== StackStatus.Stopped) {
            await updateStackState(stackConfig.name, { runtimeStatus: StackStatus.Stopped });
        }
        return StackStatus.Stopped;
    }

    try {
        const currentStatus = await engine.status(stackConfig);
        console.log(`Reported status for stack '${stackConfig.name}': ${currentStatus}`);

        // Update state with the latest known status from the engine
        await updateStackState(stackConfig.name, {
            runtimeStatus: currentStatus,
            // Clear error only if status is not Error
            lastError: currentStatus === StackStatus.Error ? state?.lastError : null,
        });

        return currentStatus;
    } catch (error) {
        // Update state to reflect uncertainty
        try {
            await updateStackState(stackConfig.name, {
                runtimeStatus: StackStatus.Unknown,
                lastError: `Status check failed: ${error instanceof Error ? error.message : String(error)}`,
            });
        } catch (stateError) {
            console.error(`Failed to update state after status check error for stack '${stackConfig.name}':`, stateError);
        }
        throw new DevxCoreError(
            `Failed to get status for stack '${stackConfig.name}'`,
            error
        );
    }
} 