import { z } from 'zod';
/**
 * Zod schema for the global DevX configuration (`~/.devx/config.json`).
 */
export declare const GlobalConfigSchema: z.ZodObject<
  {
    /**
     * The name of the default builder plugin to use if not specified in the stack configuration.
     * Defaults to 'podman-compose' if not set.
     */
    defaultBuilder: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    /**
     * The name of the default engine plugin to use if not specified in the stack configuration.
     * Defaults to 'podman' if not set.
     */
    defaultEngine: z.ZodDefault<z.ZodOptional<z.ZodString>>;
  },
  'strip',
  z.ZodTypeAny,
  {
    defaultBuilder?: string;
    defaultEngine?: string;
  },
  {
    defaultBuilder?: string;
    defaultEngine?: string;
  }
>;
/**
 * Inferred TypeScript type from the GlobalConfigSchema.
 */
export type GlobalConfig = z.infer<typeof GlobalConfigSchema>;
