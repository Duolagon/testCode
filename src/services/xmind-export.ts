import JSZip from 'jszip';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { TestCase } from '../core/generator/types.js';

/**
 * XMind content.json 数据结构
 * XMind 8+ / Zen 格式: ZIP 包内含 content.json + metadata.json
 */

interface XMindTopic {
  id: string;
  class: string;
  title: string;
  children?: { attached: XMindTopic[] };
  markers?: { markerId: string }[];
  notes?: { plain: { content: string } };
  labels?: string[];
}

interface XMindSheet {
  id: string;
  class: string;
  title: string;
  rootTopic: XMindTopic;
}

let idCounter = 0;
function genId(): string {
  return `topic_${Date.now()}_${++idCounter}`;
}

function makeTopic(title: string, children?: XMindTopic[], opts?: {
  markers?: { markerId: string }[];
  notes?: string;
  labels?: string[];
}): XMindTopic {
  const topic: XMindTopic = {
    id: genId(),
    class: 'topic',
    title,
  };
  if (children && children.length > 0) {
    topic.children = { attached: children };
  }
  if (opts?.markers) topic.markers = opts.markers;
  if (opts?.notes) topic.notes = { plain: { content: opts.notes } };
  if (opts?.labels) topic.labels = opts.labels;
  return topic;
}

/**
 * 根据 category 返回 XMind marker（优先级图标）
 */
function categoryMarker(category: string): { markerId: string }[] {
  const map: Record<string, string> = {
    Frontend: 'priority-1',
    Backend: 'priority-2',
    WebUI: 'priority-3',
    MCP: 'priority-4',
    Integration: 'priority-5',
    Compatibility: 'priority-6',
    Performance: 'priority-7',
  };
  const markerId = map[category];
  return markerId ? [{ markerId }] : [];
}

/**
 * 将 TestCase 数组转换为 XMind 格式并写入 .xmind 文件
 *
 * 结构：
 * 根节点: "项目名 - 测试用例 - 日期"
 *   ├── Feature A
 *   │   ├── [Frontend] 测试用例 1
 *   │   │   ├── 前置条件
 *   │   │   ├── 测试步骤
 *   │   │   │   ├── Step 1
 *   │   │   │   └── Step 2
 *   │   │   └── 预期结果
 *   │   └── [Backend] 测试用例 2
 *   └── Feature B
 */
export async function exportTestCasesToXMind(
  cases: TestCase[],
  outputDir: string,
  projectName: string,
): Promise<string> {
  // 按 feature 分组
  const featureMap = new Map<string, TestCase[]>();
  for (const tc of cases) {
    const list = featureMap.get(tc.feature) || [];
    list.push(tc);
    featureMap.set(tc.feature, list);
  }

  const dateStr = new Date().toISOString().slice(0, 10);

  // 构建 feature 子节点
  const featureTopics: XMindTopic[] = [];
  for (const [featureName, featureCases] of featureMap) {
    const caseTopics: XMindTopic[] = featureCases.map(tc => {
      const children: XMindTopic[] = [];

      // 前置条件
      if (tc.preconditions.length > 0) {
        children.push(makeTopic(
          'Preconditions',
          tc.preconditions.map(p => makeTopic(p)),
        ));
      }

      // 测试步骤
      if (tc.steps.length > 0) {
        children.push(makeTopic(
          'Steps',
          tc.steps.map((s, i) => makeTopic(`${i + 1}. ${s}`)),
        ));
      }

      // 预期结果
      if (tc.expectedResult) {
        children.push(makeTopic('Expected: ' + tc.expectedResult));
      }

      return makeTopic(
        `[${tc.category}] ${tc.description}`,
        children,
        {
          markers: categoryMarker(tc.category),
          labels: [tc.caseId],
          notes: tc.testCode ? `Test Code:\n${tc.testCode}` : undefined,
        },
      );
    });

    featureTopics.push(makeTopic(
      `${featureName} (${featureCases.length})`,
      caseTopics,
    ));
  }

  // 根节点
  const rootTopic = makeTopic(
    `${projectName} - Test Cases - ${dateStr}`,
    featureTopics,
  );

  const sheet: XMindSheet = {
    id: genId(),
    class: 'sheet',
    title: 'Test Cases',
    rootTopic,
  };

  const content = JSON.stringify([sheet]);

  const metadata = JSON.stringify({
    creator: {
      name: 'AI Test Tool',
      version: '0.1.0',
    },
  });

  const manifest = JSON.stringify({
    'file-entries': {
      'content.json': {},
      'metadata.json': {},
    },
  });

  // 创建 ZIP (XMind 文件)
  const zip = new JSZip();
  zip.file('content.json', content);
  zip.file('metadata.json', metadata);
  zip.file('manifest.json', manifest);

  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
    compressionOptions: { level: 6 },
  });

  // 写入文件
  const casesDir = path.join(outputDir, 'test-cases');
  await fs.mkdir(casesDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const filename = `${projectName}-${timestamp}.xmind`;
  const filePath = path.join(casesDir, filename);

  await fs.writeFile(filePath, buffer);
  return filePath;
}
