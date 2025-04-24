import { describe, test, expect, mock, beforeEach } from 'bun:test';
import Destroy from '../../src/commands/destroy';
// Import the core functions we need to mock
// REMOVED: import { destroy as coreDestroy, loadStack as coreLoadStack } from '@devx/devx';
import prompts from 'prompts';

// Mock prompts first
mock.module('prompts', () =>
  mock(async (q: any) => {
    // Mock implementation for prompts
    if (q.name === 'confirm') return { confirm: true }; // Default to confirm destroy
    return {};
  })
);

// Mock the core @devx/devx module
const mockCoreDestroy = mock(async () => ({ success: true }));
const mockCoreLoadStack = mock(async () => [
  { name: 'test-stack', services: {} },
  'path/stack.yml',
]);
mock.module('@devx/devx', () => ({
  destroy: mockCoreDestroy,
  loadStack: mockCoreLoadStack,
}));

// Import AFTER mocking
import { destroy as coreDestroy, loadStack as coreLoadStack } from '@devx/devx';

// REMOVED old stack/engine mocks
// mock.module('@devx/stack', () => mockStack);
// mock.module('@devx/engine', () => mockEngine);

describe('Destroy Command', () => {
  let destroyCommand: Destroy;

  beforeEach(() => {
    // Reset mocks for core functions
    mockCoreDestroy.mockClear();
    mockCoreLoadStack.mockClear();
    // Reset implementations to defaults (optional, but good practice)
    mockCoreDestroy.mockResolvedValue({ success: true });
    mockCoreLoadStack.mockResolvedValue([
      { name: 'test-stack', services: {} },
      'path/stack.yml',
    ]);

    destroyCommand = new Destroy();
    destroyCommand.args = { stack: 'test-stack' };
    // No longer need force: true flag as prompts is mocked
    destroyCommand.flags = {};
    destroyCommand.config = {
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
    destroyCommand.getStackIdentifier = mock(async (stackArg) => {
      // Simulate lookup based on arg or default
      const identifier = stackArg || 'test-stack';
      // Call the (mocked) core load function to simulate validation/finding path
      const [config] = await coreLoadStack(identifier);
      return config.name; // Return the name from the mocked config
    });
  });

  describe('run', () => {
    test('should call core destroy successfully', async () => {
      await destroyCommand.run();
      // Verify the core destroy function was called, not the engine mock
      expect(mockCoreDestroy).toHaveBeenCalled();
      // Ensure loadStack was called via getStackIdentifier
      expect(mockCoreLoadStack).toHaveBeenCalled();
    });

    test('should handle core loadStack failure', async () => {
      mockCoreLoadStack.mockImplementation(async () => {
        throw new Error('Core load failed');
      });
      // Run the command and expect it to throw because getStackIdentifier will fail
      await expect(destroyCommand.run()).rejects.toThrow(/Core load failed/);
    });

    test('should handle core destroy failure', async () => {
      // Ensure load succeeds first
      mockCoreLoadStack.mockResolvedValue([
        { name: 'test-stack', services: {} },
        'path/stack.yml',
      ]);
      mockCoreDestroy.mockImplementation(async () => {
        throw new Error('Core destroy failed');
      });
      await expect(destroyCommand.run()).rejects.toThrow('Core destroy failed');
    });
  });

  describe('flags', () => {
    test('should pass stack identifier from --file flag correctly', async () => {
      // How flags interact with core functions needs clarification.
      // For now, assume getStackIdentifier handles the file flag.
      destroyCommand.flags = { file: 'custom-stack.yml' };
      // We need getStackIdentifier to be called with the file path
      destroyCommand.getStackIdentifier = mock(async (stackArg, fileFlag) => {
        const identifier = fileFlag || stackArg || 'test-stack';
        const [config] = await coreLoadStack(identifier);
        return config.name;
      });

      await destroyCommand.run();
      // Expect coreLoadStack to have been called with the file path via getStackIdentifier
      expect(mockCoreLoadStack).toHaveBeenCalledWith('custom-stack.yml');
      expect(mockCoreDestroy).toHaveBeenCalled();
    });

    test('should pass --service flag to core destroy', async () => {
      // Implementation needed
    });

    test('should pass --volumes flag to core destroy', async () => {
      // Implementation needed
    });

    test('should pass --force flag to core destroy', async () => {
      // Implementation needed
    });
  });

  describe('destroy behavior', () => {
    test('should call core destroy with default options', async () => {
      await destroyCommand.run();
      expect(mockCoreDestroy).toHaveBeenCalledWith(
        'test-stack',
        expect.any(Object)
      ); // Check options object is passed
    });

    test('should handle core destroy failures gracefully', async () => {
      mockCoreLoadStack.mockResolvedValue([
        { name: 'test-stack', services: {} },
        'path/stack.yml',
      ]);
      mockCoreDestroy.mockImplementation(async () => {
        throw new Error('Core destroy failed');
      });
      await expect(destroyCommand.run()).rejects.toThrow('Core destroy failed');
    });
  });
});
