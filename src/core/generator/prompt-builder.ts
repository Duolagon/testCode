import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { TestCategory } from '../../utils/constants.js';
import type { ProjectInfo, FeatureEntry } from '../analyzer/types.js';
import type { Config } from '../../config/types.js';
import { frontendTemplate } from './templates/frontend.js';
import { backendTemplate } from './templates/backend.js';
import { webuiTemplate } from './templates/webui.js';
import { mcpTemplate } from './templates/mcp.js';
import { integrationTemplate } from './templates/integration.js';
import { compatibilityTemplate } from './templates/compatibility.js';
import { performanceTemplate } from './templates/performance.js';

const MAX_SOURCE_CHARS = 200_000; // ~50K tokens

/**
 * 从 package.json 提取已安装的依赖列表（dependencies + devDependencies）
 */
function getInstalledDeps(packageJson: Record<string, unknown> | null): string {
  if (!packageJson) return '(unknown - no package.json)';

  const deps = {
    ...(packageJson.dependencies as Record<string, string> | undefined),
    ...(packageJson.devDependencies as Record<string, string> | undefined),
  };

  const depNames = Object.keys(deps);
  if (depNames.length === 0) return '(none)';
  return depNames.join(', ');
}

/**
 * 根据 package.json 的 bin/main/type/scripts 字段推断项目类型
 */
function detectProjectType(packageJson: Record<string, unknown> | null): string {
  if (!packageJson) return 'unknown';

  const parts: string[] = [];

  // 检查是否有 bin 字段 -> CLI 工具
  if (packageJson.bin) {
    parts.push('CLI tool (has "bin" field)');
  }

  // 检查是否有 exports/main -> 库
  if (packageJson.exports || packageJson.main) {
    parts.push('library/module');
  }

  // 检查 scripts 中是否有 start/serve -> 可能是 server
  const scripts = packageJson.scripts as Record<string, string> | undefined;
  if (scripts?.start || scripts?.serve) {
    parts.push('server/application');
  }

  return parts.length > 0 ? parts.join(', ') : 'application';
}

function getTemplate(category: TestCategory) {
  switch (category) {
    case 'Frontend':
      return frontendTemplate;
    case 'Backend':
      return backendTemplate;
    case 'WebUI':
      return webuiTemplate;
    case 'MCP':
      return mcpTemplate;
    case 'Compatibility':
      return compatibilityTemplate;
    case 'Performance':
      return performanceTemplate;
    default:
      return frontendTemplate;
  }
}

async function readSourceSnippets(
  feature: FeatureEntry,
  projectInfo: ProjectInfo,
): Promise<string> {
  const filePaths: string[] = [
    ...feature.frontendComponents,
    ...projectInfo.backend.endpoints
      .filter((e) => feature.backendEndpoints.includes(`${e.method} ${e.path}`))
      .map((e) => e.filePath),
  ];

  let totalChars = 0;
  const snippets: string[] = [];

  for (const relPath of filePaths) {
    if (totalChars >= MAX_SOURCE_CHARS) break;
    try {
      const absPath = path.join(projectInfo.projectPath, relPath);
      const content = await fs.readFile(absPath, 'utf-8');
      const truncated =
        content.length + totalChars > MAX_SOURCE_CHARS
          ? content.slice(0, MAX_SOURCE_CHARS - totalChars) + '\n... (truncated)'
          : content;
      snippets.push(`--- ${relPath} ---\n${truncated}`);
      totalChars += truncated.length;
    } catch {
      // Skip unreadable files
    }
  }

  return snippets.join('\n\n') || '(No source code available)';
}

