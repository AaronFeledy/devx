import { describe, test, expect, mock, beforeEach } from 'bun:test';
import Status from '../../src/commands/status';
// Import the core functions we need to mock
// REMOVED: import { status as coreStatus, loadStack as coreLoadStack } from '@devx/devx';

// Mock the core @devx/devx module
const mockStatusResult = {
  success: true,
  services: { web: { status: 'running' } },
};
const mockCoreStatus = mock(async () => mockStatusResult);
const mockCoreLoadStack = mock(async () => [
  { name: 'test-stack', services: { web: { image: 'nginx' } } },
  'path/stack.yml',
]);
mock.module('@devx/devx', () => ({
  status: mockCoreStatus,
  loadStack: mockCoreLoadStack,
}));

// Import AFTER mocking
import { status as coreStatus, loadStack as coreLoadStack } from '@devx/devx';

describe('Status Command', () => {
  let statusCommand: Status;

  beforeEach(() => {
    // Reset mocks for core functions
    mockCoreStatus.mockClear();
    mockCoreLoadStack.mockClear();
    mockCoreStatus.mockResolvedValue({ success: true, services: {} });
    mockCoreLoadStack.mockResolvedValue([
      { name: 'test-stack', services: { web: { image: 'nginx' } } },
      'path/stack.yml',
    ]);

    statusCommand = new Status();
    statusCommand.args = { stack: 'test-stack' };
    statusCommand.flags = {};
    statusCommand.config = {
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
    statusCommand.getStackIdentifier = mock(async (stackArg, fileFlag) => {
      const identifier = fileFlag || stackArg || 'test-stack';
      const [config] = await coreLoadStack(identifier);
      return config.name;
    });
    // Mock log/table methods used for output
    statusCommand.log = mock(() => {});
    (statusCommand as any).table = mock(() => {}); // Assuming table is available or added to BaseCommand
  });

  describe('run', () => {
    test('should call core status successfully', async () => {
      await statusCommand.run();
      expect(mockCoreStatus).toHaveBeenCalled();
      expect(mockCoreLoadStack).toHaveBeenCalled();
      expect((statusCommand as any).table).toHaveBeenCalled(); // Check if output was formatted
    });

    test('should handle core loadStack failure', async () => {
      mockCoreLoadStack.mockImplementation(async () => {
        throw new Error('Core load failed');
      });
      await expect(statusCommand.run()).rejects.toThrow(/Core load failed/);
    });

    test('should handle core status failure', async () => {
      mockCoreStatus.mockImplementation(async () => {
        throw new Error('Core status failed');
      });
      await expect(statusCommand.run()).rejects.toThrow('Core status failed');
    });

    test('should display service status correctly', async () => {
      mockCoreStatus.mockResolvedValue({
        success: true,
        services: {
          web: { status: 'running', ports: '8080->80' },
          db: { status: 'exited' },
        },
      });
      await statusCommand.run();
      expect((statusCommand as any).table).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({
            name: 'web',
            status: 'running',
            ports: '8080->80',
          }),
          expect.objectContaining({ name: 'db', status: 'exited' }),
        ]),
        expect.anything() // Ignore header/options object for now
      );
    });

    test('should log the status output on success', async () => {
      const mockStatusResult = {
        success: true,
        services: {
          web: { status: 'running', ports: '8080->80' },
          db: { status: 'exited' },
        },
      };
      mockCoreStatus.mockResolvedValue(mockStatusResult);
      await statusCommand.run();
      expect(statusCommand.log).toHaveBeenCalledWith(
        JSON.stringify(mockStatusResult, null, 2)
      );
    });
  });

  // Assuming coreStatus takes options object
  describe('flags', () => {
    test('should pass --file flag correctly', async () => {
      statusCommand.flags = { file: 'custom-stack.yml' };
      await statusCommand.run();
      expect(mockCoreLoadStack).toHaveBeenCalledWith('custom-stack.yml');
      expect(mockCoreStatus).toHaveBeenCalled();
    });

    test('should pass --service flag to core status', async () => {
      statusCommand.flags = { service: 'web' };
      await statusCommand.run();
      expect(mockCoreStatus).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ services: ['web'] })
      );
    });

    test('should pass --all flag to core status', async () => {
      statusCommand.flags = { all: true };
      await statusCommand.run();
      expect(mockCoreStatus).toHaveBeenCalledWith(
        'test-stack',
        expect.objectContaining({ all: true })
      );
    });
  });
});
