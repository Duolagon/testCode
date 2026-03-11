import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { globFiles } from '../../utils/fs.js';
import type { FileEntry } from './types.js';

const LANGUAGE_MAP: Record<string, FileEntry['language']> = {
  '.ts': 'ts',
  '.tsx': 'tsx',
  '.js': 'js',
  '.jsx': 'jsx',
  '.vue': 'vue',
  '.svelte': 'svelte',
  '.py': 'py',
};

function classifyFile(relativePath: string): FileEntry['type'] {
  // Normalize Windows backslashes to forward slashes to ensure robust directory keyword matching
  const lower = relativePath.replace(/\\/g, '/').toLowerCase();

  // Test files
  if (/\.(test|spec)\.(ts|tsx|js|jsx)$/.test(lower)) return 'test';
  if (lower.includes('__tests__/')) return 'test';

  // Styles
  if (/\.(css|scss|less|sass)$/.test(lower)) return 'style';

  // Config
  if (/\.(json|yaml|yml|toml)$/.test(lower) && !lower.includes('src/')) return 'config';

  // Routes
  if (lower.includes('/route') || lower.includes('/router')) return 'route';

  // Pages
  if (lower.includes('/pages/') || lower.includes('/app/') && lower.includes('page.')) return 'page';

  // Controllers
  if (lower.includes('/controller') || lower.includes('.controller.')) return 'controller';

  // Models
  if (lower.includes('/model') || lower.includes('.model.') || lower.includes('.schema.')) return 'model';

  // Middleware
  if (lower.includes('/middleware') || lower.includes('.middleware.')) return 'middleware';

  // Services
  if (lower.includes('/service') || lower.includes('.service.')) return 'service';

  // Components
  if (/\.(tsx|jsx|vue|svelte)$/.test(lower)) return 'component';

  return 'other';
}

function getLanguage(filePath: string): FileEntry['language'] {
  const ext = path.extname(filePath).toLowerCase();
  return LANGUAGE_MAP[ext] ?? 'other';
}

export async function scanFiles(
  projectPath: string,
  exclude: string[],
): Promise<FileEntry[]> {
  const patterns = ['**/*.{ts,tsx,js,jsx,vue,svelte,py}'];
  const ignorePatterns = exclude.map((e) => `**/${e}/**`);

  // NEVER scan the AI generator prompt templates.
  // They contain literal endpoint strings meant as examples, which corrupt the analyzer.
  ignorePatterns.push('**/src/core/generator/templates/**');
  // Exclude auto-generated test temp directory
  ignorePatterns.push('**/ai-test-tmp/**');

  const absolutePaths = await globFiles(patterns, {
    cwd: projectPath,
    ignore: ignorePatterns,
  });

  const entries: FileEntry[] = [];
  for (const absPath of absolutePaths) {
    // Normalize to forward slashes for cross-platform consistency in AST analysis
    const relPath = path.relative(projectPath, absPath).replace(/\\/g, '/');
    try {
      const stat = await fs.stat(absPath);
      entries.push({
        path: absPath,
        relativePath: relPath,
        type: classifyFile(relPath),
        language: getLanguage(absPath),
        size: stat.size,
      });
    } catch {
      // Skip unreadable files
    }
  }

  return entries;
}
