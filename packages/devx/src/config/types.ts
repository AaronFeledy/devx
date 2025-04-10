import { z } from 'zod';

/**
 * Zod schema for the global DevX configuration (`~/.devx/config.json`).
 */
export const GlobalConfigSchema = z.object({
  /**
   * The name of the default builder plugin to use if not specified in the stack configuration.
   * Defaults to 'podman-compose' if not set.
   */
  defaultBuilder: z.string().optional().default('podman-compose'),

  /**
   * The name of the default engine plugin to use if not specified in the stack configuration.
   * Defaults to 'podman' if not set.
   */
  defaultEngine: z.string().optional().default('podman'),

  // Add other global settings as needed, e.g.:
  // podmanRoot: z.string().optional().describe('Custom root directory for Podman storage'),
  // logLevel: z.enum(['debug', 'info', 'warn', 'error']).optional().default('info'),
});

/**
 * Inferred TypeScript type from the GlobalConfigSchema.
 */
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
