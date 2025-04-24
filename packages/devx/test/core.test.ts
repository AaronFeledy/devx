// TODO: Tests failing due to module state persistence (plugin registry)
// TODO: and unreliable mocking of fs/state/core functions in bun:test.
// Requires further investigation into bun test isolation/mocking or code refactor.

import { describe, it, expect, mock, beforeEach, afterEach } from 'bun:test';
import { build, start, stop, status, loadStack } from '../src/core';
import {
  getStackState,
  updateStackState,
  removeStackState,
  initializeState,
  StackBuildStatus,
} from '../src/state'; // Added StackBuildStatus
import type { EnginePlugin, BuilderPlugin, StackState } from '@devx/common';
import { logger, StackStatus } from '@devx/common'; // Added StackStatus
import { homedir } from 'os';
import { join } from 'path';
// Removed unused fs imports: import { rm } from 'fs/promises';
import type { StackConfig } from '@devx/common/schemas/stack'; // Import StackConfig type

// --- Mock Dependencies ---

// Mock the state module functions
const mockUpdateStackState = mock(async () => {});
const mockGetStackState = mock(
  async (stackName: string): Promise<StackState | undefined> => {
    // Default: return a basic stopped state
    if (stackName === 'test-stack') {
      return {
        name: 'test-stack', // Add name for consistency
        configPath: '/fake/path/test-stack/.stack.yml', // Add path
        buildStatus: 'built',
        runtimeStatus: 'stopped',
        lastError: null,
        services: {},
        lastBuiltAt: new Date(0), // Add missing fields
        lastStartedAt: new Date(0),
        manifestPath: '',
      };
    }
    return undefined;
  }
);

mock.module('../src/state', () => ({
  getStackState: mockGetStackState,
  updateStackState: mockUpdateStackState,
  removeStackState: mock(async () => {}),
  initializeState: mock(async () => {}),
  getInitialStackState: mock((config: StackConfig, configPath: string) => ({
    // Mock this too
    name: config.name,
    configPath: configPath,
    buildStatus: StackBuildStatus.NotBuilt,
    runtimeStatus: StackStatus.Unknown,
    lastBuiltAt: new Date(0),
    lastStartedAt: new Date(0),
    manifestPath: '',
    lastError: null,
  })),
  StackBuildStatus: require('../src/state').StackBuildStatus, // Re-export enum
}));

// Mock logger
const mockLoggerInfo = mock(() => {});
const mockLoggerError = mock(() => {});
const mockLoggerWarn = mock(() => {});
const mockLoggerDebug = mock(() => {});
mock.module('@devx/common/logger', () => ({
  logger: {
    info: mockLoggerInfo,
    error: mockLoggerError,
    warn: mockLoggerWarn,
    debug: mockLoggerDebug,
  },
}));

// Mock @devx/stack
const mockStackConfig: StackConfig = {
  name: 'test-stack',
  services: {
    web: {
      build: { context: '.' },
      image: 'test-image',
    },
  },
};
const mockConfigPath = '/fake/path/test-stack/.stack.yml';
const mockLoadStackConfig = mock(async (identifier: string) => {
  require('@devx/common/logger').logger.debug(
    `[MOCK] loadStackConfig called with: ${identifier}`
  );
  if (
    identifier === 'test-stack' ||
    identifier === mockConfigPath ||
    identifier === '.'
  ) {
    // Handle '.' for default case
    require('@devx/common/logger').logger.debug(
      `[MOCK] loadStackConfig returning mock for: ${identifier}`
    );
    return { stackConfig: mockStackConfig, configPath: mockConfigPath };
  }
  // Simulate not found for other identifiers
  require('@devx/common/logger').logger.debug(
    `[MOCK] loadStackConfig throwing ENOENT for: ${identifier}`
  );
  const error = new Error(`Stack configuration not found for '${identifier}'.`);
  // @ts-ignore Add code for better matching if needed
  error.code = 'ENOENT';
  throw error;
});

mock.module('@devx/stack', () => ({
  loadStackConfig: mockLoadStackConfig,
}));

// --- Mock Plugins ---
const mockEngineStartStack = mock(async () => {});
const mockEngineStopStack = mock(async () => {});
const mockEngineGetStackStatus = mock(async () => ({
  status: StackStatus.Stopped,
  services: {},
}));
const mockEngineDestroyStack = mock(async () => {});
const mockEnginePlugin: EnginePlugin = {
  name: 'test-engine',
  type: 'engine',
  startStack: mockEngineStartStack,
  stopStack: mockEngineStopStack,
  getStackStatus: mockEngineGetStackStatus,
  destroyStack: mockEngineDestroyStack,
};

