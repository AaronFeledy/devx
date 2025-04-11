import { join } from 'path';
import { homedir } from 'os';
import { existsSync, readdirSync, readFileSync } from 'fs';
import { z } from 'zod';
import { StackConfig, StackConfigSchema } from '@devx/stack';
import { EnginePlugin, BuilderPlugin } from '@devx/common';

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
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      return;
    }

    const stackFiles = readdirSync(GLOBAL_STACKS_DIR).filter(
      (file) => file.endsWith('.yml') || file.endsWith('.yaml')
    );

    for (const file of stackFiles) {
      try {
        const configPath = join(GLOBAL_STACKS_DIR, file);
        const config = GlobalStackConfig.parse({
          name: file.replace(/\.(yml|yaml)$/, ''),
          config: readFileSync(configPath, 'utf-8'),
        });
        this.stacks.set(config.name, config);
      } catch (error) {
        console.error(`Failed to load global stack ${file}:`, error);
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
        await this.builder.build(stack.config);
        await this.builder.start(stack.config);
      } catch (error) {
        console.error(`Failed to start global stack ${stack.name}:`, error);
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
        await this.builder.stop(stack.config);
      } catch (error) {
        console.error(`Failed to stop global stack ${stack.name}:`, error);
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
        const stackStatus = await this.builder.status(stack.config);
        status[name] = stackStatus;
      } catch (error) {
        status[name] = 'error';
      }
    }

    return status;
  }
}
