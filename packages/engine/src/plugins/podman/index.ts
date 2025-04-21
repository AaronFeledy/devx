import { EnginePlugin } from '../../EngineManager';
import { join } from 'path';
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { homedir } from 'os';
import { getPlatformInfo, setupVM, cleanupVM, getPlatformSpecificConfig, PlatformInfo } from './platform';
import { downloadAndExtract } from './download';

const defaultExecAsync = promisify(exec);

interface PodmanConfig {
  podmanVersion: string;
  podmanComposeVersion: string;
  root: string;
  runroot: string;
  platform: NodeJS.Platform;
  arch: string;
  platformInfo: PlatformInfo;
}

// Define the type for the execAsync function
type ExecAsyncFn = (command: string, options?: any) => Promise<{ stdout: string; stderr: string }>;

export class PodmanPlugin implements EnginePlugin {
  name = 'podman';
  private config: PodmanConfig;
  private binPath: string;
  private configPath: string;
  private _execAsync: ExecAsyncFn; // Instance variable for execAsync

  constructor(options?: { devxRoot?: string; execAsync?: ExecAsyncFn }) {
    const home = homedir();
    const devxRoot = options?.devxRoot || join(home, '.devx'); // Use provided root or default
    this.binPath = join(devxRoot, 'bin', 'podman', 'bin');
    this.configPath = join(devxRoot, 'bin', 'podman', 'config');
    this._execAsync = options?.execAsync || defaultExecAsync; // Use injected or default execAsync
    this.config = {
      podmanVersion: '5.2.4', // Pinned Podman version - Renamed
      podmanComposeVersion: '1.2.0', // Pinned podman-compose version - Added
      root: join(devxRoot, 'podman'), // Podman storage root
      runroot: join(devxRoot, 'run'), // Podman runroot
      platform: process.platform,
      arch: process.arch,
      platformInfo: {} as PlatformInfo,
    };
  }

  async initialize(): Promise<void> {
    this.config.platformInfo = await getPlatformInfo();
    await this.ensureDirectories();
    await this.downloadBinaries();
    await this.configurePodman();
    
    if (this.config.platformInfo.requiresVM) {
      await setupVM({
        podmanPath: this.getPodmanBinaryPath(),
        devxRoot: this.config.root
      });
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.binPath,
      this.configPath,
      this.config.root,
      this.config.runroot,
      join(this.config.root, 'volumes') // Ensure volumes dir exists too
    ];

    for (const dir of dirs) {
      await mkdir(dir, { recursive: true });
    }
  }

  private async downloadBinaries(): Promise<void> {
    const versionFile = join(this.configPath, 'version.txt');
    let currentPodmanVersion: string | null = null;
    let requiresDownload = false;
    const podmanBinPath = this.getPodmanBinaryPath();
    const podmanComposeBinPath = this.getPodmanComposeBinaryPath();

    try {
      await access(podmanBinPath);
      await access(podmanComposeBinPath);

      currentPodmanVersion = await readFile(versionFile, 'utf-8').catch(() => null);
      if (currentPodmanVersion !== this.config.podmanVersion) {
        console.log(
          `Found Podman version ${currentPodmanVersion}, but require ${this.config.podmanVersion}. Redownloading...`
        );
        requiresDownload = true;
      }
    } catch (err) {
      console.log('Required binaries or version file missing. Triggering download.', err);
      requiresDownload = true;
    }

    if (requiresDownload) {
      console.log('Downloading Podman and podman-compose binaries...');
      await downloadAndExtract({
        podmanVersion: this.config.podmanVersion,
        podmanComposeVersion: this.config.podmanComposeVersion,
        platform: this.config.platform,
        arch: this.config.arch,
        destination: this.binPath,
      });
      await writeFile(versionFile, this.config.podmanVersion);
      console.log(`Binaries downloaded and version file updated to ${this.config.podmanVersion}`);
    } else {
      console.log('Podman binaries and version are up-to-date.');
    }
  }

  private async configurePodman(): Promise<void> {
    const storageConfPath = join(this.configPath, 'storage.conf');
    const containersConfPath = join(this.configPath, 'containers.conf');

    // storage.conf content
    const storageConfig = `
[storage]
driver = "overlay"
runroot = "${this.config.runroot}"
graphroot = "${this.config.root}"

[storage.options.overlay]
mount_program = "/usr/bin/fuse-overlayfs"
`.trim();

    // containers.conf content (includes platform specific engine settings)
    const containersConfig = `
[containers]
volumes = ["${join(this.config.root, 'volumes')}:${join(this.config.root, 'volumes')}"]

${getPlatformSpecificConfig()}
`.trim();

    await writeFile(storageConfPath, storageConfig);
    await writeFile(containersConfPath, containersConfig);

    // Set environment variables for subsequent Podman commands within this process
    process.env.CONTAINERS_STORAGE_CONF = storageConfPath;
    process.env.CONTAINERS_CONTAINERS_CONF = containersConfPath;
    // Unset older vars if they exist, prefer the new ones
    delete process.env.PODMAN_ROOT; 
    delete process.env.PODMAN_RUNROOT;
  }

  private getPodmanBinaryPath(): string {
    return join(this.binPath, this.config.platform === 'win32' ? 'podman.exe' : 'podman');
  }

  private getPodmanComposeBinaryPath(): string {
    return join(this.binPath, 'podman-compose');
  }

  private _getPodmanCommandBase(): string[] {
    const podmanPath = this.getPodmanBinaryPath();
    const baseArgs = [`"${podmanPath}"`];
    return baseArgs;
  }

  async start(name: string, containerConfig: { image: string; [key: string]: any }): Promise<void> {
    const args = [
      ...this._getPodmanCommandBase(),
      'run',
      '--name', name, 
      containerConfig.image
    ];
    await this._execAsync(args.join(' '));
  }

  async stop(name: string): Promise<void> {
    const args = [
      ...this._getPodmanCommandBase(),
      'stop', name
    ];
    await this._execAsync(args.join(' '));
  }

  async status(name: string): Promise<string> {
    const args = [
      ...this._getPodmanCommandBase(),
      'ps', '--filter', `name=${name}`, '--format', '{{.Status}}'
    ];
    const { stdout } = await this._execAsync(args.join(' '));
    return stdout.trim();
  }

  async destroy(name: string): Promise<void> {
    const args = [
      ...this._getPodmanCommandBase(),
      'rm', '-f', name
    ];
    await this._execAsync(args.join(' '));
    
    if (this.config.platformInfo.requiresVM) {
      await cleanupVM(); 
    }
  }
} 