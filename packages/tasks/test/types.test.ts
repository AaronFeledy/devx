import { describe, it, expect } from 'bun:test';
import { CommandSchema, TaskSchema } from '../src/types';

describe('CommandSchema', () => {
  it('should validate a valid command', () => {
    const validCommand = {
      exec: 'echo "hello"',
      env: 'bash' as const,
      container: 'test-container',
    };

    const result = CommandSchema.safeParse(validCommand);
    expect(result.success).toBe(true);
  });

  it('should validate a command with only required fields', () => {
    const minimalCommand = {
      exec: 'echo "hello"',
    };

    const result = CommandSchema.safeParse(minimalCommand);
    expect(result.success).toBe(true);
  });

  it('should reject invalid environment', () => {
    const invalidCommand = {
      exec: 'echo "hello"',
      env: 'invalid' as any,
    };

    const result = CommandSchema.safeParse(invalidCommand);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('env');
    }
  });

  it('should reject missing exec command', () => {
    const invalidCommand = {
      env: 'bash' as const,
    };

    const result = CommandSchema.safeParse(invalidCommand);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('exec');
    }
  });
});

describe('TaskSchema', () => {
  it('should validate a valid task', () => {
    const validTask = {
      name: 'test-task',
      steps: [
        {
          exec: 'echo "step 1"',
        },
        async () => {},
      ],
      rollback: [
        {
          exec: 'echo "rollback"',
        },
      ],
    };

    const result = TaskSchema.safeParse(validTask);
    expect(result.success).toBe(true);
  });

  it('should validate a task with only required fields', () => {
    const minimalTask = {
      name: 'minimal-task',
      steps: [],
    };

    const result = TaskSchema.safeParse(minimalTask);
    expect(result.success).toBe(true);
  });

  it('should reject missing name', () => {
    const invalidTask = {
      steps: [],
    };

    const result = TaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('name');
    }
  });

  it('should reject invalid step types', () => {
    const invalidTask = {
      name: 'invalid-task',
      steps: ['not a function or command' as any],
    };

    const result = TaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('steps');
    }
  });

  it('should reject invalid rollback steps', () => {
    const invalidTask = {
      name: 'invalid-rollback-task',
      steps: [],
      rollback: ['not a function or command' as any],
    };

    const result = TaskSchema.safeParse(invalidTask);
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0].path).toContain('rollback');
    }
  });
});
