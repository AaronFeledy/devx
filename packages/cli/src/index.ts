import { exec } from 'child_process';
import { promisify } from 'util';
import '@devx/plugin-podman';
import '@devx/plugin-podman-compose';
import '@devx/plugin-router';

const execAsync = promisify(exec);

/**
 * Executes a shell command.
 * // TODO: Implement proper error handling, output streaming, etc.
 * @param command The command to execute.
 * @param cwd The working directory for the command.
 */
export async function runCommand(
  command: string,
  cwd: string = process.cwd()
): Promise<void> {
  console.log(`Executing in ${cwd}: ${command}`);
  try {
    const { stdout, stderr } = await execAsync(command, { cwd });
    if (stderr) {
      console.error(`Command stderr: ${stderr}`);
    }
    if (stdout) {
      console.log(`Command stdout: ${stdout}`);
    }
  } catch (error) {
    console.error(`Command execution failed: ${error}`);
    throw error;
  }
}

// Placeholder export to make it a module
export const placeholder = 'cli';

console.log('DevX CLI Initializing...');

// Example: Accessing registered plugins (demonstration)
import { pluginManager, type Plugin } from '@devx/common';

console.log(
  'Registered Engine Plugins:',
  pluginManager.getEnginePlugins().map((p: Plugin) => p.name)
);
console.log(
  'Registered Builder Plugins:',
  pluginManager.getBuilderPlugins().map((p: Plugin) => p.name)
);

// TODO: Add actual CLI logic using commander or similar
