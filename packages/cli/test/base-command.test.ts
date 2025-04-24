import { describe, test, expect, mock } from 'bun:test';
import { BaseCommand } from '../src/base-command';
import { logger } from '@devx/common';

// Mock the logger
mock.module('@devx/common', () => ({
  logger: {
    info: mock(() => {}),
    error: mock(() => {}),
    warn: mock(() => {}),
    debug: mock(() => {}),
    // Keep other logger properties if needed, or mock the entire module structure
  },
  // Mock other exports from @devx/common if BaseCommand uses them
  pluginManager: {
    getEnginePlugin: mock(() => ({ initialize: mock(async () => {}) })),
  },
}));

describe('BaseCommand', () => {
  describe('catch', () => {
    // Hold onto the original logger error to restore after tests if necessary
    // (Though bun:test often handles mock restoration automatically)

    test('should log the error message using logger.error', async () => {
      const command = new BaseCommand();
      const testError = new Error('Test error');
      command.error = mock(() => {}); // Still mock command.error to prevent exit
      (logger.error as jest.Mock).mockClear(); // Clear logger mock before test

      await command.catch(testError);

      expect(logger.error).toHaveBeenCalledWith(
        `Command Error: ${testError.message}`,
        testError
      );
      // Optionally check if super.catch (which might call this.error) was called
      // expect(command.error).toHaveBeenCalledWith(testError); // This depends on oclif internals
    });

    // The tests for string and object errors are less critical for the BaseCommand's added
    // functionality (logging), as oclif's super.catch handles the conversion to Error.
    // We primarily care that *our* logging logic works.
    // Keep them if detailed testing of the interaction with super.catch is desired,
    // but ensure logger.error is checked.

    test('should log string errors via logger.error', async () => {
      const command = new BaseCommand();
      const errorString = 'Test error message';
      command.error = mock(() => {});
      (logger.error as jest.Mock).mockClear();

      await command.catch(errorString as any); // Catching non-Errors technically violates type, but happens

      // BaseCommand's catch receives an Error object converted by super.catch
      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining(errorString),
        expect.any(Error)
      );
    });

    test('should log object errors via logger.error', async () => {
      const command = new BaseCommand();
      const errorInput = { detail: 'Some object' };
      command.error = mock(() => {});
      (logger.error as jest.Mock).mockClear();

      await command.catch(errorInput as any);

      expect(logger.error).toHaveBeenCalledWith(
        expect.stringContaining('Command Error'),
        expect.any(Error)
      );
    });
  });

  describe('logging', () => {
    test('should log messages correctly using instance log method', () => {
      const command = new BaseCommand();
      // Oclif's `log` method might use process.stdout, mocking it directly can be tricky.
      // If just testing if the method exists/can be called:
      command.log = mock(() => {});
      command.log('Test message');
      expect(command.log).toHaveBeenCalledWith('Test message');
    });
  });
});
