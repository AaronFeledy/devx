import { describe, expect, test, mock, beforeAll, afterAll, beforeEach } from 'bun:test';
import { PodmanPlugin } from '../index';
import { mkdir, rm, access, readFile } from 'fs/promises';
import { join } from 'path';
import { homedir } from 'os';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { PlatformInfo } from '../platform';
import { existsSync } from 'fs';

// --- Mocking external dependencies ---

// Mock platform module
const mockPlatformExecAsync = mock(async () => ({ stdout: '', stderr: '' }));
const mockGetPlatformInfo = mock(async (): Promise<PlatformInfo> => ({
  platform: 'linux', // Default to Linux for tests
  arch: 'x64',
  supportsRootless: true,
  requiresVM: false,
  requiresWSL: false,
}));
const mockSetupVM = mock(async () => {});
const mockCleanupVM = mock(async () => {});
const mockGetPlatformSpecificConfig = mock(() => '[engine]\nevents_logger = "file"\ncgroup_manager = "cgroupfs"'); // Provide default engine config
mock.module('../platform', () => ({
  ...require('../platform'),
  execAsync: mockPlatformExecAsync,
  getPlatformInfo: mockGetPlatformInfo,
  setupVM: mockSetupVM,
  cleanupVM: mockCleanupVM,
  getPlatformSpecificConfig: mockGetPlatformSpecificConfig,
}));

// Mock download module
const mockDownloadExecAsync = mock(async () => ({ stdout: '', stderr: '' }));
const mockDownloadAndExtract = mock(async () => {});
mock.module('../download', () => ({
  ...require('../download'),
  execAsync: mockDownloadExecAsync,
  downloadAndExtract: mockDownloadAndExtract,
}));

// Mock execAsync to be injected into PodmanPlugin
const mockInjectedExecAsync = mock(async (command: string, options?: any) => {
  // Simulate successful podman command execution
  return { stdout: 'Success', stderr: '' }; 
});

// Mock fs/promises and fs (for setup/cleanup)
const mockMkdtemp = mock(async (prefix: string) => join(homedir(), '.devx-test-temp'));
const mockRm = mock(async () => {});
const mockWriteFile = mock(async () => {});
const mockReadFile = mock(async () => '5.2.4'); // Default: assume version matches
const mockAccess = mock(async () => {}); // Default: assume file exists
const mockExistsSync = mock(() => true); // Default: assume config exists

// --- Tests ---

