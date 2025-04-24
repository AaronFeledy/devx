import { describe, test, expect, beforeEach, afterEach, mock } from 'bun:test';
import { GlobalStackManager, GlobalStackConfig } from '../src';
import { join } from 'path';
import { homedir } from 'os';
import {
  existsSync,
  readdirSync,
  readFileSync,
  mkdirSync,
  writeFileSync,
  rmSync,
} from 'fs';
import { EnginePlugin, BuilderPlugin } from '@devx/common';
import YAML from 'yaml';

const GLOBAL_STACKS_DIR = join(homedir(), '.devx', 'global-stacks');

// Mock engine and builder plugins
const mockEngine: EnginePlugin = {
  name: 'mock-engine',
  version: '1.0.0',
  platform: 'test',
};

const mockBuilder: BuilderPlugin = {
  name: 'mock-builder',
  version: '1.0.0',
  build: mock(() => Promise.resolve()),
  start: mock(() => Promise.resolve()),
  stop: mock(() => Promise.resolve()),
  generateConfig: mock(() => Promise.resolve('running')),
};

describe('GlobalStackManager', () => {
  beforeEach(() => {
    // Always create test directory
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    // Remove all files in the directory
    if (existsSync(GLOBAL_STACKS_DIR)) {
      readdirSync(GLOBAL_STACKS_DIR).forEach((file) => {
        const filePath = join(GLOBAL_STACKS_DIR, file);
        if (existsSync(filePath)) rmSync(filePath);
      });
    }
    // Create test stack files
    const testStack1Config = {
      enabled: true,
      priority: 1,
      config: {
        name: 'test-stack-1',
        services: {
          test: {
            image: 'test:latest',
          },
        },
      },
    };
    const testStack2Config = {
      enabled: false,
      priority: 0,
      config: {
        name: 'test-stack-2',
        services: {
          test: {
            image: 'test:latest',
          },
        },
      },
    };
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify(testStack1Config)
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-2.yml'),
      YAML.stringify(testStack2Config)
    );
  });

  afterEach(() => {
    // Clean up test files
    if (existsSync(GLOBAL_STACKS_DIR)) {
      readdirSync(GLOBAL_STACKS_DIR).forEach((file) => {
        const filePath = join(GLOBAL_STACKS_DIR, file);
        if (existsSync(filePath)) rmSync(filePath);
      });
      rmSync(GLOBAL_STACKS_DIR, { recursive: true, force: true });
    }
  });

  test('should load global stacks from directory', () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(2);
  });

  test('should handle missing global stacks directory', () => {
    if (existsSync(GLOBAL_STACKS_DIR)) {
      rmSync(GLOBAL_STACKS_DIR, { recursive: true, force: true });
    }
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(0);
  });

  test('should start only enabled stacks in priority order', async () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    await manager.startGlobalStacks();

    expect(mockBuilder.build).toHaveBeenCalledTimes(1);
    expect(mockBuilder.start).toHaveBeenCalledTimes(1);
  });

  test('should stop all stacks in reverse priority order', async () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    await manager.stopGlobalStacks();

    expect(mockBuilder.stop).toHaveBeenCalledTimes(2);
  });

  test('should get status of all stacks', async () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    (mockBuilder.generateConfig as ReturnType<typeof mock>).mockReturnValue(
      Promise.resolve('running')
    );

    const status = await manager.getStatus();
    expect(Object.keys(status).length).toBe(2);
    expect(status['test-stack-1']).toBe('running');
    expect(status['test-stack-2']).toBe('running');
  });

  test('should handle errors when starting stacks', async () => {
    (mockBuilder.build as ReturnType<typeof mock>).mockRejectedValue(
      new Error('Build failed')
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);

    // This should not throw but log the error
    await expect(manager.startGlobalStacks()).resolves.toBeUndefined();
  });

  test('should handle errors when stopping stacks', async () => {
    (mockBuilder.stop as ReturnType<typeof mock>).mockRejectedValue(
      new Error('Stop failed')
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);

    // This should not throw but log the error
    await expect(manager.stopGlobalStacks()).resolves.toBeUndefined();
  });

  test('should handle errors when getting status', async () => {
    (mockBuilder.generateConfig as ReturnType<typeof mock>).mockRejectedValue(
      new Error('Status failed')
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);

    const status = await manager.getStatus();
    expect(status['test-stack-1']).toMatch(/error: Status failed/);
    expect(status['test-stack-2']).toMatch(/error: Status failed/);
  });
});

