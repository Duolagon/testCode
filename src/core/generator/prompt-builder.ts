import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { TestCategory } from '../../utils/constants.js';
import type { ProjectInfo, FeatureEntry } from '../analyzer/types.js';
import type { Config } from '../../config/types.js';
import { analyzeCodeInsight, insightToTestGuidance } from '../analyzer/code-insight.js';
import { frontendTemplate } from './templates/frontend.js';
import { backendTemplate } from './templates/backend.js';
import { webuiTemplate } from './templates/webui.js';
import { mcpTemplate } from './templates/mcp.js';
import { integrationTemplate } from './templates/integration.js';
import { compatibilityTemplate } from './templates/compatibility.js';
import { performanceTemplate } from './templates/performance.js';
import { requirementFrontendTemplate, requirementBackendTemplate, requirementWebuiTemplate } from './templates/requirement.js';
import type { RequirementItem } from '../analyzer/requirement-parser.js';
import { defaultConfig } from '../../config/defaults.js';

const MAX_SOURCE_CHARS = 200_000; // ~50K tokens
const MAX_PER_FILE_CHARS = 20_000; // 单文件最大字符数，防止少量大文件占满上下文

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

/** 模板占位符常量，避免魔法字符串拼写错误 */
const PLACEHOLDERS = {
  FEATURE_NAME: '{{FEATURE_NAME}}',
  FEATURE_DESC: '{{FEATURE_DESC}}',
  SOURCE_CODE: '{{SOURCE_CODE}}',
  PROJECT_FRAMEWORK: '{{PROJECT_FRAMEWORK}}',
  BACKEND_FRAMEWORK: '{{BACKEND_FRAMEWORK}}',
  TEST_RUNNER: '{{TEST_RUNNER}}',
  ROUTES: '{{ROUTES}}',
  BASE_URL: '{{BASE_URL}}',
  EXISTING_TESTS: '{{EXISTING_TESTS}}',
  ENDPOINTS: '{{ENDPOINTS}}',
  INSTALLED_DEPS: '{{INSTALLED_DEPS}}',
  PROJECT_TYPE: '{{PROJECT_TYPE}}',
  SERVER_NAME: '{{SERVER_NAME}}',
  TRANSPORT: '{{TRANSPORT}}',
  COMMAND: '{{COMMAND}}',
  TOOLS: '{{TOOLS}}',
  FEATURES_SUMMARY: '{{FEATURES_SUMMARY}}',
  ACCEPTANCE_CRITERIA: '{{ACCEPTANCE_CRITERIA}}',
  UI_SPECS: '{{UI_SPECS}}',
  API_SPECS: '{{API_SPECS}}',
  SOURCE_CODE_SECTION: '{{SOURCE_CODE_SECTION}}',
} as const;

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
): Promise<{ source: string; guidance: string }> {
  const filePaths: string[] = [
    ...feature.frontendComponents,
    ...projectInfo.backend.endpoints
      .filter((e) => feature.backendEndpoints.includes(`${e.method} ${e.path}`))
      .map((e) => e.filePath),
  ];

  let totalChars = 0;
  const snippets: string[] = [];
  const guidanceParts: string[] = [];

  for (const relPath of filePaths) {
    if (totalChars >= MAX_SOURCE_CHARS) break;
    try {
      const absPath = path.resolve(projectInfo.projectPath, relPath);
      // 防止路径遍历攻击：确保解析后的路径仍在项目目录内
      if (!absPath.startsWith(projectInfo.projectPath + path.sep) && absPath !== projectInfo.projectPath) {
        continue;
      }
      let content = await fs.readFile(absPath, 'utf-8');

      // 代码洞察分析：提取分支、错误路径、边界条件
      const insight = analyzeCodeInsight(content, relPath);
      if (insight.complexity > 0) {
        guidanceParts.push(insightToTestGuidance(insight, relPath));
      }

      // 先限制单文件大小
      if (content.length > MAX_PER_FILE_CHARS) {
        content = content.slice(0, MAX_PER_FILE_CHARS) + '\n... (truncated, file too large)';
      }
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

  return {
    source: snippets.join('\n\n') || '(No source code available)',
    guidance: guidanceParts.join('\n\n'),
  };
}

export async function buildPrompt(
  feature: FeatureEntry,
  category: TestCategory,
  projectInfo: ProjectInfo,
  config: Config,
): Promise<{ system: string; user: string }> {
  const template = getTemplate(category);
  const { source: sourceCode, guidance } = await readSourceSnippets(feature, projectInfo);

  // 将代码洞察注入 prompt，指导 AI 针对具体分支和错误路径生成测试
  const guidanceBlock = guidance
    ? `\n\n--- CODE ANALYSIS (Use this to ensure comprehensive branch coverage) ---\n${guidance}\n--- END CODE ANALYSIS ---`
    : '';

  let user = template.userTemplate
    .replace(PLACEHOLDERS.FEATURE_NAME, feature.name)
    .replace(PLACEHOLDERS.FEATURE_DESC, feature.description)
    .replace(PLACEHOLDERS.SOURCE_CODE, sourceCode + guidanceBlock);

  // Category-specific replacements
  if (category === 'Frontend' || category === 'WebUI') {
    user = user
      .replace(PLACEHOLDERS.PROJECT_FRAMEWORK, projectInfo.frontend.framework ?? 'unknown')
      .replace(PLACEHOLDERS.TEST_RUNNER, projectInfo.detectedTestRunner ?? 'vitest')
      .replace(PLACEHOLDERS.ROUTES, projectInfo.frontend.routes.join(', ') || 'none')
      .replace(PLACEHOLDERS.BASE_URL, config.webui.baseUrl)
      .replace(PLACEHOLDERS.EXISTING_TESTS, '');
  }

  if (category === 'Backend') {
    const installedDeps = getInstalledDeps(projectInfo.packageJson);
    const projectType = detectProjectType(projectInfo.packageJson);

    user = user
      .replace(PLACEHOLDERS.BACKEND_FRAMEWORK, projectInfo.backend.framework ?? 'unknown')
      .replace(PLACEHOLDERS.TEST_RUNNER, projectInfo.detectedTestRunner ?? 'vitest')
      .replace(PLACEHOLDERS.ENDPOINTS, feature.backendEndpoints.join('\n') || 'none')
      .replace(PLACEHOLDERS.INSTALLED_DEPS, installedDeps)
      .replace(PLACEHOLDERS.PROJECT_TYPE, projectType)
      .replace(PLACEHOLDERS.EXISTING_TESTS, '');
  }

  if (category === 'Compatibility' || category === 'Performance') {
    const installedDeps = getInstalledDeps(projectInfo.packageJson);
    const projectType = detectProjectType(projectInfo.packageJson);

    user = user
      .replace(PLACEHOLDERS.FEATURE_DESC, feature.description)
      .replace(PLACEHOLDERS.TEST_RUNNER, projectInfo.detectedTestRunner ?? 'vitest')
      .replace(PLACEHOLDERS.INSTALLED_DEPS, installedDeps)
      .replace(PLACEHOLDERS.PROJECT_TYPE, projectType)
      .replace(PLACEHOLDERS.SOURCE_CODE, sourceCode);
  }

  if (category === 'MCP') {
    const server = projectInfo.mcp.servers.find((s) =>
      feature.mcpTools.some((t) => s.tools?.some((st) => st.name === t) || s.name === t),
    );
    user = user
      .replace(PLACEHOLDERS.SERVER_NAME, server?.name ?? 'unknown')
      .replace(PLACEHOLDERS.TRANSPORT, server?.transport ?? 'stdio')
      .replace(PLACEHOLDERS.COMMAND, server ? `${server.command} ${server.args.join(' ')}` : 'unknown')
      .replace(
        PLACEHOLDERS.TOOLS,
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
    .replace(PLACEHOLDERS.FEATURES_SUMMARY, featuresSummary || 'none')
    .replace(PLACEHOLDERS.PROJECT_FRAMEWORK, projectInfo.frontend.framework ?? 'unknown')
    .replace(PLACEHOLDERS.BACKEND_FRAMEWORK, projectInfo.backend.framework ?? 'unknown')
    .replace(PLACEHOLDERS.TEST_RUNNER, projectInfo.detectedTestRunner ?? 'vitest')
    .replace(PLACEHOLDERS.ENDPOINTS, endpoints || 'none')
    .replace(PLACEHOLDERS.ROUTES, routes || 'none')
    .replace(PLACEHOLDERS.SOURCE_CODE, sourceCode || '(No source code available)');

  return { system: template.system, user };
}

/**
 * 扫描文件的 export 语句，提取导出名和函数签名
 */
async function scanExports(absPath: string): Promise<{ name: string; signature: string }[]> {
  try {
    const content = await fs.readFile(absPath, 'utf-8');
    const exports: { name: string; signature: string }[] = [];

    // export function foo(...) / export async function foo(...)
    for (const m of content.matchAll(/export\s+(async\s+)?function\s+(\w+)\s*(<[^>]*>)?\s*\(([^)]*)\)(?:\s*:\s*([^\n{]+))?/g)) {
      const name = m[2];
      const params = m[4].replace(/\s+/g, ' ').trim();
      const returnType = m[5]?.trim() || 'unknown';
      exports.push({ name, signature: `${name}(${params}): ${returnType}` });
    }
    // export const foo = ... (简化 — 只记录名字)
    for (const m of content.matchAll(/export\s+(?:const|let|var)\s+(\w+)/g)) {
      if (!exports.some(e => e.name === m[1])) {
        exports.push({ name: m[1], signature: m[1] });
      }
    }
    // export class Foo
    for (const m of content.matchAll(/export\s+class\s+(\w+)/g)) {
      exports.push({ name: m[1], signature: `class ${m[1]}` });
    }
    // export { foo, bar }
    for (const m of content.matchAll(/export\s*\{([^}]+)\}/g)) {
      for (const item of m[1].split(',')) {
        const clean = item.trim().split(/\s+as\s+/)[0].trim();
        if (clean && !clean.startsWith('type ') && !exports.some(e => e.name === clean)) {
          exports.push({ name: clean, signature: clean });
        }
      }
    }

    return exports;
  } catch {
    return [];
  }
}

/**
 * 生成项目文件地图 + 导出函数签名
 * 输出格式：
 *   ../src/core/analyzer/index.js
 *     - analyzeProject(projectPath: string, config: Config): Promise<ProjectInfo>
 *     - ...
 */
async function buildProjectFileMap(projectInfo: ProjectInfo): Promise<string> {
  const sourceFiles = projectInfo.files
    .filter(f => (f.language === 'ts' || f.language === 'js' || f.language === 'tsx' || f.language === 'jsx'))
    .filter(f => f.type !== 'test' && f.type !== 'config' && f.type !== 'style')
    .slice(0, 50); // 最多 50 个文件避免 prompt 过长

  const lines: string[] = [];
  for (const f of sourceFiles) {
    const exports = await scanExports(f.path);
    if (exports.length === 0) continue; // 跳过无导出的文件
    // 转为 test 文件中的 import 路径：../src/... 去掉 .ts 加 .js
    const importPath = '../' + f.relativePath.replace(/\.tsx?$/, '.js');
    lines.push(`${importPath}`);
    for (const exp of exports) {
      lines.push(`  - ${exp.signature}`);
    }
  }

  return lines.join('\n') || '(no source files found)';
}

/**
 * 需求驱动模式的 prompt 构建
 * 根据需求文档的功能点生成测试用例
 */
export async function buildRequirementPrompt(
  feature: FeatureEntry & { _requirementContext?: { acceptanceCriteria: string[]; uiSpecs: string[]; apiSpecs: string[]; priority: string | null } },
  category: TestCategory,
  projectInfo: ProjectInfo,
  config: Config,
): Promise<{ system: string; user: string }> {
  const reqCtx = feature._requirementContext;

  // 选择需求驱动模板
  const template = category === 'Backend'
    ? requirementBackendTemplate
    : category === 'WebUI'
      ? requirementWebuiTemplate
      : requirementFrontendTemplate;

  // 尝试读取源代码（如果项目中已有代码）
  const { source: sourceCode, guidance } = await readSourceSnippets(feature, projectInfo);
  const hasSourceCode = sourceCode !== '(No source code available)';

  // 构建项目文件地图：告诉 AI 项目中有哪些模块和导出
  const fileMap = await buildProjectFileMap(projectInfo);

  const sourceCodeSection = hasSourceCode
    ? `Source code of relevant files (test the REAL code):\n${sourceCode}${guidance ? `\n\n--- CODE ANALYSIS ---\n${guidance}\n--- END CODE ANALYSIS ---` : ''}`
    : '(No source code available yet — generate TDD-style test shells that describe expected behavior)';

  // 读取核心类型定义，让 AI 知道参数结构
  let typeSnippets = '';
  try {
    // intentionally no variable needed — typeFiles iterates directly
    const typeFiles = projectInfo.files
      .filter(f => f.relativePath.endsWith('types.ts') && !f.relativePath.includes('node_modules'))
      .slice(0, 5);
    for (const tf of typeFiles) {
      const content = await fs.readFile(tf.path, 'utf-8');
      if (content.length < 3000) {
        typeSnippets += `\n--- ${tf.relativePath} ---\n${content}\n`;
      }
    }
  } catch {
    // skip
  }

  // 生成 defaultConfig 的 JSON 表示，供 AI 作为 mock 基础
  const configSnapshot = JSON.stringify(defaultConfig, null, 2);
  const mockProjectInfo = JSON.stringify({
    projectPath: '/test-project',
    packageJson: { name: 'test', dependencies: {}, devDependencies: { vitest: '^1.0.0' } },
    files: [],
    frontend: { framework: null, routes: [], components: [], pages: [] },
    backend: { framework: null, endpoints: [], models: [], middleware: [] },
    mcp: { servers: [] },
    features: [],
    detectedTestRunner: 'vitest',
  }, null, 2);

  const mockSection = `\n--- DEFAULT CONFIG (use as base for mock Config objects — spread and override) ---
const DEFAULT_CONFIG = ${configSnapshot};
--- END DEFAULT CONFIG ---

--- MOCK ProjectInfo TEMPLATE (use as base for mock ProjectInfo objects) ---
const MOCK_PROJECT_INFO = ${mockProjectInfo};
--- END MOCK ProjectInfo ---\n`;

  const typeSection = typeSnippets
    ? `\n--- KEY TYPE DEFINITIONS (use these to construct correct function parameters) ---${typeSnippets}--- END TYPE DEFINITIONS ---\n${mockSection}`
    : mockSection;

  // 将文件地图 + 类型定义注入到源码区块中
  const sourceWithFileMap = `--- PROJECT FILE MAP (use these EXACT import paths and function signatures) ---\n${fileMap}\n--- END FILE MAP ---\n${typeSection}\n${sourceCodeSection}`;

  const installedDeps = getInstalledDeps(projectInfo.packageJson);
  const projectType = detectProjectType(projectInfo.packageJson);

  let user = template.userTemplate
    .replace(PLACEHOLDERS.FEATURE_NAME, feature.name)
    .replace(PLACEHOLDERS.FEATURE_DESC, feature.description)
    .replace(PLACEHOLDERS.ACCEPTANCE_CRITERIA, reqCtx?.acceptanceCriteria.map((ac, i) => `${i + 1}. ${ac}`).join('\n') || '(none specified)')
    .replace(PLACEHOLDERS.UI_SPECS, reqCtx?.uiSpecs.join('\n') || '(none specified)')
    .replace(PLACEHOLDERS.API_SPECS, reqCtx?.apiSpecs.join('\n') || '(none specified)')
    .replace(PLACEHOLDERS.SOURCE_CODE_SECTION, sourceWithFileMap)
    .replace(PLACEHOLDERS.TEST_RUNNER, projectInfo.detectedTestRunner ?? 'vitest')
    .replace(PLACEHOLDERS.INSTALLED_DEPS, installedDeps)
    .replace(PLACEHOLDERS.EXISTING_TESTS, '');

  if (category === 'Frontend') {
    user = user
      .replace(PLACEHOLDERS.PROJECT_FRAMEWORK, projectInfo.frontend.framework ?? 'unknown');
  }

  if (category === 'WebUI') {
    user = user
      .replace(PLACEHOLDERS.PROJECT_FRAMEWORK, projectInfo.frontend.framework ?? 'unknown')
      .replace(PLACEHOLDERS.BASE_URL, config.webui.baseUrl)
      .replace(PLACEHOLDERS.ROUTES, projectInfo.frontend.routes.join(', ') || 'none');
  }

  if (category === 'Backend') {
    user = user
      .replace(PLACEHOLDERS.BACKEND_FRAMEWORK, projectInfo.backend.framework ?? 'unknown')
      .replace(PLACEHOLDERS.PROJECT_TYPE, projectType);
  }

  return { system: template.system, user };
}
