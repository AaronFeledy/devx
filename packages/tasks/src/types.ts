import { z } from 'zod';

/**
 * Environment type for command execution
 */
export type Environment = 'bash' | 'powershell';

/**
 * Command interface for executing commands either on host or in containers
 */
export interface Command {
  /** The command to execute */
  exec: string;
  /** The environment to execute the command in */
  env?: Environment;
  /** Optional container name to execute the command in */
  container?: string;
}

/**
 * Task step can be either a function or a command
 */
export type TaskStep = (() => Promise<void>) | Command;

/**
 * Task interface defining a sequence of steps to execute
 */
export interface Task {
  /** Name of the task */
  name: string;
  /** Array of steps to execute */
  steps: TaskStep[];
  /** Optional rollback steps if task fails */
  rollback?: TaskStep[];
}

/**
 * Task execution result
 */
export interface TaskResult {
  /** Whether the task completed successfully */
  success: boolean;
  /** Error if the task failed */
  error?: Error;
  /** Duration of task execution in milliseconds */
  duration: number;
}

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