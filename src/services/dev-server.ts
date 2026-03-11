import { spawn, type ChildProcess } from 'node:child_process';
import * as net from 'node:net';
import * as path from 'node:path';
import treeKill from 'tree-kill';
import { readJsonFile } from '../utils/fs.js';
import type { Config } from '../config/types.js';

export class DevServerManager {
  private process: ChildProcess | null = null;
  private projectPath: string;
  private config: Config['webui'];

  constructor(projectPath: string, config: Config['webui']) {
    this.projectPath = projectPath;
    this.config = config;
  }

  async ensureRunning(): Promise<string> {
    const port = this.extractPort(this.config.baseUrl);

    // Check if already running
    if (await this.isPortInUse(port)) {
      return this.config.baseUrl;
    }

    // Detect dev command
    const devCommand = this.config.devCommand ?? (await this.detectDevCommand());
    if (!devCommand) {
      throw new Error(
        'Cannot detect dev server command. Set webui.devCommand in ai-test.config.json',
      );
    }

    // Start server
    const [cmd, ...args] = devCommand.split(' ');
    this.process = spawn(cmd, args, {
      cwd: this.projectPath,
      stdio: 'pipe',
      shell: true,
      env: { ...process.env, PORT: String(port) },
    });

    this.process.stderr?.on('data', () => {});
    this.process.stdout?.on('data', () => {});

    // Wait for port to be ready
    await this.waitForPort(port, 60_000);

    return this.config.baseUrl;
  }

  async stop(): Promise<void> {
    if (this.process?.pid) {
      return new Promise((resolve) => {
        treeKill(this.process!.pid!, 'SIGTERM', () => {
          this.process = null;
          resolve();
        });
      });
    }
  }

  private async detectDevCommand(): Promise<string | null> {
    const pkgJson = await readJsonFile<Record<string, unknown>>(
      path.join(this.projectPath, 'package.json'),
    );
    if (!pkgJson) return null;

    const scripts = pkgJson.scripts as Record<string, string> | undefined;
    if (!scripts) return null;

    // Priority: dev > start > serve
    if (scripts.dev) return 'npm run dev';
    if (scripts.start) return 'npm start';
    if (scripts.serve) return 'npm run serve';

    return null;
  }

  private extractPort(url: string): number {
    try {
      return new URL(url).port ? parseInt(new URL(url).port) : 3000;
    } catch {
      return 3000;
    }
  }

  private isPortInUse(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once('error', () => resolve(true));
      server.once('listening', () => {
        server.close();
        resolve(false);
      });
      server.listen(port);
    });
  }

  private waitForPort(port: number, timeout: number): Promise<void> {
    const start = Date.now();
    return new Promise((resolve, reject) => {
      const check = () => {
        if (Date.now() - start > timeout) {
          reject(new Error(`Dev server did not start within ${timeout}ms`));
          return;
        }

        const socket = net.createConnection({ port }, () => {
          socket.destroy();
          resolve();
        });
        socket.on('error', () => {
          setTimeout(check, 500);
        });
      };
      check();
    });
  }
}
