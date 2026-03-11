import fg from 'fast-glob';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export async function globFiles(
  patterns: string[],
  options: { cwd: string; ignore?: string[] },
): Promise<string[]> {
  return fg(patterns, {
    cwd: options.cwd,
    ignore: options.ignore ?? [],
    absolute: true,
    dot: false,
    onlyFiles: true,
  });
}

export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJsonFile<T = unknown>(filePath: string): Promise<T | null> {
  try {
    const content = await readFileContent(filePath);
    return JSON.parse(content) as T;
  } catch {
    return null;
  }
}

export async function ensureDir(dirPath: string): Promise<void> {
  await fs.mkdir(dirPath, { recursive: true });
}

export function relativePath(from: string, to: string): string {
  return path.relative(from, to);
}
