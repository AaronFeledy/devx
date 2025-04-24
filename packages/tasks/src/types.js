import { z } from 'zod';
/**
 * Zod schema for Command validation
 */
export const CommandSchema = z.object({
  exec: z.string(),
  env: z.enum(['bash', 'powershell']).optional(),
  container: z.string().optional(),
});
/**
 * Zod schema for Task validation
 */
export const TaskSchema = z.object({
  name: z.string(),
  steps: z.array(z.union([z.function(), CommandSchema])),
  rollback: z.array(z.union([z.function(), CommandSchema])).optional(),
});
