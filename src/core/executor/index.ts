import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext } from './types.js';
import type { McpServerConfig } from '../analyzer/types.js';
import { FileService } from '../../services/file-service.js';
import { executeUnitTest, executeUnitTestWithRetry } from './unit-executor.js';
import { executeWebUITest } from './webui-executor.js';
import { executeMcpTest } from './mcp-executor.js';
import { executeIntegrationTest } from './integration-executor.js';
import { ResultCollector } from './result-collector.js';
import { logger } from '../../ui/logger.js';
import cliProgress from 'cli-progress';
import os from 'node:os';

/** 并发数使用 CPU 核心数动态决定 */
const DEFAULT_CONCURRENCY = Math.max(1, os.cpus().length);

/**
 * 并发池执行器：限制最大并发数，每个 task 完成后立即触发回调
 */
async function runWithConcurrency<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>,
  onComplete?: (result: R) => void,
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  async function runNext(): Promise<void> {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      const result = await fn(items[currentIndex]);
      results[currentIndex] = result;
      onComplete?.(result);
    }
  }

  // 启动 concurrency 个 worker 协程
  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => runNext(),
  );
  await Promise.all(workers);

  return results;
}

/**
 * 执行单条测试用例（根据 category 分发到对应执行器）
 */
async function executeSingleCase(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
  mcpServers: McpServerConfig[],
): Promise<TestResult> {
  switch (testCase.category) {
    case 'Frontend':
    case 'Backend':
    case 'Compatibility':
    case 'Performance':
      return executeUnitTestWithRetry(testCase, context, fileService);
    case 'WebUI':
      return executeWebUITest(testCase, context, fileService);
    case 'MCP':
      return executeMcpTest(testCase, context, mcpServers);
    default:
      return executeUnitTestWithRetry(testCase, context, fileService);
  }
}

export async function executeTestCases(
  cases: TestCase[],
  context: ExecutionContext,
  fileService: FileService,
  mcpServers: McpServerConfig[],
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<TestResult[]> {
  const collector = new ResultCollector();

  // 将用例分为可并行和需串行两组
  const parallelCases: TestCase[] = [];
  const serialCases: TestCase[] = [];

  for (const tc of cases) {
    if (tc.category === 'WebUI' || tc.category === 'MCP') {
      // WebUI 共享 dev server port，MCP 共享 server 进程 → 串行
      serialCases.push(tc);
    } else {
      // Unit/Backend/Frontend/Compatibility/Performance → 可并行
      parallelCases.push(tc);
    }
  }

  const progressBar = new cliProgress.SingleBar({
    format: '执行测试用例 | {bar} | {percentage}% || {value}/{total} 任务 || 正在运行: {currentTask}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  if (cases.length > 0) {
    progressBar.start(cases.length, 0, { currentTask: '初始化...' });
  }

  // 阶段 1: 并行执行独立测试
  if (parallelCases.length > 0) {
    await runWithConcurrency(
      parallelCases,
      concurrency,
      (tc) => {
        progressBar.update({ currentTask: tc.caseId });
        return executeSingleCase(tc, context, fileService, mcpServers);
      },
      (result) => {
        collector.add(result);
        progressBar.increment();
      },
    );
  }

  // 阶段 2: 串行执行有共享资源的测试
  if (serialCases.length > 0) {
    for (const testCase of serialCases) {
      progressBar.update({ currentTask: testCase.caseId });
      const result = await executeSingleCase(testCase, context, fileService, mcpServers);
      collector.add(result);
      progressBar.increment();
    }
  }

  if (cases.length > 0) {
    progressBar.stop();
  }

  return collector.getAll();
}

export async function executeIntegrationTests(
  cases: TestCase[],
  context: ExecutionContext,
  fileService: FileService,
  concurrency: number = DEFAULT_CONCURRENCY,
): Promise<TestResult[]> {
  const collector = new ResultCollector();

  logger.heading('Integration Tests');
  logger.info(`⚡ 并行执行 ${cases.length} 条集成测试用例 (concurrency=${concurrency})`);

  const progressBar = new cliProgress.SingleBar({
    format: '执行集成测试用例 | {bar} | {percentage}% || {value}/{total} 任务 || 正在运行: {currentTask}',
    barCompleteChar: '\u2588',
    barIncompleteChar: '\u2591',
    hideCursor: true
  });

  if (cases.length > 0) {
    progressBar.start(cases.length, 0, { currentTask: '初始化...' });
  }

  await runWithConcurrency(
    cases,
    concurrency,
    (tc) => {
      progressBar.update({ currentTask: tc.caseId });
      return executeIntegrationTest(tc, context, fileService);
    },
    (result) => {
      collector.add(result);
      progressBar.increment();
    },
  );

  if (cases.length > 0) {
    progressBar.stop();
  }

  return collector.getAll();
}

export { ResultCollector } from './result-collector.js';
export type { TestResult, ExecutionContext } from './types.js';

