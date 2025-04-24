import { describe, test, expect, mock, beforeEach } from 'bun:test';
import Start from '../../src/commands/start';
// Import the core functions we need to mock
// REMOVED: import { start as coreStart, loadStack as coreLoadStack } from '@devx/devx';

// Mock the core @devx/devx module
const mockCoreStart = mock(async () => ({ success: true }));
const mockCoreLoadStack = mock(async () => [
  { name: 'test-stack', services: { web: { image: 'nginx' } } },
  'path/stack.yml',
]);
mock.module('@devx/devx', () => ({
  start: mockCoreStart,
  loadStack: mockCoreLoadStack,
}));

// Import AFTER mocking
import { start as coreStart, loadStack as coreLoadStack } from '@devx/devx';

describe('Start Command', () => {
  let startCommand: Start;

  beforeEach(() => {
    // Reset mocks for core functions
    mockCoreStart.mockClear();
    mockCoreLoadStack.mockClear();
    mockCoreStart.mockResolvedValue({ success: true });
    mockCoreLoadStack.mockResolvedValue([
      { name: 'test-stack', services: { web: { image: 'nginx' } } },
      'path/stack.yml',
    ]);

    startCommand = new Start();
    startCommand.args = { stack: 'test-stack' };
    startCommand.flags = {};
    startCommand.config = {
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
    startCommand.getStackIdentifier = mock(async (stackArg, fileFlag) => {
      const identifier = fileFlag || stackArg || 'test-stack';
      const [config] = await coreLoadStack(identifier);
      return config.name;
    });
  });

  describe('run', () => {
    test('should call core start successfully', async () => {
      await startCommand.run();
      expect(mockCoreStart).toHaveBeenCalled();
      expect(mockCoreLoadStack).toHaveBeenCalled();
    });

    test('should handle core loadStack failure', async () => {
      mockCoreLoadStack.mockImplementation(async () => {
        throw new Error('Core load failed');
      });
      await expect(startCommand.run()).rejects.toThrow(/Core load failed/);
    });

    test('should handle core start failure', async () => {
      mockCoreStart.mockImplementation(async () => {
        throw new Error('Core start failed');
      });
      await expect(startCommand.run()).rejects.toThrow('Core start failed');
    });
  });

  describe('flags', () => {
    test('should pass --file flag correctly', async () => {
      startCommand.flags = { file: 'custom-stack.yml' };
      await startCommand.run();
      expect(mockCoreLoadStack).toHaveBeenCalledWith('custom-stack.yml');
      expect(mockCoreStart).toHaveBeenCalled();
    });

    test('should pass --service flag to core start', async () => {
      startCommand.flags = { service: 'web' };
      await startCommand.run();
      expect(mockCoreStart).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ services: ['web'] })
      );
    });

    test('should pass --force flag to core start', async () => {
      startCommand.flags = { force: true };
      await startCommand.run();
      expect(mockCoreStart).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ force: true })
      );
    });

    test('should pass --watch flag to core start', async () => {
      startCommand.flags = { watch: true };
      await startCommand.run();
      expect(mockCoreStart).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ watch: true })
      );
    });

    test('should pass --build flag to core start', async () => {
      startCommand.flags = { build: true };
      await startCommand.run();
      expect(mockCoreStart).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ build: true })
      );
    });
  });
});