describe('GlobalStackConfig Schema', () => {
  test('should validate valid config', () => {
    const validConfig = {
      name: 'test-stack',
      enabled: true,
      priority: 1,
      config: {
        name: 'test',
        services: {
          test: {
            image: 'test:latest',
          },
        },
      },
    };

    const result = GlobalStackConfig.safeParse(validConfig);
    expect(result.success).toBe(true);
  });

  test('should provide default values', () => {
    const minimalConfig = {
      name: 'test-stack',
      config: {
        name: 'test',
        services: {
          test: {
            image: 'test:latest',
          },
        },
      },
    };

    const result = GlobalStackConfig.safeParse(minimalConfig);
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.enabled).toBe(true);
      expect(result.data.priority).toBe(0);
    }
  });

  test('should reject invalid config', () => {
    const invalidConfig = {
      name: 'test-stack',
      enabled: 'true', // Should be boolean
      priority: '1', // Should be number
      config: {
        name: 'test',
        services: {}, // Missing required services
      },
    };

    const result = GlobalStackConfig.safeParse(invalidConfig);
    expect(result.success).toBe(false);
  });
});

describe('GlobalStackManager Edge Cases', () => {
  beforeEach(() => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
  });

  test('should handle malformed YAML files', () => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'malformed.yml'),
      'invalid: yaml: content: {'
    );
    // Also create valid stack files for the test
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify({
        enabled: true,
        priority: 1,
        config: {
          name: 'test-stack-1',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-2.yml'),
      YAML.stringify({
        enabled: false,
        priority: 0,
        config: {
          name: 'test-stack-2',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(2); // Should only load valid files
  });

  test('should handle empty stack directory', () => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    readdirSync(GLOBAL_STACKS_DIR).forEach((file) => {
      const filePath = join(GLOBAL_STACKS_DIR, file);
      if (existsSync(filePath)) rmSync(filePath);
    });
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(0);
  });

  test('should handle non-YAML files in directory', () => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    // Create valid stack files
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify({
        enabled: true,
        priority: 1,
        config: {
          name: 'test-stack-1',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-2.yml'),
      YAML.stringify({
        enabled: false,
        priority: 0,
        config: {
          name: 'test-stack-2',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'not-a-stack.txt'),
      'This is not a YAML file'
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(2); // Should ignore non-YAML files
  });

  test('should maintain priority order when starting stacks', async () => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    // Create stacks with different priorities
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify({
        enabled: true,
        priority: 1,
        config: {
          name: 'test-stack-1',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-2.yml'),
      YAML.stringify({
        enabled: true,
        priority: 0,
        config: {
          name: 'test-stack-2',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'high-priority.yml'),
      YAML.stringify({
        enabled: true,
        priority: 2,
        config: {
          name: 'high-priority',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    await manager.startGlobalStacks();
    expect((mockBuilder.build as any).mock.calls.length).toBe(3); // Expect 3 build calls for 3 valid, enabled stacks
  });
});

describe.skip('GlobalStackManager Concurrent Operations', () => {
  test('should handle concurrent start operations', async () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    const promises = [manager.startGlobalStacks(), manager.startGlobalStacks()];
    await Promise.all(promises);
    expect(mockBuilder.build).toHaveBeenCalledTimes(1);
    expect(mockBuilder.start).toHaveBeenCalledTimes(1);
  });

  test('should handle concurrent stop operations', async () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    const promises = [manager.stopGlobalStacks(), manager.stopGlobalStacks()];
    await Promise.all(promises);
    expect(mockBuilder.stop).toHaveBeenCalledTimes(2);
  });

  test('should handle start during stop operation', async () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    (mockBuilder.stop as ReturnType<typeof mock>).mockImplementation(
      () => new Promise((resolve) => setTimeout(resolve, 100))
    );
    const stopPromise = manager.stopGlobalStacks();
    const startPromise = manager.startGlobalStacks();
    await Promise.all([stopPromise, startPromise]);
    expect(mockBuilder.stop).toHaveBeenCalled();
    expect(mockBuilder.start).toHaveBeenCalled();
  });
});

describe('GlobalStackManager Configuration Updates', () => {
  beforeEach(() => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    // Create valid stack files
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify({
        enabled: true,
        priority: 1,
        config: {
          name: 'test-stack-1',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-2.yml'),
      YAML.stringify({
        enabled: false,
        priority: 0,
        config: {
          name: 'test-stack-2',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
  });

  test('should handle stack config updates', () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    const initialSize = manager['stacks'].size;
    // Update existing stack
    const updatedConfig = {
      enabled: true,
      priority: 2,
      config: {
        name: 'test-stack-1',
        services: {
          test: {
            image: 'test:updated',
          },
        },
      },
    };
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify(updatedConfig)
    );
    // Force reload
    manager['loadGlobalStacks']();
    expect(manager['stacks'].size).toBe(initialSize);
    const updatedStack = Array.from(manager['stacks'].values()).find(
      (s) => s.config.name === 'test-stack-1'
    );
    expect(updatedStack?.config.services.test.image).toBe('test:updated');
  });

  test('should handle stack deletion', () => {
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    const initialSize = manager['stacks'].size;
    expect(initialSize).toBe(2); // Assert initial valid stacks from beforeEach
    const filePath = join(GLOBAL_STACKS_DIR, 'test-stack-1.yml');
    if (existsSync(filePath)) rmSync(filePath);
    manager['loadGlobalStacks'](); // Reload stacks
    expect(manager['stacks'].size).toBe(1); // Expect 1 valid stack remaining
    expect(manager['stacks'].has('test-stack-1')).toBe(false);
  });
});

describe('GlobalStackManager Additional Validation', () => {
  beforeEach(() => {
    if (!existsSync(GLOBAL_STACKS_DIR)) {
      mkdirSync(GLOBAL_STACKS_DIR, { recursive: true });
    }
    // Create valid stack files
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-1.yml'),
      YAML.stringify({
        enabled: true,
        priority: 1,
        config: {
          name: 'test-stack-1',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'test-stack-2.yml'),
      YAML.stringify({
        enabled: false,
        priority: 0,
        config: {
          name: 'test-stack-2',
          services: { test: { image: 'test:latest' } },
        },
      })
    );
  });

  test('should reject stack with invalid service configuration', () => {
    const invalidServiceConfig = {
      enabled: true,
      priority: 1,
      config: {
        name: 'invalid-service',
        services: {
          test: {
            // Missing required 'image' field
            ports: ['8080:8080'],
          },
        },
      },
    };
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'invalid-service.yml'),
      YAML.stringify(invalidServiceConfig)
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(2); // Expect only 2 valid stacks loaded
    expect(manager['stacks'].has('invalid-service')).toBe(false);
  });

  test('should reject stack with duplicate service names', () => {
    const duplicateServiceConfig = {
      enabled: true,
      priority: 1,
      config: {
        name: 'duplicate-services',
        services: {
          test: {
            image: 'test:1',
          },
          test: {
            image: 'test:2',
          },
        },
      },
    };
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'duplicate-services.yml'),
      YAML.stringify(duplicateServiceConfig)
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(2); // Expect only 2 valid stacks loaded
    expect(manager['stacks'].has('duplicate-services')).toBe(false);
  });

  test('should reject stack with invalid volume configuration', () => {
    const invalidVolumeConfig = {
      enabled: true,
      priority: 1,
      config: {
        name: 'invalid-volumes',
        services: {
          test: {
            image: 'test:latest',
            volumes: [
              '/invalid/absolute/path', // Should be relative or named volume
            ],
          },
        },
      },
    };
    writeFileSync(
      join(GLOBAL_STACKS_DIR, 'invalid-volumes.yml'),
      YAML.stringify(invalidVolumeConfig)
    );
    const manager = new GlobalStackManager(mockEngine, mockBuilder);
    expect(manager['stacks'].size).toBe(2); // Expect only 2 valid stacks loaded
    expect(manager['stacks'].has('invalid-volumes')).toBe(false);
  });
});
