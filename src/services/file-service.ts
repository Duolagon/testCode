import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import * as os from 'node:os';
import { ensureDir } from '../utils/fs.js';

export class FileService {
  private tempDir: string;
  private artifactsDir: string;

  /**
   * @param outputDir  结果输出目录
   * @param projectPath  项目根目录，临时测试文件将写入项目内的 .ai-test-tmp/ 目录，
   *                     确保 vitest 等 test runner 的 include glob 能匹配到测试文件。
   *                     如果未提供则 fallback 到系统临时目录。
   */
  constructor(outputDir: string, projectPath?: string) {
    if (projectPath) {
      // 将临时文件写到项目目录内，vitest 可直接发现
      this.tempDir = path.join(path.resolve(projectPath), 'ai-test-tmp');
    } else {
      this.tempDir = path.join(os.tmpdir(), 'ai-test-' + Date.now());
    }
    this.artifactsDir = path.resolve(outputDir);
  }

  async init(): Promise<{ tempDir: string; artifactsDir: string }> {
    await ensureDir(this.tempDir);
    await ensureDir(this.artifactsDir);
    await ensureDir(path.join(this.artifactsDir, 'screenshots'));
    await ensureDir(path.join(this.artifactsDir, 'mcp'));
    return { tempDir: this.tempDir, artifactsDir: this.artifactsDir };
  }

  async writeTempFile(filename: string, content: string): Promise<string> {
    const filePath = path.join(this.tempDir, filename);
    await ensureDir(path.dirname(filePath));
    await fs.writeFile(filePath, content, 'utf-8');
    return filePath;
  }

  async cleanup(): Promise<void> {
    try {
      await fs.rm(this.tempDir, { recursive: true, force: true });
    } catch {
      // 忽略清理错误
    }
  }

  getTempDir(): string {
    return this.tempDir;
  }

  getArtifactsDir(): string {
    return this.artifactsDir;
  }
}
