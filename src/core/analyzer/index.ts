import * as path from 'node:path';
import { readJsonFile } from '../../utils/fs.js';
import type { Config } from '../../config/types.js';
import type { ProjectInfo, FeatureEntry, FileEntry } from './types.js';
import type { TestCategory } from '../../utils/constants.js';
import { scanFiles } from './file-scanner.js';
import { analyzeFrontend } from './frontend-analyzer.js';
import { analyzeBackend } from './backend-analyzer.js';
import { analyzeMcp } from './mcp-analyzer.js';
import { getChangedFiles } from './diff-analyzer.js';

export async function analyzeProject(
  projectPath: string,
  config: Config,
): Promise<ProjectInfo> {
  const absPath = path.resolve(projectPath);
  const packageJson = await readJsonFile<Record<string, unknown>>(
    path.join(absPath, 'package.json'),
  );

  const files = await scanFiles(absPath, config.project.exclude);
  const frontend = await analyzeFrontend(files, absPath, packageJson);
  const backend = await analyzeBackend(files, absPath, packageJson);
  const mcp = await analyzeMcp(absPath, config.mcp.configPath);

  const detectedTestRunner = detectTestRunner(packageJson);
  let features = buildFeatureMap(frontend, backend, mcp, files);

  // Append new dimensions to applicable categories
  for (const feature of features) {
    if (feature.applicableCategories.includes('Frontend') || feature.applicableCategories.includes('Backend')) {
      feature.applicableCategories.push('Integration', 'Compatibility', 'Performance');
    }
  }

  if (config.mode === 'incremental') {
    const changedFiles = getChangedFiles(absPath);
    if (changedFiles.length > 0) {
      // 检查 Feature 中是否有任何相关的前后端依赖处于修改范围内
      // 使用相对宽松的检查方法，如果该 feature 相关的组件或 endpoint 所处的 source 参与了该次 Git 修改，就被保留
      features = features.filter((feat) => {
        const relatedPaths = [...feat.frontendComponents];
        // 简单匹配：只要 changedFiles 里的路径包含了 feature 里面的某种定义即可
        return changedFiles.some(change =>
          relatedPaths.some(rp => change.includes(rp) || change.includes(path.parse(rp).name)) ||
          feat.backendEndpoints.some(be => change.includes('controller') || change.includes('route'))
        );
      });
      console.log(`  🔍 增量模式：发现 ${changedFiles.length} 个文件变更，过滤后涉及 ${features.length} 个功能点。`);
    } else {
      console.log(`  🔍 增量模式：未发现文件变更，将跳过生成。`);
      features = [];
    }
  }

  return {
    projectPath: absPath,
    packageJson,
    files,
    frontend,
    backend,
    mcp,
    features,
    detectedTestRunner,
  };
}

function detectTestRunner(packageJson: Record<string, unknown> | null): string | null {
  if (!packageJson) return null;

  const deps = {
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...(packageJson.devDependencies as Record<string, string> | undefined),
  };

  if (deps['vitest']) return 'vitest';
  if (deps['jest']) return 'jest';
  if (deps['mocha']) return 'mocha';

  // Check scripts for test runner hints
  const scripts = packageJson.scripts as Record<string, string> | undefined;
  if (scripts?.test) {
    if (scripts.test.includes('vitest')) return 'vitest';
    if (scripts.test.includes('jest')) return 'jest';
    if (scripts.test.includes('mocha')) return 'mocha';
  }

  return null;
}

