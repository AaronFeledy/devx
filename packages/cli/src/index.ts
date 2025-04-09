import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Executes a shell command.
 * // TODO: Implement proper error handling, output streaming, etc.
 * @param command The command to execute.
 * @param cwd The working directory for the command.
 */
export async function runCommand(command: string, cwd: string = process.cwd()): Promise<void> {
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