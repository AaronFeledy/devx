import { describe, it, expect, beforeEach, afterEach, mock } from 'bun:test';
import {
  getStackState,
  updateStackState,
  removeStackState,
  getInitialStackState,
  StackBuildStatus,
  saveDevxState,
} from '../src/state/index';
import { StackStatus, type StackState } from '@devx/common';
import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { homedir } from 'os';
import { join } from 'path';

// --- Mock Filesystem ---
let mockFsStore: Record<string, string> = {};
const mockReadFile = mock(async (filePath: string) => {
  if (mockFsStore[filePath]) {
    return mockFsStore[filePath];
  }
  const error: NodeJS.ErrnoException = new Error(
    `ENOENT: no such file or directory, open '${filePath}'`
  );
  error.code = 'ENOENT';
  throw error;
});
const mockWriteFile = mock(async (filePath: string, data: string) => {
  mockFsStore[filePath] = data;
});
const mockMkdir = mock(async () => {});
const mockRm = mock(async (filePath: string) => {
  delete mockFsStore[filePath];
});
const mockAccess = mock(async (filePath: string) => {
  if (!mockFsStore[filePath]) {
    const error: NodeJS.ErrnoException = new Error(
      `ENOENT: no such file or directory, access '${filePath}'`
    );
    error.code = 'ENOENT';
    throw error;
  }
});

mock.module('node:fs/promises', () => ({
  readFile: mockReadFile,
  writeFile: mockWriteFile,
  mkdir: mockMkdir,
  rm: mockRm,
  access: mockAccess,
}));
// --- End Mock Filesystem ---

// Keep this for potentially mocking state dir path generation
const TEST_STATE_DIR_BASE = join(homedir(), '.devx');
let currentTestStateDir: string;
let currentTestStateFilePath: string;

