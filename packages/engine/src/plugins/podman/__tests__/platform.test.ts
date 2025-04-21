import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { getPlatformInfo, checkLinuxRootlessSupport, checkWSLRootlessSupport, execAsync as originalExecAsync } from '../platform';

// Mock the execAsync function exported from ../platform
const mockExecAsync = mock(async (command: string, options?: any) => {
  // Default mock implementation (successful execution)
  return { stdout: '', stderr: '' };
});
mock.module('../platform', () => ({
  ...require('../platform'), // Keep original exports
  execAsync: mockExecAsync, // Override execAsync with our mock
}));

describe('platform', () => {
  beforeEach(() => {
    // Reset execAsync mock
    mockExecAsync.mockClear();
    mockExecAsync.mockImplementation(async (command: string, options?: any) => {
      // Default successful implementation for most tests
      return { stdout: '', stderr: '' };
    });
  });

  test('getPlatformInfo returns correct info for Linux', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      if (command.includes('cat /proc/sys/user/max_user_namespaces')) {
        return { stdout: '10000', stderr: '' };
      }
      return { stdout: '', stderr: '' }; // Default
    });

    const info = await getPlatformInfo();
    expect(info.platform).toBe(process.platform);
    expect(info.arch).toBe(process.arch);
    expect(info.supportsRootless).toBe(true);
    expect(info.requiresVM).toBe(false);
    expect(info.requiresWSL).toBe(false);
  });

  test('getPlatformInfo returns correct info for macOS', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'darwin' });
    
    const info = await getPlatformInfo();
    expect(info.platform).toBe('darwin');
    expect(info.supportsRootless).toBe(false); // macOS requires VM, rootless handled by VM
    expect(info.requiresVM).toBe(true);
    expect(info.requiresWSL).toBe(false);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  test('getPlatformInfo returns correct info for Windows', async () => {
    const originalPlatform = process.platform;
    Object.defineProperty(process, 'platform', { value: 'win32' });
    
    mockExecAsync.mockImplementation(async (command) => {
      if (command.includes('wsl --list --verbose')) {
        return { stdout: 'WSL 2', stderr: '' };
      }
      return { stdout: '', stderr: '' }; // Default
    });

    const info = await getPlatformInfo();
    expect(info.platform).toBe('win32');
    expect(info.supportsRootless).toBe(true);
    expect(info.requiresVM).toBe(false);
    expect(info.requiresWSL).toBe(true);

    Object.defineProperty(process, 'platform', { value: originalPlatform });
  });

  test('checkLinuxRootlessSupport returns true if user namespaces are enabled', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      return { stdout: '10000', stderr: '' };
    });

    const supportsRootless = await checkLinuxRootlessSupport();
    expect(supportsRootless).toBe(true);
  });

  test('checkLinuxRootlessSupport returns false if user namespaces are disabled', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      return { stdout: '0', stderr: '' };
    });

    const supportsRootless = await checkLinuxRootlessSupport();
    expect(supportsRootless).toBe(false);
  });

  test('checkLinuxRootlessSupport returns false if command fails', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      throw new Error('Command failed');
    });

    const supportsRootless = await checkLinuxRootlessSupport();
    expect(supportsRootless).toBe(false);
  });

  test('checkWSLRootlessSupport returns true if WSL 2 is installed', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      return { stdout: 'WSL 2', stderr: '' };
    });

    const supportsRootless = await checkWSLRootlessSupport();
    expect(supportsRootless).toBe(true);
  });

  test('checkWSLRootlessSupport returns false if WSL 1 is installed', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      return { stdout: 'WSL 1', stderr: '' };
    });

    const supportsRootless = await checkWSLRootlessSupport();
    expect(supportsRootless).toBe(false);
  });

  test('checkWSLRootlessSupport returns false if command fails', async () => {
    mockExecAsync.mockImplementation(async (command) => {
      throw new Error('Command failed');
    });

    const supportsRootless = await checkWSLRootlessSupport();
    expect(supportsRootless).toBe(false);
  });
}); 