import { TaskSchema } from './types';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
const execAsync = promisify(exec);
/**
 * Executes a command either on the host or in a container
 * @param command The command to execute
 * @returns Promise that resolves when the command completes
 */
async function executeCommand(command) {
  const { exec: cmd, env = 'bash', container } = command;
  if (container) {
    // Execute in container
    const containerCmd = `podman exec ${container} ${env} -c "${cmd}"`;
    await execAsync(containerCmd);
  } else {
    // Execute on host
    const hostCmd =
      env === 'bash' ? `bash -c "${cmd}"` : `powershell -Command "${cmd}"`;
    await execAsync(hostCmd);
  }
}
/**
 * Executes a task step (either a function or command)
 * @param step The step to execute
 * @returns Promise that resolves when the step completes
 */
async function executeStep(step) {
  if (typeof step === 'function') {
    await step();
  } else {
    await executeCommand(step);
  }
}
/**
 * TaskExecutor class for managing task execution with rollback support
 */
export class TaskExecutor {
  /**
   * Executes a task with rollback support
   * @param task The task to execute
   * @returns Promise that resolves with the task result
   */
  async execute(task) {
    const startTime = Date.now();
    const completedSteps = [];
    try {
      // Validate task
      TaskSchema.parse(task);
      // Execute each step
      for (const step of task.steps) {
        await executeStep(step);
        completedSteps.push(step);
      }
      return {
        success: true,
        duration: Date.now() - startTime,
      };
    } catch (error) {
      // Execute rollback steps in reverse order
      if (task.rollback) {
        for (const step of [...task.rollback].reverse()) {
          try {
            await executeStep(step);
          } catch (rollbackError) {
            console.error('Rollback step failed:', rollbackError);
          }
        }
      }
      return {
        success: false,
        error: error instanceof Error ? error : new Error(String(error)),
        duration: Date.now() - startTime,
      };
    }
  }
}