export async function buildPrompt(
  feature: FeatureEntry,
  category: TestCategory,
  projectInfo: ProjectInfo,
  config: Config,
): Promise<{ system: string; user: string }> {
  const template = getTemplate(category);
  const sourceCode = await readSourceSnippets(feature, projectInfo);

  let user = template.userTemplate
    .replace('{{FEATURE_NAME}}', feature.name)
    .replace('{{FEATURE_DESC}}', feature.description)
    .replace('{{SOURCE_CODE}}', sourceCode);

  // Category-specific replacements
  if (category === 'Frontend' || category === 'WebUI') {
    user = user
      .replace('{{PROJECT_FRAMEWORK}}', projectInfo.frontend.framework ?? 'unknown')
      .replace('{{TEST_RUNNER}}', projectInfo.detectedTestRunner ?? 'vitest')
      .replace('{{ROUTES}}', projectInfo.frontend.routes.join(', ') || 'none')
      .replace('{{BASE_URL}}', config.webui.baseUrl)
      .replace('{{EXISTING_TESTS}}', '');
  }

  if (category === 'Backend') {
    // 提取已安装依赖列表
    const installedDeps = getInstalledDeps(projectInfo.packageJson);
    // 判断项目类型
    const projectType = detectProjectType(projectInfo.packageJson);

    user = user
      .replace('{{BACKEND_FRAMEWORK}}', projectInfo.backend.framework ?? 'unknown')
      .replace('{{TEST_RUNNER}}', projectInfo.detectedTestRunner ?? 'vitest')
      .replace('{{ENDPOINTS}}', feature.backendEndpoints.join('\n') || 'none')
      .replace('{{INSTALLED_DEPS}}', installedDeps)
      .replace('{{PROJECT_TYPE}}', projectType)
      .replace('{{EXISTING_TESTS}}', '');
  }

  if (category === 'Compatibility' || category === 'Performance') {
    const installedDeps = getInstalledDeps(projectInfo.packageJson);
    const projectType = detectProjectType(projectInfo.packageJson);

    user = user
      .replace('{{FEATURE_DESC}}', feature.description)
      .replace('{{TEST_RUNNER}}', projectInfo.detectedTestRunner ?? 'vitest')
      .replace('{{INSTALLED_DEPS}}', installedDeps)
      .replace('{{PROJECT_TYPE}}', projectType)
      .replace('{{SOURCE_CODE}}', sourceCode);
  }

  if (category === 'MCP') {
    const server = projectInfo.mcp.servers.find((s) =>
      feature.mcpTools.some((t) => s.tools?.some((st) => st.name === t) || s.name === t),
    );
    user = user
      .replace('{{SERVER_NAME}}', server?.name ?? 'unknown')
      .replace('{{TRANSPORT}}', server?.transport ?? 'stdio')
      .replace('{{COMMAND}}', server ? `${server.command} ${server.args.join(' ')}` : 'unknown')
      .replace(
        '{{TOOLS}}',
        server?.tools?.map((t) => `${t.name}: ${t.description}`).join('\n') ||
        feature.mcpTools.join(', '),
      );
  }

  return { system: template.system, user };
}

export async function buildIntegrationPrompt(
  projectInfo: ProjectInfo,
  config: Config,
): Promise<{ system: string; user: string }> {
  const template = integrationTemplate;
  const featuresSummary = projectInfo.features
    .map((f) => `- ${f.name}: ${f.description}`)
    .join('\n');
  const endpoints = projectInfo.backend.endpoints
    .map((e) => `${e.method} ${e.path}`)
    .join('\n');
  const routes = projectInfo.frontend.routes.join(', ');

  // Read a few key files for context
  const keyFiles = projectInfo.files
    .filter((f) => f.type === 'route' || f.type === 'controller')
    .slice(0, 5);
  let sourceCode = '';
  for (const f of keyFiles) {
    try {
      const content = await fs.readFile(f.path, 'utf-8');
      sourceCode += `--- ${f.relativePath} ---\n${content.slice(0, 5000)}\n\n`;
    } catch {
      // skip
    }
  }

  const user = template.userTemplate
    .replace('{{FEATURES_SUMMARY}}', featuresSummary || 'none')
    .replace('{{PROJECT_FRAMEWORK}}', projectInfo.frontend.framework ?? 'unknown')
    .replace('{{BACKEND_FRAMEWORK}}', projectInfo.backend.framework ?? 'unknown')
    .replace('{{TEST_RUNNER}}', projectInfo.detectedTestRunner ?? 'vitest')
    .replace('{{ENDPOINTS}}', endpoints || 'none')
    .replace('{{ROUTES}}', routes || 'none')
    .replace('{{SOURCE_CODE}}', sourceCode || '(No source code available)');

  return { system: template.system, user };
}
