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

const execAsync = promisify(exec);

/** Directory within the project to store generated compose files. */
const DEVX_PROJECT_DIR = '.devx';

/** Utility to run podman-compose commands and handle errors */
async function runPodmanComposeCommand(
  args: string[],
  cwd: string
): Promise<{ stdout: string; stderr: string }> {
  const command = `podman-compose ${args.join(' ')}`;
  logger.debug(`Executing in ${cwd}: ${command}`);
  try {
    // Inherit stdio might be useful for long-running commands like build/up if needed
    const { stdout, stderr } = await execAsync(command, { cwd });
    if (stderr) {
      logger.warn(`podman-compose stderr:`, stderr);
    }
    return { stdout, stderr };
  } catch (error: any) {
    const errorMessage = `podman-compose command failed: ${command}\nError: ${error.message}`;
    logger.error(errorMessage, { stderr: error.stderr, stdout: error.stdout });
    throw new Error(errorMessage, { cause: error });
  }
}

/**
 * Implementation of the podman-compose Builder Plugin.
 */
const podmanComposeBuilder: BuilderPlugin = {
  type: 'builder',
  name: 'podman-compose',

  async isAvailable(): Promise<boolean> {
    try {
      await runPodmanComposeCommand(['-v'], process.cwd());
      return true;
    } catch (error) {
      logger.warn('podman-compose command check failed:', error);
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
      if (service.volumes) serviceDef.volumes = service.volumes;
      if (service.environment) serviceDef.environment = service.environment;
      if (service.depends_on) serviceDef.depends_on = service.depends_on;
      if (service.command) serviceDef.command = service.command;
      if (service.entrypoint) serviceDef.entrypoint = service.entrypoint;
      if (service.networks) serviceDef.networks = service.networks;

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
        logger.debug(`Created .devx directory: ${devxDir}`);
      }
      await fs.writeFile(composeFilePath, composeYaml, 'utf-8');
      logger.debug(`Generated podman-compose file: ${composeFilePath}`);
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
    logger.info(`[${this.name} - ${config.name}] Building stack...`);
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
    logger.info(`[${this.name} - ${config.name}] Starting stack...`);
    await runPodmanComposeCommand(args, projectPath);
    logger.info(`[${this.name} - ${config.name}] Stack start initiated.`);
  },

  async stop(config: StackConfig, projectPath: string): Promise<void> {
    const composeFile = path.join(
      projectPath,
      DEVX_PROJECT_DIR,
      `podman-compose.${config.name}.yaml`
    );
    if (!existsSync(composeFile)) {
      logger.warn(
        `[${this.name} - ${config.name}] Compose file not found (${composeFile}), assuming stack is stopped.`
      );
      return;
    }
    const args = ['-f', composeFile, '--project-name', config.name, 'down'];
    logger.info(`[${this.name} - ${config.name}] Stopping stack...`);
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
        `[${this.name} - ${config.name}] Compose file not found (${composeFile}), assuming stack is destroyed.`
      );
      return;
    }
    const args = ['-f', composeFile, '--project-name', config.name, 'down'];
    if (options?.removeVolumes) {
      args.push('--volumes');
    }
    logger.info(
      `[${this.name} - ${config.name}] Destroying stack (volumes removed: ${!!options?.removeVolumes})...`
    );
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
      `podman-compose plugin initialized. podman-compose available: ${available}`
    );
    if (!available) {
      logger.warn(
        'podman-compose command not found or not working. The podman-compose builder plugin might not function correctly.'
      );
    }
  },
};

// Register the plugin
registerPlugin(podmanComposePlugin);

export { podmanComposePlugin };
