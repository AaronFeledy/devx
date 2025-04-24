import { describe, test, expect } from 'bun:test';
import { runCommand, CommandError } from '../src/util/command';

describe('runCommand', () => {
  test('should return stdout on success', async () => {
    const mockProc = {
      stdout: 'stdout',
      stderr: 'stderr',
      exited: Promise.resolve(0),
    };
    const mockSpawn = () => mockProc;
    let call = 0;
    const mockResponse = function (stream: any) {
      call++;
      return { text: () => Promise.resolve(call === 1 ? 'output' : '') };
    } as any;
    const result = await runCommand('echo', ['hello'], undefined, {
      spawn: mockSpawn,
      Response: mockResponse,
    });
    expect(result).toBe('output');
  });

  test('should throw CommandError on non-zero exit', async () => {
    const mockProc = {
      stdout: 'stdout',
      stderr: 'stderr',
      exited: Promise.resolve(1),
    };
    const mockSpawn = () => mockProc;
    let call = 0;
    const mockResponse = function (stream: any) {
      call++;
      return { text: () => Promise.resolve(call === 1 ? 'ok' : 'fail') };
    } as any;
    await expect(
      runCommand('fail', ['bad'], undefined, {
        spawn: mockSpawn,
        Response: mockResponse,
      })
    ).rejects.toThrow(CommandError);
  });

  test('CommandError should have correct properties', () => {
    const err = new CommandError('fail', 2, 'stderr', 'stdout');
    expect(err.name).toBe('CommandError');
    expect(err.exitCode).toBe(2);
    expect(err.stderr).toBe('stderr');
    expect(err.stdout).toBe('stdout');
  });
});