describe('State Management', () => {
  beforeEach(async () => {
    // Use a unique path for each test, primarily for state file path generation
    currentTestStateDir = join(
      TEST_STATE_DIR_BASE,
      `state-test-${Date.now()}-${Math.random()}`
    );
    currentTestStateFilePath = join(currentTestStateDir, 'state.json');
    process.env.DEVX_STATE_DIR = currentTestStateDir;

    // Reset mocks
    mockReadFile.mockClear();
    mockWriteFile.mockClear();
    mockMkdir.mockClear();
    mockRm.mockClear();
    mockAccess.mockClear();

    // Reset in-memory filesystem for state file
    mockFsStore = {};

    // Reset mock implementations (needed if mocks are modified in tests)
    mockReadFile.mockImplementation(async (filePath: string) => {
      if (filePath !== currentTestStateFilePath) {
        const error: NodeJS.ErrnoException = new Error(
          `ENOENT (mock): no such file or directory, open '${filePath}'`
        );
        error.code = 'ENOENT';
        throw error;
      }
      if (mockFsStore[filePath]) {
        return mockFsStore[filePath];
      }
      const error: NodeJS.ErrnoException = new Error(
        `ENOENT (mock): no such file or directory, open '${filePath}'`
      );
      error.code = 'ENOENT';
      throw error;
    });
    mockWriteFile.mockImplementation(async (filePath: string, data: string) => {
      if (filePath === currentTestStateFilePath) {
        mockFsStore[filePath] = data;
      } else {
        console.warn(
          `Mocked writeFile called with unexpected path: ${filePath}`
        );
      }
    });
    mockAccess.mockImplementation(async (filePath: string) => {
      if (filePath !== currentTestStateFilePath || !mockFsStore[filePath]) {
        const error: NodeJS.ErrnoException = new Error(
          `ENOENT (mock): no such file or directory, access '${filePath}'`
        );
        error.code = 'ENOENT';
        throw error;
      }
    });
    mockMkdir.mockResolvedValue(undefined);
    mockRm.mockImplementation(async (filePath: string) => {
      if (filePath === currentTestStateFilePath) delete mockFsStore[filePath];
    });
  });

  afterEach(() => {
    delete process.env.DEVX_STATE_DIR;
  });

  describe('getInitialStackState', () => {
    it('should create initial state for a stack', () => {
      const stackConfig = {
        name: 'test-stack',
        builder: { name: 'test-builder' },
        services: {},
      } as StackConfig;
      const configPath = '/test/path/devx.yaml';

      const state = getInitialStackState(stackConfig, configPath);

      expect(state).toEqual({
        name: 'test-stack',
        configPath: '/test/path/devx.yaml',
        buildStatus: StackBuildStatus.NotBuilt,
        runtimeStatus: StackStatus.Unknown,
        lastBuiltAt: expect.any(Date),
        lastStartedAt: expect.any(Date),
        manifestPath: '',
        lastError: null,
        services: {},
      });
    });
  });

  describe('getStackState', () => {
    it('should return undefined for non-existent stack in empty state', async () => {
      const state = await getStackState('non-existent-stack');
      expect(state).toBeUndefined();
      expect(mockReadFile).toHaveBeenCalledWith(currentTestStateFilePath);
    });

    it('should return undefined for non-existent stack in existing state file', async () => {
      const existingState = { 'stack-a': { name: 'stack-a' } };
      mockFsStore[currentTestStateFilePath] = JSON.stringify(existingState);
      const state = await getStackState('non-existent-stack');
      expect(state).toBeUndefined();
    });

    it('should get existing stack state from file', async () => {
      const stackName = 'test-stack';
      const initialState = {
        name: stackName,
        configPath: '/test/path/devx.yaml',
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running,
        lastBuiltAt: new Date(0).toISOString(),
        lastStartedAt: new Date(0).toISOString(),
        manifestPath: '',
        lastError: null,
        services: { web: { status: 'running' } },
      };
      mockFsStore[currentTestStateFilePath] = JSON.stringify({
        [stackName]: initialState,
      });

      const state = await getStackState(stackName);

      expect(state).toEqual(expect.objectContaining(initialState));
      expect(state?.lastBuiltAt).toEqual(new Date(0));
      expect(state?.lastStartedAt).toEqual(new Date(0));
    });
  });

  describe('updateStackState', () => {
    it('should create state file and add stack if file non-existent', async () => {
      const stackName = 'new-stack';
      const update: Partial<StackState> = {
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running,
        configPath: '/new/path.yml',
      };

      await updateStackState(stackName, update);

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const writtenData = JSON.parse(mockFsStore[currentTestStateFilePath]);
      expect(writtenData[stackName]).toBeDefined();
      expect(writtenData[stackName]).toEqual(
        expect.objectContaining({
          name: stackName,
          configPath: '/new/path.yml',
          buildStatus: StackBuildStatus.Built,
          runtimeStatus: StackStatus.Running,
          lastError: null,
        })
      );
      expect(writtenData[stackName].lastBuiltAt).toBeDefined();
      expect(writtenData[stackName].lastStartedAt).toBeDefined();
    });

    it('should update existing stack in existing state file', async () => {
      const stackName = 'existing-stack';
      const initialState = {
        name: stackName,
        configPath: '/test/path/devx.yaml',
        buildStatus: StackBuildStatus.NotBuilt,
        runtimeStatus: StackStatus.Stopped,
        lastBuiltAt: new Date(0).toISOString(),
        lastStartedAt: new Date(0).toISOString(),
        manifestPath: '',
        lastError: null,
        services: {},
      };
      mockFsStore[currentTestStateFilePath] = JSON.stringify({
        [stackName]: initialState,
      });

      const update = {
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running,
        lastError: 'Something went wrong previously',
      };

      await updateStackState(stackName, update);

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const writtenData = JSON.parse(mockFsStore[currentTestStateFilePath]);
      expect(writtenData[stackName]).toEqual(
        expect.objectContaining({
          ...initialState,
          ...update,
        })
      );
    });

    it('should add a new stack to an existing state file', async () => {
      const stackName = 'another-stack';
      const existingState = {
        'stack-a': {
          name: 'stack-a',
          configPath: '/a.yml',
          buildStatus: 'built',
          runtimeStatus: 'stopped',
          lastBuiltAt: new Date(0).toISOString(),
          lastStartedAt: new Date(0).toISOString(),
          manifestPath: '',
          lastError: null,
          services: {},
        },
      };
      mockFsStore[currentTestStateFilePath] = JSON.stringify(existingState);

      const update: Partial<StackState> = {
        buildStatus: StackBuildStatus.NotBuilt,
        runtimeStatus: StackStatus.Unknown,
        configPath: '/another/path.yml',
      };

      await updateStackState(stackName, update);

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const writtenData = JSON.parse(mockFsStore[currentTestStateFilePath]);
      expect(writtenData['stack-a']).toEqual(existingState['stack-a']);
      expect(writtenData[stackName]).toEqual(
        expect.objectContaining({
          name: stackName,
          configPath: '/another/path.yml',
          buildStatus: StackBuildStatus.NotBuilt,
          runtimeStatus: StackStatus.Unknown,
        })
      );
    });

    it('should throw ZodError for invalid update data type', async () => {
      const stackName = 'zod-test-stack';
      const initialState = {
        name: stackName,
        configPath: '/zod/path.yml',
        buildStatus: 'built',
        runtimeStatus: 'stopped',
        lastBuiltAt: new Date().toISOString(),
        lastStartedAt: new Date().toISOString(),
        manifestPath: '',
        lastError: null,
        services: {},
      };
      mockFsStore[currentTestStateFilePath] = JSON.stringify({
        [stackName]: initialState,
      });

      const invalidUpdate = { runtimeStatus: 123 } as any;

      await expect(updateStackState(stackName, invalidUpdate)).rejects.toThrow(
        /zoderror/i
      );
      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should throw Error if creating new stack without configPath', async () => {
      const stackName = 'new-stack-no-path';
      mockFsStore = {};

      const invalidUpdate = { buildStatus: 'built' } as Partial<StackState>;

      await expect(updateStackState(stackName, invalidUpdate)).rejects.toThrow(
        /Cannot create new state.*without providing 'configPath'/
      );
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('removeStackState', () => {
    it('should remove existing stack from state file', async () => {
      const stackToRemove = 'stack-to-remove';
      const otherStack = 'other-stack';
      const initialState = {
        [stackToRemove]: {
          name: stackToRemove,
          configPath: '/rem/path.yml',
          buildStatus: 'built',
          runtimeStatus: 'stopped',
          lastBuiltAt: new Date(0).toISOString(),
          lastStartedAt: new Date(0).toISOString(),
          manifestPath: '',
          lastError: null,
          services: {},
        },
        [otherStack]: {
          name: otherStack,
          configPath: '/other/path.yml',
          buildStatus: 'built',
          runtimeStatus: 'stopped',
          lastBuiltAt: new Date(0).toISOString(),
          lastStartedAt: new Date(0).toISOString(),
          manifestPath: '',
          lastError: null,
          services: {},
        },
      };
      mockFsStore[currentTestStateFilePath] = JSON.stringify(initialState);

      await removeStackState(stackToRemove);

      expect(mockWriteFile).toHaveBeenCalledTimes(1);
      const writtenData = JSON.parse(mockFsStore[currentTestStateFilePath]);
      expect(writtenData[stackToRemove]).toBeUndefined();
      expect(writtenData[otherStack]).toBeDefined();
    });

    it('should not write file or throw when removing non-existent stack from existing file', async () => {
      const existingState = { 'stack-a': { name: 'stack-a' } };
      mockFsStore[currentTestStateFilePath] = JSON.stringify(existingState);

      await removeStackState('non-existent-stack');

      expect(mockWriteFile).not.toHaveBeenCalled();
    });

    it('should not write file or throw when removing from non-existent state file', async () => {
      await removeStackState('any-stack');
      expect(mockWriteFile).not.toHaveBeenCalled();
    });
  });

  describe('saveDevxState (internal detail test)', () => {
    it('should correctly save the full state object', async () => {
      const fullState = {
        'stack-1': {
          name: 'stack-1',
          configPath: '/1.yml',
          buildStatus: 'built',
        },
        'stack-2': {
          name: 'stack-2',
          configPath: '/2.yml',
          buildStatus: 'error',
        },
      };
      await saveDevxState(fullState as any);
      expect(mockWriteFile).toHaveBeenCalledWith(
        currentTestStateFilePath,
        JSON.stringify(fullState, null, 2)
      );
      expect(JSON.parse(mockFsStore[currentTestStateFilePath])).toEqual(
        fullState
      );
    });

    it('should ensure state directory exists', async () => {
      mockMkdir.mockClear();
      mockMkdir.mockResolvedValue(undefined);

      await saveDevxState({});

      expect(mockMkdir).toHaveBeenCalledWith(currentTestStateDir, {
        recursive: true,
      });
    });
  });
});
