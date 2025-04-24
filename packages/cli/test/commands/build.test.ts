import { describe, test, expect, mock, beforeEach } from 'bun:test';
import Build from '../../src/commands/build';
// Import the core functions we need to mock
// REMOVED: import { build as coreBuild, loadStack as coreLoadStack } from '@devx/devx';

// Mock the core @devx/devx module
const mockCoreBuild = mock(async () => ({ success: true }));
const mockCoreLoadStack = mock(async () => [
  { name: 'test-stack', services: { web: { image: 'nginx' } } },
  'path/stack.yml',
]);
mock.module('@devx/devx', () => ({
  build: mockCoreBuild,
  loadStack: mockCoreLoadStack,
}));

// Import AFTER mocking
import { build as coreBuild, loadStack as coreLoadStack } from '@devx/devx';

describe('Build Command', () => {
  let buildCommand: Build;

  beforeEach(() => {
    // Reset mocks for core functions
    mockCoreBuild.mockClear();
    mockCoreLoadStack.mockClear();
    mockCoreBuild.mockResolvedValue({ success: true });
    mockCoreLoadStack.mockResolvedValue([
      { name: 'test-stack', services: { web: { image: 'nginx' } } },
      'path/stack.yml',
    ]);

    buildCommand = new Build();
    buildCommand.args = { stack: 'test-stack' };
    buildCommand.flags = {};
    buildCommand.config = {
      runHook: mock(async () => ({})),
      findCommand: mock(() => ({})),
      plugins: [],
      pjson: {},
      root: '',
      version: '',
      name: '',
      channel: '',
      arch: '',
      platform: '',
      shell: '',
      userAgent: '',
      variableArgs: false,
      flexibleTaxonomy: false,
      topicSeparator: '',
      bin: '',
      npmRegistry: '',
      cacheDir: '',
      configDir: '',
      dataDir: '',
      stateDir: '',
      home: '',
      windows: false,
      macos: false,
      linux: false,
    };
    buildCommand.getStackIdentifier = mock(async (stackArg, fileFlag) => {
      const identifier = fileFlag || stackArg || 'test-stack';
      const [config] = await coreLoadStack(identifier);
      return config.name;
    });
  });

  describe('run', () => {
    test('should call core build successfully', async () => {
      await buildCommand.run();
      expect(mockCoreBuild).toHaveBeenCalled();
      expect(mockCoreLoadStack).toHaveBeenCalled();
    });

    test('should handle core loadStack failure', async () => {
      mockCoreLoadStack.mockImplementation(async () => {
        throw new Error('Core load failed');
      });
      await expect(buildCommand.run()).rejects.toThrow(/Core load failed/);
    });

    test('should handle core build failure', async () => {
      mockCoreBuild.mockImplementation(async () => {
        throw new Error('Core build failed');
      });
      await expect(buildCommand.run()).rejects.toThrow('Core build failed');
    });
  });

  describe('flags', () => {
    test('should pass --file flag correctly', async () => {
      buildCommand.flags = { file: 'custom-stack.yml' };
      await buildCommand.run();
      expect(mockCoreLoadStack).toHaveBeenCalledWith('custom-stack.yml');
      expect(mockCoreBuild).toHaveBeenCalled();
    });

    test('should pass --service flag to core build', async () => {
      buildCommand.flags = { service: 'web' };
      await buildCommand.run();
      expect(mockCoreBuild).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ services: ['web'] })
      );
    });

    test('should pass --no-cache flag to core build', async () => {
      buildCommand.flags = { 'no-cache': true };
      await buildCommand.run();
      expect(mockCoreBuild).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ noCache: true })
      );
    });

    test('should pass --force-rebuild flag to core build', async () => {
      buildCommand.flags = { 'force-rebuild': true };
      await buildCommand.run();
      expect(mockCoreBuild).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ forceRebuild: true })
      );
    });

    test('should pass --parallel flag to core build', async () => {
      buildCommand.flags = { parallel: true };
      await buildCommand.run();
      expect(mockCoreBuild).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ parallel: true })
      );
    });
  });
});
