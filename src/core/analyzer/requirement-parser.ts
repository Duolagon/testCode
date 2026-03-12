import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { FeatureEntry } from './types.js';
import type { TestCategory } from '../../utils/constants.js';

/**
 * 需求文档中的一个功能点
 */
export interface RequirementItem {
  /** 功能名称 */
  name: string;
  /** 功能描述 */
  description: string;
  /** 验收标准 */
  acceptanceCriteria: string[];
  /** UI 相关描述（页面、组件、交互） */
  uiSpecs: string[];
  /** API 接口描述 */
  apiSpecs: string[];
  /** 优先级 */
  priority: 'P0' | 'P1' | 'P2' | 'P3' | null;
}

/**
 * 解析后的需求文档
 */
export interface RequirementSpec {
  /** 文档标题 / 项目名 */
  title: string;
  /** 文档原始路径 */
  filePath: string;
  /** 原始文本（用于注入 prompt） */
  rawContent: string;
  /** 解析出的功能点 */
  items: RequirementItem[];
}

/**
 * 读取并解析需求文档
 * 支持 Markdown 格式
 */
export async function parseRequirementDoc(filePath: string): Promise<RequirementSpec> {
  const absPath = path.resolve(filePath);
  const content = await fs.readFile(absPath, 'utf-8');
  const ext = path.extname(absPath).toLowerCase();

  if (ext === '.json') {
    return parseJsonSpec(content, absPath);
  }

  // 默认按 Markdown 解析
  return parseMarkdownSpec(content, absPath);
}

/**
 * 解析 JSON 格式需求文档
 */
function parseJsonSpec(content: string, filePath: string): RequirementSpec {
  const data = JSON.parse(content);

  // 支持两种 JSON 格式：
  // 1. { title, items: [...] } 直接结构
  // 2. { features: [...] } 简化结构
  if (data.items && Array.isArray(data.items)) {
    return {
      title: data.title || path.basename(filePath, path.extname(filePath)),
      filePath,
      rawContent: content,
      items: data.items.map(normalizeJsonItem),
    };
  }

  if (data.features && Array.isArray(data.features)) {
    return {
      title: data.title || path.basename(filePath, path.extname(filePath)),
      filePath,
      rawContent: content,
      items: data.features.map(normalizeJsonItem),
    };
  }

  throw new Error(`Invalid JSON requirement format: expected "items" or "features" array`);
}

function normalizeJsonItem(item: any): RequirementItem {
  return {
    name: item.name || item.title || 'Unnamed Feature',
    description: item.description || item.desc || '',
    acceptanceCriteria: Array.isArray(item.acceptanceCriteria)
      ? item.acceptanceCriteria
      : Array.isArray(item.ac)
        ? item.ac
        : [],
    uiSpecs: Array.isArray(item.uiSpecs) ? item.uiSpecs : Array.isArray(item.ui) ? item.ui : [],
    apiSpecs: Array.isArray(item.apiSpecs)
      ? item.apiSpecs
      : Array.isArray(item.api)
        ? item.api
        : [],
    priority: parsePriority(item.priority),
  };
}

/**
 * 解析 Markdown 格式需求文档
 *
 * 支持的结构：
 * # 项目标题
 * ## 功能名称
 * 描述文本...
 * ### 验收标准 / Acceptance Criteria
 * - 条件1
 * - 条件2
 * ### UI 规格 / 页面设计
 * - 描述1
 * ### API 接口 / 接口设计
 * - GET /api/users - 获取用户列表
 */
