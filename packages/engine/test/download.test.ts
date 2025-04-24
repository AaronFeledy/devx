import { describe, expect, test, mock, beforeEach } from 'bun:test';
import { downloadAndExtract } from '../src/plugins/podman/download';

// --- Mocking native modules (REMOVED - Handled by preload) ---
// mock.module('node:fs', ...);
// mock.module('node:fs/promises', ...);
// mock.module('node:stream/promises', ...);
// mock.module('node:zlib', ...);
// mock.module('node-fetch', ...);
// mock.module('unzipper', ...);
// mock.module('tar', ...);

// --- Mock execAsync (REMOVED - Handled by preload) ---
// const mockExecAsync = mock(async ...);
// mock.module('../src/plugins/podman/download', ...);

// Import the mocked functions from the modules (mocked by preload)
import { execAsync as mockExecAsyncFromDownload } from '../src/plugins/podman/download';
import _fetch from 'node-fetch'; // Import the mocked fetch
const mockFetch = _fetch as any; // Cast to mock type

describe('downloadAndExtract', () => {
  beforeEach(() => {
    // Reset mock history before each test
    mockExecAsyncFromDownload.mockClear?.();
    mockFetch.mockClear?.();
    // Optionally reset implementations to preload defaults if necessary
    // mockExecAsyncFromDownload.mockImplementation(preloadDefaultExecImpl);
    // mockFetch.mockImplementation(preloadDefaultFetchImpl);
  });

  test('should download and extract Windows binary', async () => {
    const options = {
      version: '4.0.0',
      platform: 'win32' as const,
      arch: 'x64' as const,
      destination: '/tmp/podman',
    };
    await downloadAndExtract(options);
    expect(mockExecAsyncFromDownload).not.toHaveBeenCalled();
    expect(mockFetch).toHaveBeenCalledTimes(1);
  });

  test('should download and extract macOS binary', async () => {
    const options = {
      version: '4.0.0',
      platform: 'darwin' as const,
      arch: 'x64' as const,
      destination: '/tmp/podman',
    };
    // Override execAsync mock for this specific test if needed,
    // but preload default should work if successful calls are expected.
    await downloadAndExtract(options);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockExecAsyncFromDownload).toHaveBeenCalledTimes(3);
    expect(mockExecAsyncFromDownload).toHaveBeenCalledWith(
      expect.stringContaining('pkgutil'),
      expect.anything()
    );
    expect(mockExecAsyncFromDownload).toHaveBeenCalledWith(
      expect.stringContaining('cp'),
      expect.anything()
    );
    expect(mockExecAsyncFromDownload).toHaveBeenCalledWith(
      expect.stringContaining('chmod +x'),
      expect.anything()
    );
  });

  test('should download and extract Linux binary', async () => {
    const options = {
      version: '4.0.0',
      platform: 'linux' as const,
      arch: 'x64' as const,
      destination: '/tmp/podman',
    };
    await downloadAndExtract(options);
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockExecAsyncFromDownload).toHaveBeenCalledTimes(2);
    expect(mockExecAsyncFromDownload).toHaveBeenCalledWith(
      expect.stringContaining('ar x'),
      expect.anything()
    );
    expect(mockExecAsyncFromDownload).toHaveBeenCalledWith(
      expect.stringContaining('chmod +x'),
      expect.anything()
    );
  });

  test('should throw error for unsupported platform', async () => {
    const options = {
      version: '4.0.0',
      platform: 'unsupported' as any, // Use 'as any' for testing invalid input
      arch: 'x64' as const,
      destination: '/tmp/podman',
    };
    await expect(downloadAndExtract(options)).rejects.toThrow(
      'Unsupported platform'
    );
    expect(mockFetch).not.toHaveBeenCalled(); // Shouldn't try to fetch
    expect(mockExecAsyncFromDownload).not.toHaveBeenCalled();
  });

  test('should handle failed download', async () => {
    const options = {
      version: '4.0.0',
      platform: 'win32' as const,
      arch: 'x64' as const,
      destination: '/tmp/podman',
    };
    // Override the preloaded fetch mock for this test
    mockFetch.mockImplementationOnce(async () =>
      Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
      })
    );
    await expect(downloadAndExtract(options)).rejects.toThrow(
      /Failed to download Podman/
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockExecAsyncFromDownload).not.toHaveBeenCalled();
  });

  test('should handle extraction failure on Linux', async () => {
    const options = {
      version: '4.0.0',
      platform: 'linux' as const,
      arch: 'x64' as const,
      destination: '/tmp/podman',
    };
    // Override the preloaded execAsync mock for this test
    mockExecAsyncFromDownload.mockImplementationOnce(
      async (command: string) => {
        if (command.includes('ar x')) {
          throw new Error('Command failed');
        }
        // Should not happen if ar fails, but good practice
        return { stdout: '', stderr: '' };
      }
    );
    await expect(downloadAndExtract(options)).rejects.toThrow(
      'Failed to extract Linux package'
    );
    expect(mockFetch).toHaveBeenCalledTimes(1);
    expect(mockExecAsyncFromDownload).toHaveBeenCalledTimes(1); // Only the failing 'ar' call
    expect(mockExecAsyncFromDownload).toHaveBeenCalledWith(
      expect.stringContaining('ar x'),
      expect.anything()
    );
  });
});