function buildFeatureMap(
  frontend: ProjectInfo['frontend'],
  backend: ProjectInfo['backend'],
  mcp: ProjectInfo['mcp'],
  files: FileEntry[],
): FeatureEntry[] {
  let features: FeatureEntry[] = [];
  let featureId = 1;

  // Group frontend pages/components as features
  if (frontend.routes.length > 0 || frontend.pages.length > 0) {
    const routeSet = new Set(frontend.routes);
    for (const route of routeSet) {
      const categories: TestCategory[] = ['Frontend', 'WebUI'];

      // Check if there's a matching backend endpoint
      const matchingEndpoints = backend.endpoints.filter((e) => {
        const apiPath = e.path.replace(/^\/api/, '');
        const routePath = route.replace(/:\w+/g, '');
        return apiPath.includes(routePath) || routePath.includes(apiPath);
      });

      if (matchingEndpoints.length > 0) {
        categories.push('Backend');
      }

      features.push({
        id: `feat-${String(featureId++).padStart(3, '0')}`,
        name: routeToName(route),
        description: `Feature at route: ${route}`,
        frontendComponents: frontend.components
          .filter((c) => c.filePath.toLowerCase().includes(route.replace(/\//g, '').toLowerCase()))
          .map((c) => c.filePath),
        backendEndpoints: matchingEndpoints.map((e) => `${e.method} ${e.path}`),
        mcpTools: [],
        applicableCategories: categories,
      });
    }
  }

  // Add standalone components as features if no routes found
  if (features.length === 0 && frontend.components.length > 0) {
    for (const comp of frontend.components) {
      features.push({
        id: `feat-${String(featureId++).padStart(3, '0')}`,
        name: comp.name,
        description: `Component: ${comp.name}`,
        frontendComponents: [comp.filePath],
        backendEndpoints: [],
        mcpTools: [],
        applicableCategories: ['Frontend'],
      });
    }
  }

  // Add backend-only endpoints as features
  const coveredEndpoints = new Set(features.flatMap((f) => f.backendEndpoints));
  for (const endpoint of backend.endpoints) {
    const key = `${endpoint.method} ${endpoint.path}`;
    if (!coveredEndpoints.has(key)) {
      features.push({
        id: `feat-${String(featureId++).padStart(3, '0')}`,
        name: endpointToName(endpoint.method, endpoint.path),
        description: `API endpoint: ${endpoint.method} ${endpoint.path}`,
        frontendComponents: [],
        backendEndpoints: [key],
        mcpTools: [],
        applicableCategories: ['Backend'],
      });
    }
  }

  // FORCE FILTER: Remove any features that accidentally picked up template string files
  // These are prompt engineering strings, not application logic to be tested.
  features = features.filter(f => !f.name.toLowerCase().includes('template'));

  // Fallback for CLI/Library projects with no API or UI
  if (features.length === 0) {
    const srcFiles = files
      .filter((f) => f.language === 'ts' || f.language === 'js')
      .filter((f) => !f.type.includes('test')) // exclude existing tests
      .filter((f) => f.relativePath.includes('src/core/analyzer') || f.relativePath.includes('src/core/generator/case-parser.ts')) // Target ONLY pure core components
      .map((f) => f.relativePath)
      .slice(0, 15); // cap at 15 files to avoid token limits

    if (srcFiles.length > 0) {
      features.push({
        id: `feat-${String(featureId++).padStart(3, '0')}`,
        name: 'Core Application Logic',
        description: 'Core functionality for this CLI or library package',
        frontendComponents: [],
        backendEndpoints: [], // The AI backend generator handles "endpoints" arrays, but it's safe to leave empty if we define it as Frontend/Node logic
        mcpTools: [],
        applicableCategories: ['Frontend', 'Backend'], // Trigger both to test different layers
        // We'll shove the src files into frontendComponents since it maps to 'dependencies' visually in our prompt, 
        // or the AI can just grab them via SOURCE_CODE block globally. 
        // Adding it to frontendComponents ensures they are tracked in the map.
      });
      // To ensure the files are included in the source code context, push them.
      features[0].frontendComponents.push(...srcFiles);
    }
  }

  return features;
}

function routeToName(route: string): string {
  const parts = route.split('/').filter(Boolean);
  if (parts.length === 0) return 'Home';
  return parts
    .map((p) => p.replace(/^:/, '').replace(/-/g, ' '))
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function endpointToName(method: string, apiPath: string): string {
  const parts = apiPath.split('/').filter((p) => p && !p.startsWith(':') && p !== 'api');
  const resource = parts.join(' ') || 'resource';
  const action =
    method === 'GET'
      ? 'Get'
      : method === 'POST'
        ? 'Create'
        : method === 'PUT' || method === 'PATCH'
          ? 'Update'
          : method === 'DELETE'
            ? 'Delete'
            : method;
  return `${action} ${resource.charAt(0).toUpperCase() + resource.slice(1)}`;
}

export type { ProjectInfo, FeatureEntry } from './types.js';
