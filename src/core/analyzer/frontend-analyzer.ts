import * as path from 'node:path';
import { readFileContent } from '../../utils/fs.js';
import type { FileEntry, FrontendInfo, ComponentInfo } from './types.js';

const FRAMEWORK_DEPS: Record<string, string> = {
  next: 'next',
  nuxt: 'nuxt',
  'svelte-kit': '@sveltejs/kit',
  react: 'react',
  vue: 'vue',
  svelte: 'svelte',
  angular: '@angular/core',
};

export async function analyzeFrontend(
  files: FileEntry[],
  projectPath: string,
  packageJson: Record<string, unknown> | null,
): Promise<FrontendInfo> {
  const framework = detectFramework(packageJson);
  const components: ComponentInfo[] = [];
  const routes: string[] = [];
  const pages: string[] = [];

  for (const file of files) {
    if (file.type === 'component') {
      components.push({
        name: extractComponentName(file.relativePath),
        filePath: file.relativePath,
        type: 'component',
      });
    }

    if (file.type === 'page') {
      const pageName = extractPageRoute(file.relativePath, framework);
      pages.push(file.relativePath);
      if (pageName) routes.push(pageName);
    }

    if (file.type === 'route') {
      const extracted = await extractRoutes(file.path, framework);
      routes.push(...extracted);
    }
  }

  return { framework, routes: [...new Set(routes)], components, pages };
}

function detectFramework(packageJson: Record<string, unknown> | null): string | null {
  if (!packageJson) return null;

  const deps = {
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...(packageJson.devDependencies as Record<string, string> | undefined),
  };

  for (const [name, dep] of Object.entries(FRAMEWORK_DEPS)) {
    if (deps[dep]) return name;
  }

  return null;
}

function extractComponentName(relativePath: string): string {
  const basename = path.basename(relativePath, path.extname(relativePath));
  // Remove index from name
  if (basename.toLowerCase() === 'index') {
    return path.basename(path.dirname(relativePath));
  }
  return basename;
}

function extractPageRoute(relativePath: string, framework: string | null): string | null {
  if (framework === 'next') {
    // Next.js app router: app/dashboard/page.tsx -> /dashboard
    const match = relativePath.match(/app\/(.+?)\/page\./);
    if (match) return '/' + match[1].replace(/\[(.+?)\]/g, ':$1');

    // Next.js pages router: pages/about.tsx -> /about
    const pagesMatch = relativePath.match(/pages\/(.+?)\.(tsx|jsx|ts|js)$/);
    if (pagesMatch) {
      const route = pagesMatch[1].replace(/index$/, '').replace(/\[(.+?)\]/g, ':$1');
      return '/' + route.replace(/\/$/, '');
    }
  }

  if (framework === 'nuxt') {
    const match = relativePath.match(/pages\/(.+?)\.(vue)$/);
    if (match) {
      const route = match[1].replace(/index$/, '').replace(/\[(.+?)\]/g, ':$1');
      return '/' + route.replace(/\/$/, '');
    }
  }

  return null;
}

async function extractRoutes(filePath: string, _framework: string | null): Promise<string[]> {
  try {
    const rawContent = await readFileContent(filePath);
    // Strip out template literals (``) and block comments (/* */) by replacing them
    // with spaces of the IDENTICAL length to preserve AST regex match indices.
    const content = rawContent
      .replace(/`[\s\S]*?`/g, (match) => ' '.repeat(match.length))
      .replace(/\/\*[\s\S]*?\*\//g, (match) => ' '.repeat(match.length));

    const routes: string[] = [];

    // Match common route patterns: path: '/xxx' or path: "/xxx"
    const pathMatches = content.matchAll(/path:\s*['"`]([^'"`]+)['"`]/g);
    for (const match of pathMatches) {
      routes.push(match[1]);
    }

    // Match React Router: <Route path="/xxx"
    const routeMatches = content.matchAll(/<Route\s+[^>]*path=["']([^"']+)["']/g);
    for (const match of routeMatches) {
      routes.push(match[1]);
    }

    return routes;
  } catch {
    return [];
  }
}
