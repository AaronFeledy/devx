/**
 * Error class for command execution failures.
 */
export class CommandError extends Error {
  constructor(
    message: string,
    public exitCode: number | null,
    public stderr: string,
    public stdout: string
  ) {
    super(message);
    this.name = 'CommandError';
  }
}

/**
 * Executes an external command and returns its output.
 *
 * @param cmd - The command to execute (e.g., 'nerdctl', 'podman-compose').
 * @param args - Arguments for the command.
 * @param options - Options like cwd.
 * @returns A promise resolving with the command's stdout.
 * @throws {CommandError} If the command fails.
 */
export async function runCommand(
  cmd: string,
  args: string[],
  options?: { cwd?: string }
): Promise<string> {
  const command = [cmd, ...args];
  console.debug(`Executing: ${command.join(' ')}` + (options?.cwd ? ` in ${options.cwd}` : ' '));

  const proc = Bun.spawn(command, {
    cwd: options?.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  const stdout = await new Response(proc.stdout).text();
  const stderr = await new Response(proc.stderr).text();
  const exitCode = await proc.exited;

  if (exitCode !== 0) {
    const errorMessage = `Command "${cmd}" failed (exit code ${exitCode}): ${stderr || stdout}`;
    console.error(errorMessage);
    throw new CommandError(errorMessage, exitCode, stderr, stdout);
  }

  return stdout.trim();
} 