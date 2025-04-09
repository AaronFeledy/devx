import { StackConfig } from '@devx/stack';
import * as yaml from 'yaml';
import { BuilderPlugin } from '../types';
import { runCommand } from '@devx/cli';
import * as path from 'node:path';
import * as fs from 'node:fs/promises';

/**
 * Implements the BuilderPlugin interface for the podman-compose orchestrator.
 *
 * This plugin translates the abstract `StackConfig` into a `podman-compose.yaml` file
 * and uses the `podman-compose` command-line tool to manage the stack lifecycle.
 */
export class PodmanComposeBuilderPlugin implements BuilderPlugin {
  /** @inheritdoc */
  name = 'podman-compose';

  /**
   * Generates the full path for the podman-compose configuration file.
   * The file is placed inside a `.devx` directory within the project path.
   *
   * @param projectPath - The root path of the project.
   * @param stackName - The name of the stack.
   * @returns The absolute path to the generated compose file.
   * @private
   */
  private async getComposeFilePath(projectPath: string, stackName: string): Promise<string> {
    // Consider placing generated files in a .devx folder within the project
    const devxDir = path.join(projectPath, '.devx');
    await fs.mkdir(devxDir, { recursive: true });
    return path.join(devxDir, `podman-compose.${stackName}.yaml`);
  }

  /** @inheritdoc */
  async generateConfig(stack: StackConfig): Promise<string> {
    // Basic transformation - might need refinement based on StackConfig structure
    const composeConfig = {
      version: stack.version || '3.8', // Default or from stack config
      services: stack.services,
      networks: stack.networks,
      volumes: stack.volumes,
    };
    return yaml.stringify(composeConfig);
  }

  /**
   * Generates the podman-compose configuration and writes it to the designated file path.
   *
   * @param stack - The stack configuration.
   * @param projectPath - The project root path.
   * @returns The path to the written compose file.
   * @private
   */
  private async writeComposeFile(stack: StackConfig, projectPath: string): Promise<string> {
    const configContent = await this.generateConfig(stack);
    const composeFilePath = await this.getComposeFilePath(projectPath, stack.name);
    await fs.writeFile(composeFilePath, configContent, 'utf-8');
    console.log(`Generated podman-compose file: ${composeFilePath}`);
    return composeFilePath;
  }

  /** @inheritdoc */
  async build(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = await this.writeComposeFile(stack, projectPath);
    console.log(`Running build for stack "${stack.name}" using ${composeFilePath}...`);
    try {
      await runCommand(`podman-compose -f "${composeFilePath}" build`, projectPath);
      console.log(`Stack "${stack.name}" build completed.`);
    } catch (error) {
      console.error(`Error building stack "${stack.name}":`, error);
      throw error; // Re-throw the error to signal failure
    }
  }

  /** @inheritdoc */
  async start(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = await this.writeComposeFile(stack, projectPath); // Ensure config exists
    console.log(`Starting stack "${stack.name}" using ${composeFilePath}...`);
    try {
      // Use -d to run in detached mode, --build to ensure images are up-to-date.
      // Consider --remove-orphans to clean up containers not defined in the current config.
      await runCommand(`podman-compose -f "${composeFilePath}" up -d --build --remove-orphans`, projectPath);
      console.log(`Stack "${stack.name}" started successfully.`);
    } catch (error) {
      console.error(`Error starting stack "${stack.name}":`, error);
      throw error;
    }
  }

  /** @inheritdoc */
  async stop(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = await this.getComposeFilePath(projectPath, stack.name);
    console.log(`Attempting to stop stack "${stack.name}" using ${composeFilePath}...`);
    try {
      // Check if the compose file exists before trying to run `down`.
      await fs.access(composeFilePath);
      await runCommand(`podman-compose -f "${composeFilePath}" down`, projectPath);
      console.log(`Stack "${stack.name}" stopped.`);
    } catch (error: any) {
      if (error.code === 'ENOENT') {
        // If the file doesn't exist, the stack might have been already stopped/destroyed or wasn't managed correctly.
        console.warn(`Compose file not found: ${composeFilePath}. Stack "${stack.name}" might already be stopped or was not started by devx.`);
      } else {
        console.error(`Error stopping stack "${stack.name}":`, error);
        throw error; // Re-throw other errors
      }
    }
  }

  /** @inheritdoc */
  async destroy(stack: StackConfig, projectPath: string): Promise<void> {
    const composeFilePath = await this.getComposeFilePath(projectPath, stack.name);
    console.log(`Attempting to destroy stack "${stack.name}" using ${composeFilePath}...`);
    try {
      await fs.access(composeFilePath);
      // Use --volumes to ensure associated volumes are also removed.
      await runCommand(`podman-compose -f "${composeFilePath}" down --volumes`, projectPath);
      console.log(`Stack "${stack.name}" containers and networks removed.`);

      // Clean up the generated compose file.
      try {
        await fs.unlink(composeFilePath);
        console.log(`Removed compose file: ${composeFilePath}`);
      } catch (unlinkError) {
        console.warn(`Could not remove compose file ${composeFilePath}:`, unlinkError);
      }
      console.log(`Stack "${stack.name}" destroyed successfully.`);

    } catch (error: any) {
      if (error.code === 'ENOENT') {
        console.warn(`Compose file not found: ${composeFilePath}. Stack "${stack.name}" might already be destroyed or was not started by devx.`);
      } else {
        console.error(`Error destroying stack "${stack.name}":`, error);
        throw error;
      }
    }
  }
} 