import { EnginePlugin } from '../../EngineManager.js';
import { join } from 'path';
import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import { homedir } from 'os';
import {
  getPlatformInfo,
  setupVM,
  cleanupVM,
  getPlatformSpecificConfig,
  PlatformInfo,
} from './platform.js';
import { downloadAndExtract } from './download.js';
import type { StackStatusInfo } from '@devx/common';
import { StackStatus } from '@devx/common';

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
type ExecAsyncFn = (
  command: string,
  options?: any
) => Promise<{ stdout: string; stderr: string }>;

// Define the structure for a single service's status based on StackStatusInfo
type PodmanServiceStatus = {
  status: StackStatus; // Use the common enum
  engineStatus: string; // Podman specific raw status
  ports?: { hostPort: number; containerPort: number; protocol: string }[];
};

export class PodmanPlugin implements EnginePlugin {
  name = 'podman';
  type = 'engine' as const;
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
        devxRoot: this.config.root,
      });
    }
  }

  private async ensureDirectories(): Promise<void> {
    const dirs = [
      this.binPath,
      this.configPath,
      this.config.root,
      this.config.runroot,
      join(this.config.root, 'volumes'), // Ensure volumes dir exists too
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

      currentPodmanVersion = await readFile(versionFile, 'utf-8').catch(
        () => null
      );
      if (currentPodmanVersion !== this.config.podmanVersion) {
        console.log(
          `Found Podman version ${currentPodmanVersion}, but require ${this.config.podmanVersion}. Redownloading...`
        );
        requiresDownload = true;
      }
    } catch (err) {
      console.log(
        'Required binaries or version file missing. Triggering download.',
        err
      );
      requiresDownload = true;
    }

    if (requiresDownload) {
      console.log('Downloading Podman and podman-compose binaries...');
      await downloadAndExtract({
        version: this.config.podmanVersion,
        platform: this.config.platform,
        arch: this.config.arch,
        destination: this.binPath,
      });
      await writeFile(versionFile, this.config.podmanVersion);
      console.log(
        `Binaries downloaded and version file updated to ${this.config.podmanVersion}`
      );
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
    return join(
      this.binPath,
      this.config.platform === 'win32' ? 'podman.exe' : 'podman'
    );
  }

  private getPodmanComposeBinaryPath(): string {
    return join(this.binPath, 'podman-compose');
  }

  private _getPodmanCommandBase(): string[] {
    const podmanPath = this.getPodmanBinaryPath();
    const baseArgs = [`"${podmanPath}"`];
    return baseArgs;
  }

  async isAvailable(): Promise<boolean> {
    try {
      // Check if the main podman binary is accessible and executable
      const podmanPath = this.getPodmanBinaryPath();
      await access(podmanPath); // Check existence
      // Simple version check to see if the command runs
      await this._execAsync(`"${podmanPath}" --version`);
      // TODO: Add checks for podman-compose if necessary
      // TODO: Add check for VM status if required
      return true;
    } catch (error) {
      console.error('Podman availability check failed:', error);
      return false;
    }
  }

  private async getServiceStatus(
    stackName: string,
    serviceName: string
  ): Promise<PodmanServiceStatus> {
    // ... (get raw status string using podman ps) ...
    let rawStatus = 'unknown'; // Placeholder
    try {
      // Example: Use podman ps to get status for a container named stackName_serviceName
      // This naming convention might need to be derived from the builder plugin
      const containerName = `${stackName}_${serviceName}`; // Example naming
      const args = [
        ...this._getPodmanCommandBase(),
        'ps',
        '--filter',
        `name=${containerName}`,
        '--format',
        '{{.Status}}',
      ];
      const { stdout } = await this._execAsync(args.join(' '));
      rawStatus = stdout.trim() || 'not_found'; // Handle empty output
    } catch (error) {
      // If ps fails, container likely doesn't exist or podman error
      console.error(
        `Failed to get podman status for ${stackName}_${serviceName}:`,
        error
      );
      rawStatus = 'error';
    }

    let status: StackStatus;
    if (rawStatus.startsWith('Up')) {
      status = StackStatus.Running;
    } else if (
      rawStatus.startsWith('Exited (0)') ||
      rawStatus === 'not_found'
    ) {
      status = StackStatus.Stopped;
    } else if (rawStatus.startsWith('Exited')) {
      status = StackStatus.Error;
    } else {
      status = StackStatus.Unknown;
    }

    // TODO: Get port mapping information if needed
    const ports: {
      hostPort: number;
      containerPort: number;
      protocol: string;
    }[] = [];

    return {
      status: status,
      engineStatus: rawStatus,
      ports: ports,
    };
  }

  async getStackStatus(
    stackName: string,
    projectPath: string
  ): Promise<StackStatusInfo> {
    console.warn(
      `getStackStatus for '${stackName}' at path '${projectPath}' is not fully implemented for Podman yet.`
    );

    // TODO: We need the list of expected services from the StackConfig
    // Load the config first to know which services to check
    // const stackConfig = await loadStackConfig(stackName); // Need loadStackConfig here?
    const expectedServices = ['web', 'db']; // Hardcoded placeholder

    const serviceStatusPromises = expectedServices.map(async (serviceName) => {
      const status = await this.getServiceStatus(stackName, serviceName);
      return { [serviceName]: status };
    });

    const serviceStatusResults = await Promise.all(serviceStatusPromises);
    // Combine results into the expected format
    const serviceStatuses: { [key: string]: PodmanServiceStatus } =
      Object.assign({}, ...serviceStatusResults);

    // Determine overall status based on services
    let overallStatus: StackStatus = StackStatus.Unknown;
    const serviceValues = Object.values(serviceStatuses);
    const hasError = serviceValues.some((s) => s.status === StackStatus.Error);
    const allRunning = serviceValues.every(
      (s) => s.status === StackStatus.Running
    );
    const allStopped = serviceValues.every(
      (s) => s.status === StackStatus.Stopped
    );
    const isStarting = serviceValues.some(
      (s) =>
        s.status === StackStatus.Starting || s.status === StackStatus.Building
    );
    const isStopping = serviceValues.some(
      (s) => s.status === StackStatus.Stopping
    );

    if (serviceValues.length === 0) {
      overallStatus = StackStatus.NotCreated;
    } else if (hasError) {
      // Check for errors first
      overallStatus = StackStatus.Error;
    } else if (allRunning) {
      overallStatus = StackStatus.Running;
    } else if (allStopped) {
      overallStatus = StackStatus.Stopped;
    } else if (isStarting) {
      overallStatus = StackStatus.Starting;
    } else if (isStopping) {
      overallStatus = StackStatus.Stopping;
    }

    // Adapt the PodmanServiceStatus back to the structure expected by StackStatusInfo.services
    const finalServiceInfo: StackStatusInfo['services'] = {};
    for (const [name, podmanStatus] of Object.entries(serviceStatuses)) {
      finalServiceInfo[name] = {
        status: podmanStatus.engineStatus, // Use podman raw status here
        ports: podmanStatus.ports,
      };
    }

    return {
      status: overallStatus,
      services: finalServiceInfo,
    };
  }

  async start(
    name: string,
    containerConfig: { image: string; [key: string]: any }
  ): Promise<void> {
    const args = [
      ...this._getPodmanCommandBase(),
      'run',
      '--name',
      name,
      containerConfig.image,
      // TODO: Add logic to map containerConfig (ports, volumes, env) to podman run args
    ];
    console.log(`Executing podman start: ${args.join(' ')}`);
    await this._execAsync(args.join(' '));
  }

  async stop(name: string): Promise<void> {
    const args = [...this._getPodmanCommandBase(), 'stop', name];
    console.log(`Executing podman stop: ${args.join(' ')}`);
    await this._execAsync(args.join(' '));
  }

  async status(name: string): Promise<string> {
    const args = [
      ...this._getPodmanCommandBase(),
      'ps',
      '--filter',
      `name=${name}`,
      '--format',
      '{{.Status}}',
    ];
    console.log(`Executing podman status: ${args.join(' ')}`);
    const { stdout } = await this._execAsync(args.join(' '));
    return stdout.trim();
  }

  async destroy(name: string): Promise<void> {
    const args = [...this._getPodmanCommandBase(), 'rm', '-f', name];
    console.log(`Executing podman destroy: ${args.join(' ')}`);
    await this._execAsync(args.join(' '));

    if (this.config.platformInfo.requiresVM) {
      console.log('Cleaning up Podman VM...');
      await cleanupVM();
      console.log('Podman VM cleanup finished.');
    }
  }
}
