import type { Config } from '../../config/types.js';
import type { ProjectInfo, FeatureEntry } from '../analyzer/types.js';
import type { TestCategory } from '../../utils/constants.js';
import type { TestCase, GeneratedBatch } from './types.js';
import type { AIClient } from '../../services/ai-client.js';
import { createAIClient } from '../../services/ai-client-factory.js';
import { buildPrompt, buildIntegrationPrompt } from './prompt-builder.js';
import { parseCases } from './case-parser.js';
import * as p from '@clack/prompts';
import { marked } from 'marked';
import TerminalRenderer from 'marked-terminal';
import pLimit from 'p-limit';
import os from 'node:os';
import cliProgress from 'cli-progress';

marked.setOptions({
  renderer: new TerminalRenderer() as any
});

export async function* generateTestCases(
  projectInfo: ProjectInfo,
  config: Config,
  existingClient?: AIClient,
): AsyncGenerator<GeneratedBatch> {
  const client = existingClient ?? await createAIClient(config);
  p.log.info(`使用 ${client.provider} 模型: ${client.model}`);

  // 基于 CPU 核心数动态调整并发 (预留一个核，最少为1，最大暂定10防风控)
  const cpuCount = os.cpus().length;
  const concurrency = Math.max(1, Math.min(cpuCount, 10));
  p.log.info(`🚀 启动动态并发引擎 (并发度: ${concurrency})`);
  const limit = pLimit(concurrency);

  const tasks: Array<{ feature: FeatureEntry, category: TestCategory }> = [];
  for (const feature of projectInfo.features) {
    for (const category of feature.applicableCategories) {
      tasks.push({ feature, category });
    }
  }

  const progressBar = new cliProgress.SingleBar({
    format: 'AI 用例生成进度 | {bar} | {percentage}% || {value}/{total} 任务 || 当前: {currentTask}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  if (tasks.length > 0) {
    progressBar.start(tasks.length, 0, { currentTask: '初始化...' });
  }

  // 并发派发任务，不阻塞地搜集结果 Promise
  const taskPromises = tasks.map(({ feature, category }) => limit(async () => {
    progressBar.update({ currentTask: `正在生成 ${feature.name} [${category}]` });
    try {
      const prompt = await buildPrompt(feature, category, projectInfo, config);
      let fullText = '';
      let usage: any;

      // 静默流式读取，不再输出到控制台打字机效果
      const stream = client.generateStream(prompt);
      while (true) {
        const { value, done } = await stream.next();
        if (done) {
          usage = value.usage;
          break;
        }
        if (typeof value === 'string') {
          fullText += value;
        }
      }

      const cases = parseCases(fullText, feature.name, category, projectInfo.detectedTestRunner ?? 'vitest');

      progressBar.increment();
      return {
        featureId: feature.id,
        featureName: feature.name,
        category,
        cases,
        usage,
        success: cases.length > 0
      } as GeneratedBatch & { success: boolean };
    } catch (error) {
      progressBar.increment();
      return {
        featureId: feature.id,
        featureName: feature.name,
        category,
        cases: [],
        success: false,
        error: error instanceof Error ? error.message : String(error)
      } as GeneratedBatch & { success: boolean, error?: string };
    }
  }));

  // 流式 yield 已完成的任务
  for (const promise of taskPromises) {
    const result = await promise;
    yield result;
  }

  if (tasks.length > 0) {
    progressBar.stop();
    p.log.success('所有测试用例批量生成完毕！');
  }
}

export async function generateIntegrationCases(
  projectInfo: ProjectInfo,
  config: Config,
  existingClient?: AIClient,
): Promise<{ cases: TestCase[]; usage?: any }> {
  const client = existingClient ?? await createAIClient(config);

  const s = p.spinner();
  s.start('正在为全局架构生成集成测试用例...');

  try {
    const prompt = await buildIntegrationPrompt(projectInfo, config);
    let fullText = '';
    let usage: any;

    const stream = client.generateStream(prompt);
    while (true) {
      const { value, done } = await stream.next();
      if (done) {
        usage = value.usage;
        break;
      }
      if (typeof value === 'string') {
        fullText += value;
      }
    }

    const cases = parseCases(fullText, 'Integration', 'Frontend', projectInfo.detectedTestRunner ?? 'vitest');

    if (cases.length > 0) {
      s.stop(`生成了 ${cases.length} 个集成测试用例 ✅`);
    } else {
      s.stop('未能生成有效的集成测试用例 ⚠️');
    }
    return { cases, usage };
  } catch (error) {
    s.stop('集成测试用例生成失败 ❌');
    p.log.error(`错误: ${error instanceof Error ? error.message : String(error)}`);
    return { cases: [] };
  }
}

export type { TestCase, GeneratedBatch } from './types.js';
