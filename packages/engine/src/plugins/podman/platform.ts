import { exec } from 'child_process';
import { promisify } from 'util';

export const execAsync = promisify(exec);

export interface PlatformInfo {
  platform: string;
  arch: string;
  supportsRootless: boolean;
  requiresVM: boolean;
  requiresWSL: boolean;
}

export async function getPlatformInfo(): Promise<PlatformInfo> {
  const platform = process.platform;
  const arch = process.arch;

  let supportsRootless = false;
  let requiresVM = false;
  let requiresWSL = false;

  switch (platform) {
    case 'linux':
      supportsRootless = await checkLinuxRootlessSupport();
      break;
    case 'darwin':
      requiresVM = true;
      break;
    case 'win32':
      requiresWSL = true;
      supportsRootless = await checkWSLRootlessSupport();
      break;
  }

  return {
    platform,
    arch,
    supportsRootless,
    requiresVM,
    requiresWSL,
  };
}

export async function checkLinuxRootlessSupport(): Promise<boolean> {
  try {
    // Check if user namespaces are enabled
    const { stdout } = await execAsync(
      'cat /proc/sys/user/max_user_namespaces'
    );
    return parseInt(stdout.trim()) > 0;
  } catch {
    return false;
  }
}

export async function checkWSLRootlessSupport(): Promise<boolean> {
  try {
    // Check if WSL 2 is installed and running
    const { stdout } = await execAsync('wsl --list --verbose');
    return stdout.includes('WSL 2');
  } catch {
    return false;
  }
}

// Define the expected argument structure
interface SetupVMOptions {
  podmanPath: string;
  devxRoot: string;
}

// Update function signature to accept the options object
export async function setupVM(options: SetupVMOptions): Promise<void> {
  const platform = process.platform;
  const { podmanPath, devxRoot } = options; // Destructure for potential use

  console.log(`Setting up VM for platform: ${platform}`); // Added logging
  console.log(`Using Podman path: ${podmanPath}`);
  console.log(`Using DevX root: ${devxRoot}`);

  if (platform === 'darwin') {
    // Initialize Podman machine for macOS - Use provided path?
    // TODO: Verify if 'podmanPath' should be used here
    console.log('Initializing and starting Podman machine on macOS...');
    await execAsync(`"${podmanPath}" machine init`);
    await execAsync(`"${podmanPath}" machine start`);
    console.log('Podman machine started.');
  } else if (platform === 'win32') {
    // Ensure WSL 2 is properly configured
    // TODO: Investigate if devxRoot is needed for WSL setup
    console.log('Ensuring WSL 2 is set as default...');
    await execAsync('wsl --set-default-version 2');
    console.log('WSL 2 set as default.');
  }
}

export async function cleanupVM(): Promise<void> {
  const platform = process.platform;

  if (platform === 'darwin') {
    await execAsync('podman machine stop');
    await execAsync('podman machine rm');
  }
}

export function getPlatformSpecificConfig(): string {
  const platform = process.platform;

  switch (platform) {
    case 'linux':
      return `
[engine]
cgroup_manager = "cgroupfs"
events_logger = "file"
    `.trim();
    case 'darwin':
      return `
[engine]
cgroup_manager = "cgroupfs"
events_logger = "file"
machine_enabled = true
    `.trim();
    case 'win32':
      return `
[engine]
cgroup_manager = "cgroupfs"
events_logger = "file"
machine_enabled = true
    `.trim();
    default:
      return '';
  }
}
