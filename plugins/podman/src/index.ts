import {
  registerPlugin,
  type Plugin,
  type EnginePlugin,
  StackStatus,
  type StackStatusInfo,
  logger,
} from '@devx/common';
import { promisify } from 'util';
import { exec } from 'child_process';

const execAsync = promisify(exec);

/** Utility to run podman commands and handle errors */
async function runPodmanCommand(
  args: string[],
  cwd?: string
): Promise<{ stdout: string; stderr: string }> {
  const command = `podman ${args.join(' ')}`;
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    return { stdout, stderr };
  } catch (error: any) {
    const errorMessage = `Podman command failed: ${command}\nError: ${error.message}`;
    logger.error(errorMessage, { stderr: error.stderr, stdout: error.stdout });
    throw new Error(errorMessage, { cause: error });
  }
}

/** Type definition for the output of `podman ps --format json` */
interface PodmanContainerInfo {
  Id: string;
  Names: string[];
  State: string; // e.g., "running", "exited", "created"
  Status: string; // e.g., "Up 2 hours", "Exited (0) 5 minutes ago"
  Labels: { [key: string]: string };
  Ports: { host_port: number; container_port: number; protocol: string }[];
  // Add other fields as needed
}

/**
 * Implementation of the Podman Engine Plugin.
 */
const podmanEngine: EnginePlugin = {
  type: 'engine',
  name: 'podman',

  /**
   * Checks if the Podman command-line tool is available.
   * @returns True if Podman is available, false otherwise.
   */
  async isAvailable(): Promise<boolean> {
    try {
      await runPodmanCommand(['-v']);
      // Optionally run 'podman info' for a more thorough check
      return true;
    } catch (error) {
      logger.warn('Podman command check failed:', error);
      return false;
    }
  },

  async getStackStatus(
    stackName: string,
    projectPath: string
  ): Promise<StackStatusInfo> {
    const logPrefix = `[podman engine - ${stackName}]:`;
    logger.debug(`${logPrefix} Getting stack status.`);

    // Podman compose typically uses this label for project association
    const projectLabel = `com.docker.compose.project=${stackName}`;

    try {
      const { stdout } = await runPodmanCommand(
        [
          'ps',
          '-a', // Include stopped containers
          '--filter',
          `label=${projectLabel}`,
          '--format',
          'json',
        ],
        projectPath
      );

      let containers: PodmanContainerInfo[] = [];
      if (stdout.trim()) {
        try {
          containers = JSON.parse(stdout);
        } catch (parseError) {
          logger.error(
            `${logPrefix} Failed to parse podman ps output:`,
            parseError,
            { stdout }
          );
          return {
            status: StackStatus.Error,
            message: 'Failed to parse container status.',
          };
        }
      }

      if (containers.length === 0) {
        logger.debug(`${logPrefix} No containers found for this stack.`);
        // We need more context to differentiate stopped vs not-created.
        // A builder plugin might store metadata, or we check for config file existence.
        // For now, assume if no containers, it's stopped or not created.
        return {
          status: StackStatus.Stopped, // Or NotCreated - needs refinement
          message: 'No containers found for this stack.',
        };
      }

      const services: StackStatusInfo['services'] = {};
      let overallStatus: StackStatus = StackStatus.Running; // Assume running unless proven otherwise
      let hasError = false;
      let hasStopped = false;

      for (const container of containers) {
        // Extract service name - often in Labels or deduced from Names
        const serviceName =
          container.Labels['com.docker.compose.service'] ||
          container.Names[0]?.split('-')[1] ||
          'unknown';

        services[serviceName] = {
          status: `${container.State} (${container.Status})`,
          ports:
            container.Ports?.map((p) => ({
              hostPort: p.host_port,
              containerPort: p.container_port,
              protocol: p.protocol,
            })) || [],
        };

        // Determine overall stack status based on container states
        if (container.State === 'exited' || container.State === 'stopped') {
          hasStopped = true;
          if (
            container.Status.includes('(') &&
            !container.Status.includes('(0)')
          ) {
            // Crude check for non-zero exit code
            hasError = true;
          }
        } else if (container.State !== 'running') {
          // If any container is not running/exited (e.g., creating, paused), mark status as Unknown/Transitioning
          overallStatus = StackStatus.Unknown;
        }
      }

      if (hasError) {
        overallStatus = StackStatus.Error;
      } else if (overallStatus === StackStatus.Running && hasStopped) {
        // If some are running and some are stopped (exit 0), consider it partially running or Degraded?
        // For simplicity, let's call it Error for now if not all running.
        overallStatus = StackStatus.Error; // Or maybe a new status like 'Degraded'
        logger.warn(
          `${logPrefix} Stack has a mix of running and stopped containers.`
        );
      } else if (hasStopped && overallStatus !== StackStatus.Error) {
        // All containers are stopped/exited (exit 0)
        overallStatus = StackStatus.Stopped;
      }
      // If no containers were stopped/error and none were unknown, it remains Running.

      logger.debug(`${logPrefix} Stack status determined: ${overallStatus}`);
      return {
        status: overallStatus,
        services: services,
      };
    } catch (error: any) {
      logger.error(`${logPrefix} Failed to get stack status:`, error);
      // Handle specific errors, e.g., podman daemon not running
      if (error.message?.includes('Cannot connect to the Podman socket')) {
        return {
          status: StackStatus.Error,
          message: 'Cannot connect to Podman daemon.',
        };
      }
      return {
        status: StackStatus.Error,
        message: `Failed to query container status: ${error.message}`,
      };
    }
  },

  // TODO: Implement other EnginePlugin methods (start, stop, pull, etc.)
};

/**
 * The main Podman plugin definition.
 */
const podmanPlugin: Plugin = {
  name: '@devx/plugin-podman',
  version: '0.1.0',
  description: 'Provides Podman engine support for DevX',
  engine: podmanEngine,

  async initialize(): Promise<void> {
    // Initialization logic for the plugin (e.g., check Podman version)
    const available = await this.engine?.isAvailable();
    logger.info(`Podman plugin initialized. Podman available: ${available}`);
    if (!available) {
      logger.warn(
        'Podman command not found or not working. The Podman engine plugin might not function correctly.'
      );
    }
  },
};

// Register the plugin with the central manager
registerPlugin(podmanPlugin);

// Optionally export parts of the plugin if needed elsewhere
export { podmanPlugin };
