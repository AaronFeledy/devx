import {
  registerPlugin,
  type Plugin,
  type BuilderPlugin,
  logger,
} from '@devx/common';
import type { StackConfig } from '@devx/common';
import * as yaml from 'yaml';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'node:fs';
import { promisify } from 'util';
import { exec } from 'child_process';
import { homedir } from 'node:os';

const execAsync = promisify(exec);

/** Directory within the project to store generated compose files. */
const DEVX_PROJECT_DIR = '.devx';

/** Get the path to the bundled podman-compose binary */
function getBundledPodmanComposePath(): string {
  const home = homedir();
  const devxRoot = process.env.DEVX_ROOT || path.join(home, '.devx');
  const binDir = path.join(devxRoot, 'bin', 'podman', 'bin');
  return path.join(binDir, 'podman-compose');
}

/** Utility to run podman-compose commands and handle errors */
async function runPodmanComposeCommand(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  const podmanComposePath = getBundledPodmanComposePath();
  logger.debug(`Attempting to use podman-compose at: ${podmanComposePath}`);

  if (!existsSync(podmanComposePath)) {
    throw new Error(
      `Bundled podman-compose not found at: ${podmanComposePath}. Please ensure the Podman engine plugin has initialized successfully.`
    );
  }

  const command = `"${podmanComposePath}" ${args.join(' ')}`;
  logger.debug(`Executing in ${cwd}: ${command}`);
  try {
    const env = {
      ...process.env,
      CONTAINERS_STORAGE_CONF: process.env.CONTAINERS_STORAGE_CONF,
      CONTAINERS_CONTAINERS_CONF: process.env.CONTAINERS_CONTAINERS_CONF,
    };

    const { stdout, stderr } = await execAsync(command, { cwd, env });
    if (stderr) {
      logger.debug(`podman-compose stderr:
${stderr}`);
    }
    return { stdout, stderr };
  } catch (error: any) {
    const errorMessage = `Bundled podman-compose command failed: ${command}
CWD: ${cwd}
Error: ${error.message}`;
    logger.error(errorMessage, { stderr: error.stderr, stdout: error.stdout });
    error.message = `${errorMessage}
STDOUT:
${error.stdout}
STDERR:
${error.stderr}`;
    throw error;
  }
}

/**
 * Implementation of the podman-compose Builder Plugin.
 */
