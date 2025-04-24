import { z } from 'zod';
import { StackStatus } from '@devx/common'; // Import from common
/** Placeholder: Represents the build status of a stack. */
export var StackBuildStatus;
(function (StackBuildStatus) {
  StackBuildStatus['Unknown'] = 'unknown';
  StackBuildStatus['NotBuilt'] = 'not_built';
  StackBuildStatus['Building'] = 'building';
  StackBuildStatus['Built'] = 'built';
  StackBuildStatus['Error'] = 'error';
})(StackBuildStatus || (StackBuildStatus = {}));
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
/** Placeholder: Zod schema for the overall DevX state file */
// Use a record where keys are stack names
export const DevxStateSchema = z.record(z.string(), StackStateSchema);