const mockBuilderBuild = mock(async () => {});
const mockBuilderPlugin: BuilderPlugin = {
  name: 'test-builder',
  type: 'builder',
  build: mockBuilderBuild,
  // Add other methods if needed by core.ts (e.g., start, stop)
  start: mock(async () => {}),
  stop: mock(async () => {}),
};

// Mock @devx/common (pluginManager part and re-exports)
// This needs to be careful not to overwrite already mocked modules like logger
mock.module('@devx/common', () => {
  // Dynamically get original exports if possible, otherwise explicitly list them
  const originalCommon = require('@devx/common');
  return {
    ...originalCommon, // Keep original exports
    // Override pluginManager specifically
    pluginManager: {
      getPlugin: mock((name: string) => {
        if (name === 'test-engine') return mockEnginePlugin;
        if (name === 'test-builder') return mockBuilderPlugin;
        // Attempt to return from original, or return undefined
        return originalCommon.pluginManager?.getPlugin(name);
      }),
      getDefaultBuilder: mock(() => mockBuilderPlugin),
      getDefaultEngine: mock(() => mockEnginePlugin),
      // Mock other pluginManager methods if necessary
    },
    // Ensure things mocked elsewhere aren't overwritten
    logger: require('@devx/common/logger').logger, // Use the mocked logger
    // Explicitly re-export enums/types used by core.ts if not covered by spread
    StackStatus: originalCommon.StackStatus,
    StackBuildStatus: require('../src/state').StackBuildStatus, // Re-export enum from mocked state
  };
});

// Mock getGlobalConfig from ./config
const mockGetGlobalConfig = mock(async () => ({
  defaultBuilder: 'test-builder',
  defaultEngine: 'test-engine',
  stateDir: '/fake/state/dir', // Provide some default
  stacksDir: '/fake/stacks/dir',
}));
mock.module('../src/config/index.js', () => ({
  getGlobalConfig: mockGetGlobalConfig,
}));

