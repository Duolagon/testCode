import { readFileContent } from '../../utils/fs.js';
import type { FileEntry, BackendInfo, EndpointInfo } from './types.js';

const BACKEND_FRAMEWORK_DEPS: Record<string, string> = {
  express: 'express',
  fastify: 'fastify',
  nestjs: '@nestjs/core',
  koa: 'koa',
  hapi: '@hapi/hapi',
};

export async function analyzeBackend(
  files: FileEntry[],
  _projectPath: string,
  packageJson: Record<string, unknown> | null,
): Promise<BackendInfo> {
  const framework = detectBackendFramework(packageJson);
  const endpoints: EndpointInfo[] = [];
  const models: string[] = [];
  const middleware: string[] = [];

  for (const file of files) {
    if (file.type === 'controller' || file.type === 'route') {
      const extracted = await extractEndpoints(file);
      endpoints.push(...extracted);
    }

    if (file.type === 'model') {
      models.push(file.relativePath);
    }

    if (file.type === 'middleware') {
      middleware.push(file.relativePath);
    }
  }

  // Also scan service/other files for route definitions if no controllers found
  if (endpoints.length === 0) {
    for (const file of files) {
      if (file.type === 'service' || file.type === 'other') {
        const extracted = await extractEndpoints(file);
        if (extracted.length > 0) {
          endpoints.push(...extracted);
        }
      }
    }
  }

  return { framework, endpoints, models, middleware };
}

function detectBackendFramework(packageJson: Record<string, unknown> | null): string | null {
  if (!packageJson) return null;

  const deps = {
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...(packageJson.devDependencies as Record<string, string> | undefined),
  };

  for (const [name, dep] of Object.entries(BACKEND_FRAMEWORK_DEPS)) {
    if (deps[dep]) return name;
  }

  return null;
}

async function extractEndpoints(file: FileEntry): Promise<EndpointInfo[]> {
  try {
    const rawContent = await readFileContent(file.path);
    // Strip out MULTI-LINE template literals (likely prompts/templates) and block comments.
    // We preserve single-line template literals because they are often used for route paths.
    // Using whitespace padding to preserve original match indices.
    const content = rawContent
      .replace(/`[\s\S]*?\n[\s\S]*?`/g, (match) => ' '.repeat(match.length))
      .replace(/\/\*[\s\S]*?\*\//g, (match) => ' '.repeat(match.length));

    const endpoints: EndpointInfo[] = [];

    // Express/Koa style: app.get('/path', ...) or router.post('/path', ...)
    const expressPatterns = content.matchAll(
      /(?:app|router|server)\.(get|post|put|patch|delete|options|head)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    );
    for (const match of expressPatterns) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        filePath: file.relativePath,
        handlerName: `${match[1].toLowerCase()}:${match[2]}`,
      });
    }

    // Fastify style: fastify.get('/path', ...)
    const fastifyPatterns = content.matchAll(
      /fastify\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/gi,
    );
    for (const match of fastifyPatterns) {
      endpoints.push({
        method: match[1].toUpperCase(),
        path: match[2],
        filePath: file.relativePath,
        handlerName: `${match[1].toLowerCase()}:${match[2]}`,
      });
    }

    // Detect all controllers and their definitions to find their precise location
    const controllerPatterns = Array.from(content.matchAll(
      /@Controller\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/g
    ));

    // NestJS decorators: @Get('/path'), @Post('/path'), @Get()
    const nestPatterns = content.matchAll(
      /@(Get|Post|Put|Patch|Delete)\s*\(\s*(?:['"`]([^'"`]*)['"`])?\s*\)/gi,
    );

    for (const match of nestPatterns) {
      // Find the closest preceding @Controller definition
      let prefix = '';
      let closestDistance = Number.MAX_SAFE_INTEGER;

      for (const ctrl of controllerPatterns) {
        if (ctrl.index !== undefined && match.index !== undefined && ctrl.index < match.index) {
          const distance = match.index - ctrl.index;
          if (distance < closestDistance) {
            closestDistance = distance;
            prefix = ctrl[1] || '';
          }
        }
      }

      const methodPath = match[2] || '';
      let cleanPath = `${prefix}/${methodPath}`.replace(/\/+/g, '/');
      if (cleanPath.length > 1 && cleanPath.endsWith('/')) {
        cleanPath = cleanPath.slice(0, -1);
      }
      if (!cleanPath.startsWith('/')) {
        cleanPath = '/' + cleanPath;
      }
      endpoints.push({
        method: match[1].toUpperCase(),
        path: cleanPath,
        filePath: file.relativePath,
        handlerName: `${match[1].toLowerCase()}:${cleanPath}`,
      });
    }

    return endpoints;
  } catch {
    return [];
  }
}
