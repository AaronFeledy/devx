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
 * @param injected - Optional injected functions for testing.
 * @returns A promise resolving with the command's stdout.
 * @throws {CommandError} If the command fails.
 */
export async function runCommand(
  cmd: string,
  args: string[],
  options?: { cwd?: string },
  injected?: {
    spawn?: typeof Bun.spawn;
    Response?: typeof Response;
  }
): Promise<string> {
  const command = [cmd, ...args];
  console.debug(
    `Executing: ${command.join(' ')}` +
      (options?.cwd ? ` in ${options.cwd}` : ' ')
  );

  const spawnFn = injected?.spawn ?? Bun.spawn;
  const _ResponseCtor = injected?.Response ?? Response;

  const proc = spawnFn(command, {
    cwd: options?.cwd,
    stdout: 'pipe',
    stderr: 'pipe',
  });

  // Explicitly use Bun utilities to convert streams to text
  const stdoutPromise = Bun.readableStreamToText(proc.stdout);
  const stderrPromise = Bun.readableStreamToText(proc.stderr);
  const exitCodePromise = proc.exited;

  // Wait for all promises
  const [stdout, stderr, exitCode] = await Promise.all([
    stdoutPromise,
    stderrPromise,
    exitCodePromise,
  ]);

  if (exitCode !== 0) {
    const errorMessage = `Command "${cmd}" failed (exit code ${exitCode}): ${stderr || stdout}`;
    console.error(errorMessage);
    throw new CommandError(errorMessage, exitCode, stderr, stdout);
  }

  return stdout.trim();
}