describe('PodmanPlugin', () => {
  let plugin: PodmanPlugin;
  let testRoot: string;

  beforeEach(async () => {
    // Reset mocks before each test
    mockGetPlatformInfo.mockClear();
    mockSetupVM.mockClear();
    mockDownloadAndExtract.mockClear();
    mockPlatformExecAsync.mockClear();
    mockDownloadExecAsync.mockClear();
    mockWriteFile.mockClear();
    mockReadFile.mockClear();
    mockAccess.mockClear();
    mockExistsSync.mockClear();
    mockInjectedExecAsync.mockClear(); // Reset the injected mock

    // Default mock implementations
    mockAccess.mockImplementation(async () => {}); // Assume exists
    mockExistsSync.mockImplementation(() => true); // Assume exists
    mockReadFile.mockImplementation(async () => '5.2.4'); // Assume version matches
    mockInjectedExecAsync.mockImplementation(async (command: string, options?: any) => {
      return { stdout: 'Success', stderr: '' };
    });

    // Mock fs/promises 
    mock.module('fs/promises', () => ({
      mkdtemp: mockMkdtemp,
      rm: mockRm,
      writeFile: mockWriteFile,
      readFile: mockReadFile,
      access: mockAccess, 
    }));
    // Mock fs
    mock.module('fs', () => ({
      existsSync: mockExistsSync,
    }));

    testRoot = await mockMkdtemp('devx-test-');
    // Inject the mock execAsync function
    plugin = new PodmanPlugin({ 
      devxRoot: testRoot, 
      execAsync: mockInjectedExecAsync 
    });
  });

  afterAll(async () => {
    // Clean up temporary directory if needed (mocked rm handles this)
    await mockRm(testRoot, { recursive: true, force: true });
  });

  test('initialize creates necessary directories and config files', async () => {
    mockReadFile.mockImplementation(async () => { throw new Error('File not found'); }); // Mock version check failure
    await plugin.initialize();
    // Check if config files were written
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('storage.conf'), expect.any(String));
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('containers.conf'), expect.any(String));
    // Check if version file was written
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('version.txt'), '5.2.4');
  });

  test('initialize downloads Podman binaries if access check fails', async () => {
    // Simulate Podman binary access check failing
    mockAccess.mockImplementation(async (path: string) => {
      if (typeof path === 'string' && path.endsWith('podman')) { 
        throw new Error('Not Found');
      }
    });
    // No need to mock readFile here, access failure triggers download

    await plugin.initialize();
    expect(mockDownloadAndExtract).toHaveBeenCalled();
    // Ensure version file is written after download
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('version.txt'), '5.2.4');
  });

  test('initialize downloads Podman binaries if version mismatch', async () => {
    mockAccess.mockImplementation(async () => {}); // Binary exists
    mockReadFile.mockImplementation(async (path: string) => { // Version mismatch
      if (typeof path === 'string' && path.endsWith('version.txt')) {
        return '5.0.0'; 
      }
      throw new Error('Unexpected readFile call');
    });

    await plugin.initialize();
    expect(mockDownloadAndExtract).toHaveBeenCalled();
    // Ensure version file is updated after download
    expect(mockWriteFile).toHaveBeenCalledWith(expect.stringContaining('version.txt'), '5.2.4');
  });


  test('initialize configures Podman storage.conf correctly', async () => {
    mockReadFile.mockImplementation(async () => { throw new Error('File not found'); }); // Trigger write
    await plugin.initialize();
    
    const writeCall = mockWriteFile.mock.calls.find(call => 
      typeof call[0] === 'string' && call[0].endsWith('storage.conf')
    );
    expect(writeCall).toBeDefined();

    const writtenConfig = writeCall![1] as string;
    expect(writtenConfig).toContain(`graphroot = "${join(testRoot, 'podman')}"`);
    expect(writtenConfig).toContain(`runroot = "${join(testRoot, 'run')}"`);
  });

  test('initialize configures Podman containers.conf correctly', async () => {
    mockReadFile.mockImplementation(async () => { throw new Error('File not found'); }); // Trigger write
    await plugin.initialize();
    
    const writeCall = mockWriteFile.mock.calls.find(call => 
      typeof call[0] === 'string' && call[0].endsWith('containers.conf')
    );
    expect(writeCall).toBeDefined();

    const writtenConfig = writeCall![1] as string;
    expect(writtenConfig).toContain(`volumes = ["${join(testRoot, 'podman', 'volumes')}:${join(testRoot, 'podman', 'volumes')}"]`);
    expect(writtenConfig).toContain(`[engine]`); // From getPlatformSpecificConfig mock
  });


  test('start calls injected execAsync with correct command', async () => {
    await plugin.initialize();
    await plugin.start('test-container', { image: 'test-image' });
    // Check the injected execAsync mock
    expect(mockInjectedExecAsync).toHaveBeenCalled();
    const execCall = mockInjectedExecAsync.mock.calls[0][0];
    expect(execCall).toContain(join(testRoot, 'bin', 'podman', 'bin', 'podman')); // Check correct binary path
    expect(execCall).toContain(`run --name test-container test-image`);
    // No longer contains --root or --runroot
    expect(execCall).not.toContain(`--root`);
    expect(execCall).not.toContain(`--runroot`);
  });

  test('stop calls injected execAsync with correct command', async () => {
    await plugin.initialize();
    await plugin.stop('test-container');
    expect(mockInjectedExecAsync).toHaveBeenCalled();
    const execCall = mockInjectedExecAsync.mock.calls[0][0];
    expect(execCall).toContain(join(testRoot, 'bin', 'podman', 'bin', 'podman'));
    expect(execCall).toContain(`stop test-container`);
    expect(execCall).not.toContain(`--root`);
    expect(execCall).not.toContain(`--runroot`);
  });

  test('status calls injected execAsync with correct command', async () => {
    await plugin.initialize();
    await plugin.status('test-container');
    expect(mockInjectedExecAsync).toHaveBeenCalled();
    const execCall = mockInjectedExecAsync.mock.calls[0][0];
    expect(execCall).toContain(join(testRoot, 'bin', 'podman', 'bin', 'podman'));
    expect(execCall).toContain(`ps --filter name=test-container --format {{.Status}}`);
    expect(execCall).not.toContain(`--root`);
    expect(execCall).not.toContain(`--runroot`);
  });

  test('destroy calls injected execAsync with correct command', async () => {
    await plugin.initialize();
    await plugin.destroy('test-container');
    expect(mockInjectedExecAsync).toHaveBeenCalled();
    const execCall = mockInjectedExecAsync.mock.calls[0][0];
    expect(execCall).toContain(join(testRoot, 'bin', 'podman', 'bin', 'podman'));
    expect(execCall).toContain(`rm -f test-container`);
    expect(execCall).not.toContain(`--root`);
    expect(execCall).not.toContain(`--runroot`);
  });
}); 