const podmanComposeBuilder: BuilderPlugin = {
  type: 'builder',
  name: 'podman-compose',

  async isAvailable(): Promise<boolean> {
    const podmanComposePath = getBundledPodmanComposePath();
    if (!existsSync(podmanComposePath)) {
      logger.warn(
        `Bundled podman-compose not found at ${podmanComposePath}. Assuming unavailable.`
      );
      return false;
    }
    try {
      logger.debug(
        `Checking availability of bundled podman-compose: ${podmanComposePath}`
      );
      await runPodmanComposeCommand(['--version'], process.cwd());
      logger.info(
        `Bundled podman-compose found and working at ${podmanComposePath}`
      );
      return true;
    } catch (error) {
      logger.warn(
        `Bundled podman-compose command check failed at ${podmanComposePath}:`,
        error
      );
      return false;
    }
  },

  async generateConfig(
    config: StackConfig,
    projectPath: string
  ): Promise<string> {
    const composeData: any = {
      version: '3.8',
      services: {},
      volumes: config.volumes || {},
      networks: config.networks || {},
    };

    for (const [name, service] of Object.entries(config.services)) {
      const serviceDef: any = {};
      if (service.image) serviceDef.image = service.image;
      if (service.build) {
        if (typeof service.build === 'string') {
          serviceDef.build = path.resolve(projectPath, service.build);
        } else {
          serviceDef.build = {
            ...service.build,
            context: path.resolve(projectPath, service.build.context),
          };
        }
      }
      if (service.ports) serviceDef.ports = service.ports;
      if (service.volumes) {
        serviceDef.volumes = service.volumes.map((volume: string) => {
          const parts = volume.split(':');
          if (
            parts.length >= 2 &&
            (parts[0].startsWith('./') || parts[0].startsWith('/'))
          ) {
            const hostPath = path.resolve(projectPath, parts[0]);
            return [hostPath, ...parts.slice(1)].join(':');
          }
          return volume;
        });
      }
      if (service.environment) serviceDef.environment = service.environment;
      if (service.depends_on) serviceDef.depends_on = service.depends_on;
      if (service.command) serviceDef.command = service.command;
      if (service.entrypoint) serviceDef.entrypoint = service.entrypoint;
      if (service.networks) serviceDef.networks = service.networks;
      if (service.labels) serviceDef.labels = service.labels;
      if (service.restart) serviceDef.restart = service.restart;

      serviceDef.labels = {
        ...(serviceDef.labels || {}),
        'com.docker.compose.project': config.name,
        'com.docker.compose.service': name,
      };

      composeData.services[name] = serviceDef;
    }

    if (Object.keys(composeData.volumes).length === 0)
      delete composeData.volumes;
    if (Object.keys(composeData.networks).length === 0)
      delete composeData.networks;

    const composeYaml = yaml.stringify(composeData);
    const devxDir = path.join(projectPath, DEVX_PROJECT_DIR);
    const composeFilePath = path.join(
      devxDir,
      `podman-compose.${config.name}.yaml`
    );

    try {
      if (!existsSync(devxDir)) {
        mkdirSync(devxDir, { recursive: true });
        logger.debug(`Created project .devx directory: ${devxDir}`);
      }
      await fs.writeFile(composeFilePath, composeYaml, 'utf-8');
      logger.info(`Generated podman-compose file: ${composeFilePath}`);
      return composeFilePath;
    } catch (error) {
      logger.error(
        `Failed to write podman-compose file to ${composeFilePath}`,
        error
      );
      throw new Error(
        `Failed to generate config file: ${error instanceof Error ? error.message : error}`
      );
    }
  },

  async build(config: StackConfig, projectPath: string): Promise<void> {
    const composeFile = await this.generateConfig(config, projectPath);
    const args = ['-f', composeFile, '--project-name', config.name, 'build'];
    logger.info(
      `[${this.name} - ${config.name}] Building stack via podman-compose...`
    );
    await runPodmanComposeCommand(args, projectPath);
    logger.info(`[${this.name} - ${config.name}] Stack build completed.`);
  },

  async start(config: StackConfig, projectPath: string): Promise<void> {
    const composeFile = await this.generateConfig(config, projectPath);
    const args = [
      '-f',
      composeFile,
      '--project-name',
      config.name,
      'up',
      '-d',
      '--build',
    ];
    logger.info(
      `[${this.name} - ${config.name}] Starting stack via podman-compose...`
    );
    await runPodmanComposeCommand(args, projectPath);
    logger.info(
      `[${this.name} - ${config.name}] Stack start initiated (running detached).`
    );
  },

  async stop(config: StackConfig, projectPath: string): Promise<void> {
    const composeFile = path.join(
      projectPath,
      DEVX_PROJECT_DIR,
      `podman-compose.${config.name}.yaml`
    );
    if (!existsSync(composeFile)) {
      logger.warn(
        `[${this.name} - ${config.name}] Compose file not found (${composeFile}), cannot stop stack.`
      );
      return;
    }
    const args = ['-f', composeFile, '--project-name', config.name, 'down'];
    logger.info(
      `[${this.name} - ${config.name}] Stopping stack via podman-compose...`
    );
    await runPodmanComposeCommand(args, projectPath);
    logger.info(`[${this.name} - ${config.name}] Stack stop completed.`);
  },

  async destroy(
    config: StackConfig,
    projectPath: string,
    options?: { removeVolumes?: boolean }
  ): Promise<void> {
    const composeFile = path.join(
      projectPath,
      DEVX_PROJECT_DIR,
      `podman-compose.${config.name}.yaml`
    );
    if (!existsSync(composeFile)) {
      logger.warn(
        `[${this.name} - ${config.name}] Compose file not found (${composeFile}), cannot destroy stack components defined in it.`
      );
      return;
    }
    const args = ['-f', composeFile, '--project-name', config.name, 'down'];
    if (options?.removeVolumes) {
      args.push('--volumes');
      logger.info(
        `[${this.name} - ${config.name}] Destroying stack and removing volumes...`
      );
    } else {
      logger.info(
        `[${this.name} - ${config.name}] Destroying stack (keeping volumes)...`
      );
    }
    await runPodmanComposeCommand(args, projectPath);
    logger.info(`[${this.name} - ${config.name}] Stack destruction completed.`);
  },
};

/**
 * The main podman-compose plugin definition.
 */
const podmanComposePlugin: Plugin = {
  name: '@devx/plugin-podman-compose',
  version: '0.1.0',
  description: 'Provides podman-compose builder support for DevX',
  builder: podmanComposeBuilder,

  async initialize(): Promise<void> {
    const available = await this.builder?.isAvailable();
    logger.info(
      `Podman-compose plugin initialized. Bundled podman-compose available: ${available}`
    );
    if (!available) {
      logger.error(
        'Bundled podman-compose not found or not working. The podman-compose builder plugin might not function correctly. Check Podman engine plugin initialization.'
      );
    }
  },
};

// Register the plugin
registerPlugin(podmanComposePlugin);

export { podmanComposePlugin };
