import type { StackConfig } from '@devx/stack';
import * as yaml from 'yaml';
import type { BuilderPlugin, BuildResult } from '../types';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { existsSync, mkdirSync } from 'fs';
import { runCommand } from '../util/command';

/**
 * Implements the BuilderPlugin interface for the podman-compose orchestrator.
 *
 * This plugin translates the abstract `StackConfig` into a `podman-compose.yaml` file
 * and uses the `podman-compose` command-line tool to manage the stack lifecycle.
 */
export class PodmanComposeBuilderPlugin implements BuilderPlugin {
  /** @inheritdoc */
  name = 'podman-compose';

  /** @inheritdoc */
  async generateConfig(stack: StackConfig, projectPath: string): Promise<string> {
    const composeData: any = {
      version: stack.version || '3.8',
      services: {},
      volumes: {},
      networks: {},
    };

    for (const [name, service] of Object.entries(stack.services)) {
        const serviceDef: any = {};
        if (service.image) serviceDef.image = service.image;
        if (service.build) {
            serviceDef.build = typeof service.build === 'string'
                ? path.resolve(projectPath, service.build)
                : {
                    ...service.build,
                    context: path.resolve(projectPath, service.build.context),
                  };
        }
        if (service.ports) serviceDef.ports = service.ports;
        if (service.volumes) serviceDef.volumes = service.volumes;
        if (service.environment) serviceDef.environment = service.environment;
        if (service.depends_on) serviceDef.depends_on = service.depends_on;
        if (service.networks) serviceDef.networks = service.networks;
        composeData.services[name] = serviceDef;
    }

    if (stack.volumes) composeData.volumes = stack.volumes;
    if (stack.networks) composeData.networks = stack.networks;

    if (Object.keys(composeData.volumes).length === 0) delete composeData.volumes;
    if (Object.keys(composeData.networks).length === 0) delete composeData.networks;

    return yaml.stringify(composeData);
  }

  /**
   * Determines the path for the podman-compose file.
   */
  private getComposeFilePath(projectPath: string, stackName: string): string {
    return path.resolve(
      projectPath,
      '.devx',
      'dist',
      `${stackName}.podman-compose.yaml`
    );
  }

  /**
   * Generates and writes the compose file.
   */
  private async writeComposeFile(
    stack: StackConfig,
    projectPath: string
  ): Promise<string> {
    const composeFilePath = this.getComposeFilePath(projectPath, stack.name);
    try {
      const composeConfigStr = await this.generateConfig(stack, projectPath);
      const outputDir = path.dirname(composeFilePath);
      if (!existsSync(outputDir)) {
        mkdirSync(outputDir, { recursive: true });
      }
      await fs.writeFile(composeFilePath, composeConfigStr);
      this.log(`Generated podman-compose file: ${composeFilePath}`);
      return composeFilePath;
    } catch (error) {
      this.error(`Error writing podman-compose file: ${error}`);
      throw error;
    }
  }

  /** @inheritdoc */
  async build(
    stack: StackConfig,
    options?: Record<string, any>
  ): Promise<BuildResult | void> {
    const projectPath = options?.projectPath ?? process.cwd();
    const composeFilePath = await this.writeComposeFile(stack, projectPath);
    try {
      this.log('Building images using podman-compose...');
      await runCommand('podman-compose', ['-f', composeFilePath, 'build'], {
        cwd: projectPath,
      });
      this.log('Images built successfully.');
      return;
    } catch (error) {
      this.error(`Error building images: ${error}`);
      throw error;
    }
  }

  /** @inheritdoc */
  async start(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = await this.writeComposeFile(stack, projectPath);
    try {
      this.log('Starting stack using podman-compose...');
      await runCommand('podman-compose', ['-f', composeFilePath, 'up', '-d'], {
        cwd: projectPath,
      });
      this.log('Stack started successfully.');
    } catch (error) {
      this.error(`Error starting stack: ${error}`);
      throw error;
    }
  }

  /** @inheritdoc */
  async stop(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = this.getComposeFilePath(projectPath, stack.name);
    if (!existsSync(composeFilePath)) {
      this.warn(
        `Compose file ${composeFilePath} not found. Cannot stop stack without config.`
      );
      return;
    }
    try {
      this.log('Stopping stack using podman-compose...');
      await runCommand('podman-compose', ['-f', composeFilePath, 'down'], {
        cwd: projectPath,
      });
      this.log('Stack stopped successfully.');
    } catch (error) {
      this.error(`Error stopping stack: ${error}`);
      throw error;
    }
  }

  /** @inheritdoc */
  async destroy(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = this.getComposeFilePath(projectPath, stack.name);
    if (!existsSync(composeFilePath)) {
      this.warn(
        `Compose file ${composeFilePath} not found. Cannot destroy stack without config.`
      );
      return;
    }
    try {
      this.log(
        'Destroying stack using podman-compose (including volumes)...'
      );
      await runCommand('podman-compose', ['-f', composeFilePath, 'down', '-v'], {
        cwd: projectPath,
      });
      this.log('Stack destroyed successfully.');
    } catch (error) {
      this.error(`Error destroying stack: ${error}`);
      throw error;
    }
  }

  // --- Helper Methods ---

  private log(message: string) {
    console.log(`[PodmanComposeBuilder] ${message}`);
  }
  private error(message: string) {
    console.error(`[PodmanComposeBuilder] ERROR: ${message}`);
  }
  private warn(message: string) {
    console.warn(`[PodmanComposeBuilder] WARN: ${message}`);
  }
} 