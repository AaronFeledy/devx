import { mock } from 'bun:test';
import { join } from 'path';
import { homedir } from 'os';

// Import the original modules to access their exports
import * as originalPlatform from '../src/plugins/podman/platform';
import * as originalDownload from '../src/plugins/podman/download';

console.log('--- Running Engine Test Preload (v2) ---');

// Store original process
const originalProcess = global.process;

// --- Mock node:process ---
// We can't directly mock 'node:process', but we can mock modules that *use* it,
// or mock the functions within our code that access it.
// Let's mock the functions within our own modules that read process.
// This might be complex. A simpler approach is to mock specific modules
// that ARE mockable and are used by the functions relying on process.

// Alternative: Mock specific functions within our modules if possible
// This seems difficult with current Bun mocking for non-exported functions.

// --- Mocking modules used by platform.ts and download.ts ---

// Mock platform.ts
mock.module('../src/plugins/podman/platform', () => {
  const mockedExecAsync = mock(async (command: string) => {
    console.log(`[Preload Mock platform.execAsync] Called with: ${command}`);
    if (command.includes('cat /proc/sys/user/max_user_namespaces')) {
      return { stdout: '10000', stderr: '' };
    }
    if (command.includes('wsl --list --verbose')) {
      return { stdout: 'WSL 2', stderr: '' };
    }
    return { stdout: '', stderr: '' };
  });

  return {
    // Keep original exports
    getPlatformInfo: originalPlatform.getPlatformInfo,
    checkLinuxRootlessSupport: originalPlatform.checkLinuxRootlessSupport,
    checkWSLRootlessSupport: originalPlatform.checkWSLRootlessSupport,
    setupVM: originalPlatform.setupVM,
    cleanupVM: originalPlatform.cleanupVM,
    getPlatformSpecificConfig: originalPlatform.getPlatformSpecificConfig,
    // Provide mocked execAsync
    execAsync: mockedExecAsync,
    // Note: PlatformInfo interface is a type, not exported at runtime
  };
});

// Mock download.ts
mock.module('../src/plugins/podman/download', () => {
  const mockedExecAsync = mock(async (command: string) => {
    console.log(`[Preload Mock download.execAsync] Called with: ${command}`);
    return { stdout: '', stderr: '' };
  });

  return {
    // Keep original exports
    downloadAndExtract: originalDownload.downloadAndExtract,
    // Provide mocked execAsync
    execAsync: mockedExecAsync,
    // Note: DownloadOptions interface is a type, not exported at runtime
  };
});

// Mock node-fetch
mock.module('node-fetch', () => ({
  default: mock(async (url: string) => {
    console.log(`[Preload Mock node-fetch] Called with: ${url}`);
    return Promise.resolve({
      ok: true,
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(8)),
      body: {
        pipe: mock((dest: any) => {
          if (dest && typeof dest.end === 'function')
            setImmediate(() => dest.end());
          return dest;
        }),
        on: mock(() => {}),
      },
    });
  }),
}));

// Mock fs/promises
// Important: Need to mock *all* functions used by the tested code
// PodmanPlugin uses mkdtemp, rm, writeFile, readFile, access
mock.module('node:fs/promises', () => ({
  mkdtemp: mock(async (_prefix: string) =>
    join(homedir(), '.devx-test-temp-preload')
  ),
  rm: mock(async () => {}),
  writeFile: mock(async () => {}),
  readFile: mock(async () => '5.2.4'),
  access: mock(async () => {}),
  // Add other fs/promises functions if needed by other tests
}));

// Mock fs
// PodmanPlugin uses existsSync
// download.ts uses createWriteStream, createReadStream
mock.module('node:fs', () => ({
  existsSync: mock(() => true),
  createWriteStream: mock(() => ({
    write: mock(() => {}),
    end: mock(() => {}),
    on: mock(() => {}),
  })),
  createReadStream: mock(() => ({
    pipe: mock((dest: any) => {
      // Simulate piping for stream mocks
      if (dest && typeof dest.on === 'function') {
        setImmediate(() => dest.on('finish', () => {}));
      }
      if (dest && typeof dest.end === 'function') {
        setImmediate(() => dest.end());
      }
      return dest;
    }),
    on: mock(() => {}), // Add on directly if needed
  })),
  // Add other fs functions if needed
}));

// Mock other native modules used in download tests
mock.module('node:stream/promises', () => ({
  pipeline: mock(() => Promise.resolve()),
}));
mock.module('node:zlib', () => ({
  createGunzip: mock(() => ({
    pipe: mock((dest: any) => dest), // Simple pipe mock
    on: mock(() => {}),
  })),
}));
mock.module('unzipper', () => ({
  Open: {
    buffer: mock(() =>
      Promise.resolve({
        files: [
          {
            type: 'File',
            path: 'podman.exe',
            buffer: mock(() => Promise.resolve(Buffer.from('dummy-content'))), // Mock buffer method
            stream: () => ({
              // Mock stream method used by some tests
              pipe: mock((dest: any) => {
                if (dest && typeof dest.end === 'function')
                  setImmediate(() => dest.end());
                return dest;
              }),
              on: mock(() => {}),
            }),
          },
        ],
      })
    ),
  },
}));
mock.module('tar', () => ({
  extract: mock(() => Promise.resolve()), // Mock extract function
}));

console.log('--- Engine Test Preload (v2) Finished ---');
