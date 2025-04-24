import { createWriteStream, createReadStream } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { pipeline } from 'node:stream/promises';
import { createGunzip } from 'node:zlib';
import { exec } from 'node:child_process';
import { promisify } from 'node:util';
import fetch, { type Response as NodeFetchResponse } from 'node-fetch';
import * as tar from 'tar';
import * as unzipper from 'unzipper';

export const execAsync = promisify(exec);

export interface DownloadOptions {
  version: string;
  platform: string;
  arch: string;
  destination: string;
}

export async function downloadAndExtract(
  options: DownloadOptions
): Promise<void> {
  const { version, platform, arch, destination } = options;
  const url = getDownloadUrl(version, platform, arch);

  console.log(`Downloading Podman ${version} for ${platform}/${arch}...`);

  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(
      `Failed to download Podman: ${response.status} ${response.statusText}`
    );
  }

  await mkdir(destination, { recursive: true });

  try {
    if (platform === 'win32') {
      await extractWindowsZip(response, destination);
    } else if (platform === 'darwin') {
      await extractMacOSPkg(response, destination);
    } else if (platform === 'linux') {
      await extractLinuxDeb(response, destination);
    } else {
      throw new Error(`Unsupported platform: ${platform}`);
    }

    // Make binaries executable (skip for Windows)
    if (platform !== 'win32') {
      await makeExecutable(destination);
    }
  } catch (error) {
    // Clean up the destination directory on failure
    try {
      await execAsync(`rm -rf ${destination}`);
    } catch (cleanupError) {
      if (cleanupError instanceof Error) {
        console.error('Failed to clean up after error:', cleanupError.message);
      } else {
        console.error('Failed to clean up after error:', cleanupError);
      }
    }
    if (error instanceof Error) {
      throw new Error(`Download/extraction failed: ${error.message}`);
    } else {
      throw new Error(
        `Download/extraction failed with unknown error: ${error}`
      );
    }
  }
}

function getDownloadUrl(
  version: string,
  platform: string,
  _arch: string
): string {
  const baseUrl =
    'https://download.opensuse.org/repositories/devel:kubic:libcontainers:stable';

  switch (platform) {
    case 'linux':
      return `${baseUrl}/xUbuntu_22.04/amd64/podman_${version}_amd64.deb`;
    case 'darwin':
      return `${baseUrl}/macOS/podman_${version}_macos.pkg`;
    case 'win32':
      return `${baseUrl}/Windows/podman_${version}_windows.zip`;
    default:
      throw new Error(`Unsupported platform: ${platform}`);
  }
}

async function extractWindowsZip(
  response: NodeFetchResponse,
  destination: string
): Promise<void> {
  const buffer = await response.arrayBuffer();
  const zip = await unzipper.Open.buffer(Buffer.from(buffer));

  for (const file of zip.files) {
    if (file.type === 'File') {
      const content = await file.buffer();
      const filePath = join(destination, file.path);
      await writeFile(filePath, content);
    }
  }
}

async function extractMacOSPkg(
  response: NodeFetchResponse,
  destination: string
): Promise<void> {
  // macOS packages need to be extracted using pkgutil
  const pkgPath = join(destination, 'podman.pkg');
  await pipeline(response.body!, createWriteStream(pkgPath));

  try {
    const { stderr: pkgutilStderr } = await execAsync(
      `pkgutil --expand-full ${pkgPath} ${join(destination, 'extracted')}`
    );
    if (pkgutilStderr) {
      throw new Error(`pkgutil failed: ${pkgutilStderr}`);
    }

    const { stderr: cpStderr } = await execAsync(
      `cp ${join(destination, 'extracted', 'podman', 'usr', 'local', 'bin', 'podman')} ${destination}`
    );
    if (cpStderr) {
      throw new Error(`cp failed: ${cpStderr}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract macOS package: ${error.message}`);
    } else {
      throw new Error(`Failed to extract macOS package: ${error}`);
    }
  }
}

async function extractLinuxDeb(
  response: NodeFetchResponse,
  destination: string
): Promise<void> {
  const debPath = join(destination, 'podman.deb');
  await pipeline(response.body!, createWriteStream(debPath));

  try {
    const { stderr: arStderr } = await execAsync(`ar x ${debPath}`, {
      cwd: destination,
    });
    if (arStderr) {
      throw new Error(`ar failed: ${arStderr}`);
    }

    // Extract the data.tar.gz
    await pipeline(
      createReadStream(join(destination, 'data.tar.gz')),
      createGunzip(),
      tar.extract({
        cwd: destination,
        strip: 1,
      })
    );
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to extract Linux package: ${error.message}`);
    } else {
      throw new Error(`Failed to extract Linux package: ${error}`);
    }
  }
}

async function makeExecutable(destination: string): Promise<void> {
  const podmanPath = join(destination, 'podman');
  try {
    const { stderr } = await execAsync(`chmod +x ${podmanPath}`);
    if (stderr) {
      throw new Error(`chmod failed: ${stderr}`);
    }
  } catch (error) {
    if (error instanceof Error) {
      throw new Error(`Failed to make binary executable: ${error.message}`);
    } else {
      throw new Error(`Failed to make binary executable: ${error}`);
    }
  }
}