describe('DevX Core', () => {
  beforeEach(async () => {
    // Reset mocks
    mockGetStackState.mockClear();
    mockUpdateStackState.mockClear();
    mockLoggerInfo.mockClear();
    mockLoggerError.mockClear();
    mockLoggerWarn.mockClear();
    mockLoggerDebug.mockClear();
    mockEngineStartStack.mockClear();
    mockEngineStopStack.mockClear();
    mockEngineGetStackStatus.mockClear();
    mockEngineDestroyStack.mockClear();
    mockBuilderBuild.mockClear();
    mockLoadStackConfig.mockClear();
    mockGetGlobalConfig.mockClear();
    (require('@devx/common').pluginManager.getPlugin as any).mockClear();

    // Reset mock implementations to defaults for state
    mockGetStackState.mockImplementation(async (stackName: string) => {
      if (stackName === 'test-stack') {
        return {
          name: 'test-stack',
          configPath: mockConfigPath,
          buildStatus: StackBuildStatus.Built, // Use enum
          runtimeStatus: StackStatus.Stopped, // Use enum
          lastError: null,
          services: {},
          lastBuiltAt: new Date(0),
          lastStartedAt: new Date(0),
          manifestPath: '',
        };
      }
      return undefined;
    });
    mockUpdateStackState.mockResolvedValue(undefined);

    // Reset engine/builder mocks
    mockEngineStartStack.mockResolvedValue(undefined);
    mockEngineStopStack.mockResolvedValue(undefined);
    mockEngineGetStackStatus.mockResolvedValue({
      status: StackStatus.Stopped,
      services: {},
    });
    mockBuilderBuild.mockResolvedValue(undefined);

    // Reset loadStackConfig mock
    mockLoadStackConfig.mockImplementation(async (identifier: string) => {
      if (
        identifier === 'test-stack' ||
        identifier === mockConfigPath ||
        identifier === '.'
      ) {
        return { stackConfig: mockStackConfig, configPath: mockConfigPath };
      }
      const error = new Error(
        `Stack configuration not found for '${identifier}'.`
      );
      // @ts-ignore
      error.code = 'ENOENT';
      throw error;
    });

    // Reset global config mock
    mockGetGlobalConfig.mockResolvedValue({
      defaultBuilder: 'test-builder',
      defaultEngine: 'test-engine',
      stateDir: '/fake/state/dir',
      stacksDir: '/fake/stacks/dir',
    });
  });

  // --- Tests ---

  describe('build', () => {
    it('should successfully build a stack', async () => {
      await build('test-stack');
      expect(mockLoadStackConfig).toHaveBeenCalledWith('test-stack');
      expect(mockBuilderBuild).toHaveBeenCalledWith(
        mockStackConfig,
        join(mockConfigPath, '..')
      );
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ buildStatus: StackBuildStatus.Built })
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('built successfully')
      );
    });

    it('should handle build failure', async () => {
      const error = new Error('Build failed');
      mockBuilderBuild.mockRejectedValue(error);
      await expect(build('test-stack')).rejects.toThrow(
        /^Failed to build stack/
      );
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({
          buildStatus: StackBuildStatus.Error,
          lastError: error.message,
        })
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to build stack'),
        error
      );
    });

    it('should throw if loadStackConfig fails', async () => {
      const loadError = new Error('Cannot find config');
      mockLoadStackConfig.mockRejectedValue(loadError);
      await expect(build('test-stack')).rejects.toThrow(
        /^Failed to load stack configuration/
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to load stack'),
        expect.any(Error)
      ); // Check wrapper error
    });
  });

  describe('start', () => {
    it('should successfully start a built stack', async () => {
      // State mock returns 'built' by default
      await start('test-stack');
      expect(mockLoadStackConfig).toHaveBeenCalledWith('test-stack');
      expect(mockBuilderBuild).not.toHaveBeenCalled(); // Should not rebuild
      expect(mockEngineStartStack).toHaveBeenCalledWith(
        mockStackConfig,
        join(mockConfigPath, '..')
      );
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ runtimeStatus: StackStatus.Running })
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('Starting stack')
      );
    });

    it('should build stack first if not built', async () => {
      // Override state mock for this test
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        buildStatus: StackBuildStatus.NotBuilt,
        runtimeStatus: StackStatus.Unknown,
        lastError: null,
        services: {},
        lastBuiltAt: new Date(0),
        lastStartedAt: new Date(0),
        manifestPath: '',
      });

      // Mock build to succeed
      mockBuilderBuild.mockResolvedValueOnce(undefined);

      // Mock state update during build to set status to 'built'
      // And mock getStackState for the re-check after build
      mockUpdateStackState.mockImplementationOnce(async (name, update) => {
        if (
          name === 'test-stack' &&
          update.buildStatus === StackBuildStatus.Built
        ) {
          // Simulate state update
          mockGetStackState.mockResolvedValueOnce({
            name: 'test-stack',
            configPath: mockConfigPath,
            buildStatus: StackBuildStatus.Built, // Now built
            runtimeStatus: StackStatus.Stopped, // Still stopped
            lastError: null,
            services: {},
            lastBuiltAt: new Date(),
            lastStartedAt: new Date(0),
            manifestPath: '',
          });
        }
      });

      await start('test-stack');

      expect(mockLoggerWarn).toHaveBeenCalledWith(
        expect.stringContaining('not built')
      );
      expect(mockBuilderBuild).toHaveBeenCalledTimes(1);
      expect(mockEngineStartStack).toHaveBeenCalledTimes(1);
      // Check the two state updates
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ buildStatus: StackBuildStatus.Built })
      );
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ runtimeStatus: StackStatus.Running })
      );
    });

    it('should handle start failure', async () => {
      const error = new Error('Start failed');
      mockEngineStartStack.mockRejectedValue(error);
      await expect(start('test-stack')).rejects.toThrow(
        /^Failed to start stack/
      );
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({
          runtimeStatus: StackStatus.Error,
          lastError: error.message,
        })
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to start stack'),
        error
      );
    });

    it('should handle build failure when starting unbuilt stack', async () => {
      // Override state mock
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        buildStatus: StackBuildStatus.NotBuilt,
        runtimeStatus: StackStatus.Unknown,
        lastError: null,
        services: {},
        lastBuiltAt: new Date(0),
        lastStartedAt: new Date(0),
        manifestPath: '',
      });
      const buildError = new Error('Build blew up');
      mockBuilderBuild.mockRejectedValue(buildError); // Build fails

      await expect(start('test-stack')).rejects.toThrow(
        /Build failed for stack .* cannot start/
      );

      expect(mockBuilderBuild).toHaveBeenCalledTimes(1);
      expect(mockEngineStartStack).not.toHaveBeenCalled(); // Start should not be called
      // Check state was updated after failed build
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({
          buildStatus: StackBuildStatus.Error,
          lastError: buildError.message,
        })
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Build failed for stack'),
        buildError
      );
    });
  });

  describe('stop', () => {
    it('should successfully stop a running stack', async () => {
      // Override state mock
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running, // Simulate running
        lastError: null,
        services: {},
        lastBuiltAt: new Date(),
        lastStartedAt: new Date(),
        manifestPath: '',
      });
      await stop('test-stack');
      expect(mockEngineStopStack).toHaveBeenCalledWith(
        mockStackConfig,
        join(mockConfigPath, '..')
      );
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ runtimeStatus: StackStatus.Stopped })
      );
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('stopped successfully')
      );
    });

    it('should handle stop failure', async () => {
      const error = new Error('Stop failed');
      mockEngineStopStack.mockRejectedValue(error);
      // Assume running state
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running,
        lastError: null,
        services: {},
        lastBuiltAt: new Date(),
        lastStartedAt: new Date(),
        manifestPath: '',
      });

      await expect(stop('test-stack')).rejects.toThrow(/^Failed to stop stack/);
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({
          runtimeStatus: StackStatus.Error,
          lastError: error.message,
        })
      );
      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to stop stack'),
        error
      );
    });

    it('should not throw if stack is already stopped', async () => {
      // State mock returns 'stopped' by default
      await expect(stop('test-stack')).resolves.toBeUndefined();
      expect(mockEngineStopStack).not.toHaveBeenCalled(); // Stop shouldn't be called
      expect(mockLoggerInfo).toHaveBeenCalledWith(
        expect.stringContaining('already stopped')
      );
      expect(mockUpdateStackState).not.toHaveBeenCalled(); // State shouldn't change
    });
  });

  describe('status', () => {
    it('should return combined status for a running stack', async () => {
      const mockServiceStatus = { web: { status: 'running' } };
      mockEngineGetStackStatus.mockResolvedValue({
        status: StackStatus.Running,
        services: mockServiceStatus,
      });
      // Mock stored state as built but maybe 'stopped' or 'unknown'
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Stopped, // Stored state might be stale
        lastError: null,
        services: {},
        lastBuiltAt: new Date(),
        lastStartedAt: new Date(0),
        manifestPath: '',
      });

      const result = await status('test-stack');

      expect(mockEngineGetStackStatus).toHaveBeenCalledWith(
        mockStackConfig,
        join(mockConfigPath, '..')
      );
      // Status should combine stored build status with live engine status
      expect(result).toEqual({
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running, // Comes from engine mock
        services: mockServiceStatus,
        lastError: null, // Explicitly check lastError
      });
      // Verify state is updated with the live status
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ runtimeStatus: StackStatus.Running })
      );
    });

    it('should handle engine status failure', async () => {
      const error = new Error('Status fetch failed');
      mockEngineGetStackStatus.mockRejectedValue(error);
      // Assume stored state is 'running'
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        buildStatus: StackBuildStatus.Built,
        runtimeStatus: StackStatus.Running,
        lastError: null,
        services: {},
        lastBuiltAt: new Date(),
        lastStartedAt: new Date(),
        manifestPath: '',
      });

      const result = await status('test-stack');

      expect(mockLoggerError).toHaveBeenCalledWith(
        expect.stringContaining('Failed to get status'),
        error
      );
      // Should return stored build status but indicate runtime error
      expect(result).toEqual({
        buildStatus: StackBuildStatus.Built, // From stored state
        runtimeStatus: StackStatus.Error, // Updated due to engine error
        services: {}, // No services if status fails
        lastError: error.message,
      });
      // Also verify updateStackState was called to persist the error state
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({
          runtimeStatus: StackStatus.Error,
          lastError: error.message,
        })
      );
    });

    it("should return 'unknown' if state is missing and config load fails", async () => {
      mockGetStackState.mockResolvedValue(undefined); // Simulate no state found
      // Mock loadStackConfig to fail for this specific test
      const loadError = new Error('Cannot find config');
      mockLoadStackConfig.mockRejectedValueOnce(loadError);

      const result = await status('test-stack'); // Call status

      expect(mockEngineGetStackStatus).not.toHaveBeenCalled(); // Engine shouldn't be called
      expect(result).toEqual({
        buildStatus: StackBuildStatus.Unknown,
        runtimeStatus: StackStatus.Unknown,
        services: {},
        lastError: expect.stringContaining(
          'Failed to load stack configuration'
        ), // Should capture the load error
      });
      // State should NOT be updated as we couldn't even load the config
      expect(mockUpdateStackState).not.toHaveBeenCalled();
    });

    it("should return 'unknown' build status if state exists but build status is missing", async () => {
      // Mock state with missing buildStatus
      mockGetStackState.mockResolvedValueOnce({
        name: 'test-stack',
        configPath: mockConfigPath,
        // buildStatus: undefined, // Missing!
        runtimeStatus: StackStatus.Stopped,
        lastError: null,
        services: {},
        lastBuiltAt: new Date(0),
        lastStartedAt: new Date(0),
        manifestPath: '',
      } as any); // Use 'as any' to allow missing property for test

      // Assume engine status is fine
      mockEngineGetStackStatus.mockResolvedValueOnce({
        status: StackStatus.Stopped,
        services: {},
      });

      const result = await status('test-stack');

      expect(result).toEqual({
        buildStatus: StackBuildStatus.Unknown, // Should default to unknown
        runtimeStatus: StackStatus.Stopped,
        services: {},
        lastError: null,
      });
      // State should be updated with current status
      expect(mockUpdateStackState).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ runtimeStatus: StackStatus.Stopped })
      );
    });
  });
});
