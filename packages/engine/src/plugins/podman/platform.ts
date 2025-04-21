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
    requiresWSL
  };
}

export async function checkLinuxRootlessSupport(): Promise<boolean> {
  try {
    // Check if user namespaces are enabled
    const { stdout } = await execAsync('cat /proc/sys/user/max_user_namespaces');
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

export async function setupVM(): Promise<void> {
  const platform = process.platform;
  
  if (platform === 'darwin') {
    // Initialize Podman machine for macOS
    await execAsync('podman machine init');
    await execAsync('podman machine start');
  } else if (platform === 'win32') {
    // Ensure WSL 2 is properly configured
    await execAsync('wsl --set-default-version 2');
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