import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { downloadAndExtract, execAsync as originalExecAsync } from '../download';
import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import fetch from 'node-fetch';
import * as tar from 'tar';
import * as unzipper from 'unzipper';

// Mock the execAsync function exported from ../download
const mockExecAsync = mock(async (command: string, options?: any) => {
  // Default mock implementation (successful execution)
  return { stdout: '', stderr: '' };
});
mock.module('../download', () => ({
  ...require('../download'), // Keep original exports
  execAsync: mockExecAsync, // Override execAsync with our mock
}));

// Mock fs
mock.module('node:fs', () => ({
  createWriteStream: mock(() => ({
    write: mock(() => {}),
    end: mock(() => {}),
  })),
  createReadStream: mock(() => ({
    pipe: mock(() => ({
      pipe: mock(() => ({
        on: mock((event: string, callback: () => void) => {
          if (event === 'finish') callback();
          return { on: mock() };
        }),
      })),
    })),
  })),
}));

// Mock fs/promises
mock.module('node:fs/promises', () => ({
  mkdir: mock(() => Promise.resolve()),
  writeFile: mock(() => Promise.resolve()),
}));

// Mock stream/promises
mock.module('node:stream/promises', () => ({
  pipeline: mock(() => Promise.resolve()),
}));

// Mock zlib
mock.module('node:zlib', () => ({
  createGunzip: mock(() => ({
    pipe: mock(() => ({
      pipe: mock(() => ({
        on: mock((event: string, callback: () => void) => {
          if (event === 'finish') callback();
          return { on: mock() };
        }),
      })),
    })),
  })),
}));

// Mock node-fetch
const mockFetch = mock((url: string) => {
  if (url.includes('404')) {
    return Promise.resolve({
      ok: false,
      status: 404,
      statusText: 'Not Found',
    });
  }
  return Promise.resolve({
    ok: true,
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    body: {
      pipe: mock(() => ({
        pipe: mock(() => ({
          on: mock((event: string, callback: () => void) => {
            if (event === 'finish') callback();
            return { on: mock() };
          }),
        })),
      })),
    },
  });
});

// Mock unzipper
mock.module('unzipper', () => ({
  Open: {
    buffer: mock(() => Promise.resolve({
      files: [
        {
          type: 'File',
          path: 'podman.exe',
          buffer: () => Promise.resolve(Buffer.from('')),
        },
      ],
    })),
  },
}));

// Mock tar
mock.module('tar', () => ({
  extract: mock(() => Promise.resolve()),
}));

describe('downloadAndExtract', () => {

  beforeEach(() => {
    // Reset fetch mock
    mockFetch.mockClear();
    mock.module('node-fetch', () => ({
      default: mockFetch,
    }));

    // Reset execAsync mock
    mockExecAsync.mockClear();
    mockExecAsync.mockImplementation(async (command: string, options?: any) => {
      // Default successful implementation for most tests
      return { stdout: '', stderr: '' };
    });
  });

  test('should download and extract Windows binary', async () => {
    const options = {
      version: '4.0.0',
      platform: 'win32',
      arch: 'x64',
      destination: '/tmp/podman',
    };

    await downloadAndExtract(options);
    
    // Windows should not call execAsync
    expect(mockExecAsync.mock.calls.length).toBe(0);
  });

  test('should download and extract macOS binary', async () => {
    const options = {
      version: '4.0.0',
      platform: 'darwin',
      arch: 'x64',
      destination: '/tmp/podman',
    };

    await downloadAndExtract(options);
    
    // Should call pkgutil, cp, and chmod
    expect(mockExecAsync.mock.calls.length).toBe(3);
    expect(mockExecAsync.mock.calls[0][0]).toContain('pkgutil');
    expect(mockExecAsync.mock.calls[1][0]).toContain('cp');
    expect(mockExecAsync.mock.calls[2][0]).toContain('chmod');
  });

  test('should download and extract Linux binary', async () => {
    const options = {
      version: '4.0.0',
      platform: 'linux',
      arch: 'x64',
      destination: '/tmp/podman',
    };

    await downloadAndExtract(options);
    
    // Should call ar and chmod
    expect(mockExecAsync.mock.calls.length).toBe(2);
    expect(mockExecAsync.mock.calls[0][0]).toContain('ar');
    expect(mockExecAsync.mock.calls[1][0]).toContain('chmod');
  });

  test('should throw error for unsupported platform', async () => {
    const options = {
      version: '4.0.0',
      platform: 'unsupported',
      arch: 'x64',
      destination: '/tmp/podman',
    };

    await expect(downloadAndExtract(options)).rejects.toThrow('Unsupported platform');
  });

  test('should handle failed download', async () => {
    const options = {
      version: '4.0.0',
      platform: 'win32',
      arch: 'x64',
      destination: '/tmp/podman',
    };

    // Mock node-fetch to return 404
    mock.module('node-fetch', () => ({
      default: mock(() => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })),
    }));

    await expect(downloadAndExtract(options)).rejects.toThrow('Failed to download Podman');
  });

  test('should handle extraction failure', async () => {
    const options = {
      version: '4.0.0',
      platform: 'linux',
      arch: 'x64',
      destination: '/tmp/podman',
    };

    // Mock execAsync to fail
    mockExecAsync.mockImplementation(async () => {
      throw new Error('Command failed');
    });

    await expect(downloadAndExtract(options)).rejects.toThrow('Failed to extract Linux package');
  });
}); 