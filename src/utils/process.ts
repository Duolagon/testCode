import { spawn } from 'node:child_process';

export interface SpawnResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  duration: number;
}

export async function spawnProcess(
  command: string,
  args: string[],
  options: {
    cwd?: string;
    timeout?: number;
    env?: Record<string, string | undefined>;
  } = {},
): Promise<SpawnResult> {
  const { cwd, timeout = 120_000, env } = options;
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'pipe',
      shell: process.platform === 'win32',
    });

    let stdout = '';
    let stderr = '';

    child.stdout.on('data', (data: Buffer) => {
      stdout += data.toString();
    });

    child.stderr.on('data', (data: Buffer) => {
      stderr += data.toString();
    });

    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Process timed out after ${timeout}ms`));
    }, timeout);

    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({
        exitCode: code ?? 1,
        stdout,
        stderr,
        duration: Date.now() - start,
      });
    });

    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
  });
}