function parseMarkdownSpec(content: string, filePath: string): RequirementSpec {
  const lines = content.split('\n');
  let title = path.basename(filePath, path.extname(filePath));
  const items: RequirementItem[] = [];

  let currentItem: RequirementItem | null = null;
  let currentSection: 'description' | 'ac' | 'ui' | 'api' | null = null;
  let descLines: string[] = [];

  for (const line of lines) {
    const trimmed = line.trim();

    // # 一级标题 → 文档标题
    if (/^# (?!#)/.test(trimmed)) {
      title = trimmed.replace(/^# /, '').trim();
      continue;
    }

    // ## 二级标题 → 新的功能点
    if (/^## (?!#)/.test(trimmed)) {
      // 保存上一个 item
      if (currentItem) {
        if (descLines.length > 0 && !currentItem.description) {
          currentItem.description = descLines.join('\n').trim();
        }
        items.push(currentItem);
      }

      const headerText = trimmed.replace(/^## /, '').trim();
      const priority = extractPriority(headerText);

      currentItem = {
        name: headerText.replace(/\s*[\[（(]?P[0-3][\]）)]?\s*/gi, '').trim(),
        description: '',
        acceptanceCriteria: [],
        uiSpecs: [],
        apiSpecs: [],
        priority,
      };
      currentSection = 'description';
      descLines = [];
      continue;
    }

    // ### 三级标题 → 子段落分类
    if (/^### /.test(trimmed) && currentItem) {
      // 先保存之前积累的描述
      if (currentSection === 'description' && descLines.length > 0 && !currentItem.description) {
        currentItem.description = descLines.join('\n').trim();
        descLines = [];
      }

      const sectionName = trimmed.replace(/^### /, '').toLowerCase();
      if (matchesSection(sectionName, ['验收标准', 'acceptance criteria', 'ac', '验收条件', '预期结果'])) {
        currentSection = 'ac';
      } else if (matchesSection(sectionName, ['ui', '页面', '界面', '交互', 'design', '设计', '组件'])) {
        currentSection = 'ui';
      } else if (matchesSection(sectionName, ['api', '接口', 'endpoint', 'http', '服务端', '后端'])) {
        currentSection = 'api';
      } else {
        currentSection = 'description';
      }
      continue;
    }

    // 列表项 (- 或 *)
    if (/^[-*]\s+/.test(trimmed) && currentItem) {
      const itemText = trimmed.replace(/^[-*]\s+/, '').trim();
      if (!itemText) continue;

      switch (currentSection) {
        case 'ac':
          currentItem.acceptanceCriteria.push(itemText);
          break;
        case 'ui':
          currentItem.uiSpecs.push(itemText);
          break;
        case 'api':
          currentItem.apiSpecs.push(itemText);
          break;
        case 'description':
          descLines.push(itemText);
          break;
      }
      continue;
    }

    // 有序列表 (1. 2. 3.)
    if (/^\d+\.\s+/.test(trimmed) && currentItem) {
      const itemText = trimmed.replace(/^\d+\.\s+/, '').trim();
      if (!itemText) continue;

      switch (currentSection) {
        case 'ac':
          currentItem.acceptanceCriteria.push(itemText);
          break;
        case 'ui':
          currentItem.uiSpecs.push(itemText);
          break;
        case 'api':
          currentItem.apiSpecs.push(itemText);
          break;
        case 'description':
          descLines.push(itemText);
          break;
      }
      continue;
    }

    // 普通文本行 → 追加到当前 section
    if (trimmed && currentItem && currentSection === 'description') {
      descLines.push(trimmed);
    }
  }

  // 保存最后一个 item
  if (currentItem) {
    if (descLines.length > 0 && !currentItem.description) {
      currentItem.description = descLines.join('\n').trim();
    }
    items.push(currentItem);
  }

  return { title, filePath, rawContent: content, items };
}

/**
 * 将需求文档的功能点转换为 FeatureEntry（供生成器使用）
 */
export function requirementToFeatures(spec: RequirementSpec): FeatureEntry[] {
  return spec.items.map((item, index) => {
    const categories = inferCategories(item);

    return {
      id: `req-${String(index + 1).padStart(3, '0')}`,
      name: item.name,
      description: item.description || item.name,
      frontendComponents: [],
      backendEndpoints: item.apiSpecs,
      mcpTools: [],
      applicableCategories: categories,
      // 扩展字段：需求上下文（附加到 FeatureEntry 上，prompt-builder 会用到）
      _requirementContext: {
        acceptanceCriteria: item.acceptanceCriteria,
        uiSpecs: item.uiSpecs,
        apiSpecs: item.apiSpecs,
        priority: item.priority,
      },
    } as FeatureEntry & { _requirementContext: any };
  });
}

/**
 * 根据需求内容推断测试类别
 */
function inferCategories(item: RequirementItem): TestCategory[] {
  const categories: TestCategory[] = [];

  const hasUI = item.uiSpecs.length > 0 ||
    /页面|组件|按钮|表单|弹窗|列表|输入|显示|界面|前端|render|component|page|form|button|modal|dialog|display|ui/i
      .test(item.description + ' ' + item.acceptanceCriteria.join(' '));

  const hasAPI = item.apiSpecs.length > 0 ||
    /api|接口|http|get|post|put|delete|endpoint|请求|响应|返回|服务端|后端|server|request|response/i
      .test(item.description + ' ' + item.acceptanceCriteria.join(' '));

  if (hasUI) {
    categories.push('Frontend');
    // 有 UI 规格的同时生成 E2E 测试
    categories.push('WebUI');
  }
  if (hasAPI) {
    categories.push('Backend');
  }

  // 如果都没匹配到，默认前端
  if (categories.length === 0) {
    categories.push('Frontend');
  }

  return categories;
}

function matchesSection(name: string, keywords: string[]): boolean {
  return keywords.some((k) => name.includes(k));
}

function extractPriority(text: string): 'P0' | 'P1' | 'P2' | 'P3' | null {
  const match = text.match(/[\[（(]?(P[0-3])[\]）)]?/i);
  return match ? (match[1].toUpperCase() as 'P0' | 'P1' | 'P2' | 'P3') : null;
}

function parsePriority(val: unknown): 'P0' | 'P1' | 'P2' | 'P3' | null {
  if (typeof val !== 'string') return null;
  const upper = val.toUpperCase();
  if (['P0', 'P1', 'P2', 'P3'].includes(upper)) return upper as any;
  return null;
}
