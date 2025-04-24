import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { z } from 'zod';
import { StackConfigSchema } from '@devx/stack';
import { EnginePlugin, BuilderPlugin } from '@devx/common';
import YAML from 'yaml';

const GLOBAL_STACKS_DIR = join(homedir(), '.devx', 'global-stacks');

/**
 * Global stack configuration schema
 */
export const GlobalStackConfig = z.object({
  name: z.string(),
  enabled: z.boolean().default(true),
  priority: z.number().default(0),
  config: StackConfigSchema,
});

export type GlobalStackConfig = z.infer<typeof GlobalStackConfig>;

/**
 * Manages global stacks that are automatically started with any DevX stack
 */
export class GlobalStackManager {
  private stacks: Map<string, GlobalStackConfig> = new Map();
  private engine: EnginePlugin;
  private builder: BuilderPlugin;

  constructor(engine: EnginePlugin, builder: BuilderPlugin) {
    this.engine = engine;
    this.builder = builder;
    this.loadGlobalStacks();
  }

  /**
   * Load all global stacks from the configuration directory
   */
  private loadGlobalStacks(): void {
    this.stacks.clear(); // Clear existing stacks before loading

    if (!existsSync(GLOBAL_STACKS_DIR)) {
      console.warn(`Global stacks directory not found: ${GLOBAL_STACKS_DIR}`);
      return;
    }

    let stackFiles: string[] = [];
    try {
      stackFiles = readdirSync(GLOBAL_STACKS_DIR).filter(
        (file) => file.endsWith('.yml') || file.endsWith('.yaml')
      );
    } catch (error) {
      console.error(
        `Failed to read global stacks directory ${GLOBAL_STACKS_DIR}:`,
        error
      );
      return;
    }

    for (const file of stackFiles) {
      const configPath = join(GLOBAL_STACKS_DIR, file);
      try {
        const fileContent = readFileSync(configPath, 'utf-8');
        const parsedYaml = YAML.parse(fileContent);
        const stackName = file.replace(/\.(yml|yaml)$/, '');

        const result = GlobalStackConfig.safeParse({
          name: stackName,
          ...parsedYaml,
        });

        if (result.success) {
          this.stacks.set(result.data.name, result.data);
        } else {
          console.error(
            `Invalid configuration in global stack file ${file}:`,
            result.error.flatten()
          );
        }
      } catch (error) {
        console.error(
          `Failed to load or parse global stack file ${file}:`,
          error
        );
      }
    }
  }

  /**
   * Start all enabled global stacks
   */
  public async startGlobalStacks(): Promise<void> {
    const enabledStacks = Array.from(this.stacks.values())
      .filter((stack) => stack.enabled)
      .sort((a, b) => b.priority - a.priority);

    for (const stack of enabledStacks) {
      try {
        const projectPath = join(GLOBAL_STACKS_DIR, stack.name);
        await this.builder.build(stack.config, projectPath);
        await this.builder.start(stack.config, projectPath);
      } catch (error) {
        console.error(
          `Failed to start global stack ${stack.name}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * Stop all global stacks
   */
  public async stopGlobalStacks(): Promise<void> {
    const stacks = Array.from(this.stacks.values()).sort(
      (a, b) => a.priority - b.priority
    );

    for (const stack of stacks) {
      try {
        const projectPath = join(GLOBAL_STACKS_DIR, stack.name);
        await this.builder.stop(stack.config, projectPath);
      } catch (error) {
        console.error(
          `Failed to stop global stack ${stack.name}:`,
          error instanceof Error ? error.message : String(error)
        );
      }
    }
  }

  /**
   * Get the status of all global stacks
   */
  public async getStatus(): Promise<Record<string, string>> {
    const status: Record<string, string> = {};

    for (const [name, stack] of this.stacks) {
      try {
        const projectPath = join(GLOBAL_STACKS_DIR, name);
        const stackStatus = await this.builder.generateConfig(
          stack.config,
          projectPath
        );
        status[name] = stackStatus;
      } catch (error) {
        status[name] =
          `error: ${error instanceof Error ? error.message : String(error)}`;
      }
    }

    return status;
  }
}
