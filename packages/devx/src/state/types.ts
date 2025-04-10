import { z } from 'zod';
import { StackStatus } from '@devx/common'; // Import from common

/** Placeholder: Represents the build status of a stack. */
export enum StackBuildStatus {
  Unknown = 'unknown',
  NotBuilt = 'not_built',
  Building = 'building',
  Built = 'built',
  Error = 'error',
}

/** Placeholder: Zod schema for StackState */
export const StackStateSchema = z.object({
  name: z.string(),
  configPath: z.string(),
  buildStatus: z.nativeEnum(StackBuildStatus),
  runtimeStatus: z.nativeEnum(StackStatus), // Use enum imported from engine
  lastBuiltAt: z.date().nullable(),
  lastStartedAt: z.date().nullable(),
  manifestPath: z.string().nullable(),
  lastError: z.string().nullable(),
  // Add other relevant state fields if needed
});

/** Placeholder: Represents the state of a single managed stack. */
export type StackState = z.infer<typeof StackStateSchema>;

/** Placeholder: Zod schema for the overall DevX state file */
// Use a record where keys are stack names
export const DevxStateSchema = z.record(z.string(), StackStateSchema);

/** Placeholder: Represents the overall state managed by Devx. */
export type DevxState = z.infer<typeof DevxStateSchema>;
