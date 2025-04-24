import { describe, it, expect, beforeEach, mock } from 'bun:test';
import { TaskExecutor } from '../src/executor';
import { Task, Command, TaskSchema } from '../src/types';
import { exec } from 'node:child_process';

// Mock child_process.exec
const mockExec = mock(
  (
    cmd: string,
    callback: (error: Error | null, stdout: string, stderr: string) => void
  ) => {
    if (cmd.includes('failing-command')) {
      callback(
        new Error(
          'Command failed: bash -c "failing-command"\nbash: line 1: failing-command: command not found\n'
        ),
        '',
        ''
      );
    } else {
      callback(null, 'success', '');
    }
  }
);
mock.module('node:child_process', () => ({
  exec: mockExec,
}));

describe('TaskExecutor', () => {
  let taskExecutor: TaskExecutor;

  beforeEach(() => {
    taskExecutor = new TaskExecutor();
    mockExec.mockReset();
  });

  describe('execute', () => {
    it('should execute a simple command task successfully', async () => {
      const task: Task = {
        name: 'test-task',
        steps: [
          {
            exec: 'echo "hello"',
          },
        ],
      };

      const result = await taskExecutor.execute(task);

      expect(result.success).toBe(true);
      expect(result.duration).toBeGreaterThan(0);
    });

    it('should execute a command in a container', async () => {
      const task: Task = {
        name: 'container-task',
        steps: [
          {
            exec: 'echo "hello"',
            container: 'test-container',
          },
        ],
      };

      const result = await taskExecutor.execute(task);

      expect(result.success).toBe(false);
    });

    it('should execute a powershell command', async () => {
      const task: Task = {
        name: 'powershell-task',
        steps: [
          {
            exec: 'Get-Process',
            shell: 'powershell',
          },
        ],
      };

      const result = await taskExecutor.execute(task);

      expect(result.success).toBe(false);
    });

    it('should execute multiple steps in order', async () => {
      const steps = [];
      const task: Task = {
        name: 'multi-step-task',
        steps: [
          async () => steps.push(1),
          async () => steps.push(2),
          async () => steps.push(3),
        ],
      };

      const result = await taskExecutor.execute(task);

      expect(result.success).toBe(true);
      expect(steps).toEqual([1, 2, 3]);
    });

    it('should handle command execution errors and perform rollback', async () => {
      const task: Task = {
        name: 'failing-task',
        steps: [
          {
            exec: 'failing-command',
          },
        ],
        rollback: [async () => {}, async () => {}],
      };

      const result = await taskExecutor.execute(task);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
      expect(result.error?.message).toBe(
        'Command failed: bash -c "failing-command"\nbash: line 1: failing-command: command not found\n'
      );
    });

    it('should continue rollback even if rollback steps fail', async () => {
      const task: Task = {
        name: 'failing-rollback-task',
        steps: [
          {
            exec: 'failing-command',
          },
        ],
        rollback: [
          async () => {
            throw new Error('Rollback failed');
          },
          async () => {},
        ],
      };

      const result = await taskExecutor.execute(task);

      expect(result.success).toBe(false);
      expect(result.error?.message).toBe(
        'Command failed: bash -c "failing-command"\nbash: line 1: failing-command: command not found\n'
      );
    });

    it('should validate task schema', async () => {
      const invalidTask = {
        // Missing required 'name' field
        steps: [],
      };

      // @ts-expect-error Testing invalid task
      const result = await taskExecutor.execute(invalidTask);

      expect(result.success).toBe(false);
      expect(result.error).toBeDefined();
    });
  });
});
