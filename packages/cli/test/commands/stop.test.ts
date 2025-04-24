import { describe, test, expect, mock, beforeEach } from 'bun:test';
import Stop from '../../src/commands/stop';
// Import the core functions we need to mock
// REMOVED: import { stop as coreStop, loadStack as coreLoadStack } from '@devx/devx';

// Mock the core @devx/devx module
const mockCoreStop = mock(async () => ({ success: true }));
const mockCoreLoadStack = mock(async () => [
  { name: 'test-stack', services: { web: { image: 'nginx' } } },
  'path/stack.yml',
]);
mock.module('@devx/devx', () => ({
  stop: mockCoreStop,
  loadStack: mockCoreLoadStack,
  // Add other core functions if needed by tests
}));

// Import AFTER mocking
import { stop as coreStop, loadStack as coreLoadStack } from '@devx/devx';

// REMOVED old stack/engine mocks
// mock.module('@devx/stack', () => mockStack);
// mock.module('@devx/engine', () => mockEngine);

describe('Stop Command', () => {
  let stopCommand: Stop;

  beforeEach(() => {
    // Reset mocks for core functions
    mockCoreStop.mockClear();
    mockCoreLoadStack.mockClear();
    // Reset implementations to defaults
    mockCoreStop.mockResolvedValue({ success: true });
    mockCoreLoadStack.mockResolvedValue([
      { name: 'test-stack', services: { web: { image: 'nginx' } } },
      'path/stack.yml',
    ]);

    stopCommand = new Stop();
    stopCommand.args = { stack: 'test-stack' };
    stopCommand.flags = {};
    stopCommand.config = {
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
    // Mock getStackIdentifier - it now uses the mocked coreLoadStack
    stopCommand.getStackIdentifier = mock(async (stackArg, fileFlag) => {
      const identifier = fileFlag || stackArg || 'test-stack';
      const [config] = await coreLoadStack(identifier);
      return config.name;
    });
  });

  describe('run', () => {
    test('should call core stop successfully', async () => {
      await stopCommand.run();
      expect(mockCoreStop).toHaveBeenCalled();
      expect(mockCoreLoadStack).toHaveBeenCalled();
    });

    test('should handle core loadStack failure', async () => {
      mockCoreLoadStack.mockImplementation(async () => {
        throw new Error('Core load failed');
      });
      await expect(stopCommand.run()).rejects.toThrow(/Core load failed/);
    });

    test('should handle core stop failure', async () => {
      // Ensure load succeeds first
      mockCoreLoadStack.mockResolvedValue([
        { name: 'test-stack', services: { web: { image: 'nginx' } } },
        'path/stack.yml',
      ]);
      mockCoreStop.mockImplementation(async () => {
        throw new Error('Core stop failed');
      });
      await expect(stopCommand.run()).rejects.toThrow('Core stop failed');
    });
  });

  describe('flags', () => {
    test('should pass stack identifier from --file flag correctly', async () => {
      stopCommand.flags = { file: 'custom-stack.yml' };
      await stopCommand.run();
      expect(mockCoreLoadStack).toHaveBeenCalledWith('custom-stack.yml');
      expect(mockCoreStop).toHaveBeenCalled();
    });

    // How flags like --service or --force are passed to coreStop needs clarification
    // Assuming coreStop takes an options object after the stack identifier
    test('should pass --service flag to core stop', async () => {
      stopCommand.flags = { service: 'web' };
      await stopCommand.run();
      expect(mockCoreStop).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ services: ['web'] })
      );
    });

    test('should pass --force flag to core stop', async () => {
      stopCommand.flags = { force: true };
      await stopCommand.run();
      expect(mockCoreStop).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ force: true })
      );
    });

    test('should pass --timeout flag to core stop', async () => {
      // Implementation needed
    });
  });

  describe('stop behavior', () => {
    test('should call core stop with default options', async () => {
      await stopCommand.run();
      expect(mockCoreStop).toHaveBeenCalledWith(
        'test-stack',
        expect.any(Object)
      ); // Check options object is passed
      // Add more specific checks on default options if needed
    });

    test('should handle core stop failures gracefully', async () => {
      mockCoreLoadStack.mockResolvedValue([
        { name: 'test-stack', services: { web: { image: 'nginx' } } },
        'path/stack.yml',
      ]);
      mockCoreStop.mockImplementation(async () => {
        throw new Error('Core stop failed');
      });
      await expect(stopCommand.run()).rejects.toThrow('Core stop failed');
    });

    // Test for already stopped services depends on how coreStop indicates this
    /*
    it('should handle already stopped services', async () => {
      mockCoreLoadStack.mockResolvedValue([{ name: 'test-stack', services: { web: { image: 'nginx' } } }, 'path/stack.yml']);
      mockCoreStop.mockImplementation(async () => {
        // Simulate coreStop indicating already stopped (e.g., specific error or return value)
        // throw new Error('Service already stopped'); 
        return { success: true, message: 'Already stopped' };
      });
      await stopCommand.run(); 
      // Assert logs or lack of error
    });
    */
  });
});
