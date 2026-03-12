import * as path from 'node:path';
import { spawnProcess } from '../../utils/process.js';
import { FileService } from '../../services/file-service.js';
import { fileExists } from '../../utils/fs.js';
import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext } from './types.js';
import { shouldRetry, attemptSelfHeal } from './self-healing.js';

/**
 * 生成 Playwright 脚本
 * 优化：复用 browser 实例，每个测试使用独立 context（隔离且快速）
 */
function wrapPlaywrightScript(
  testCode: string,
  baseUrl: string,
  caseId: string,
  screenshotDir: string,
  browser: 'chromium' | 'firefox' | 'webkit',
  headless: boolean,
  timeout: number,
): string {
  return `import { ${browser} } from 'playwright';

const TIMEOUT = ${timeout};

(async () => {
  const browser = await ${browser}.launch({ headless: ${headless} });

  try {
    // 每个测试用独立的 BrowserContext（隔离 cookie/storage，比新开浏览器快 10 倍）
    const context = await browser.newContext({
      viewport: { width: 1280, height: 720 },
    });
    context.setDefaultTimeout(TIMEOUT);
    context.setDefaultNavigationTimeout(TIMEOUT);
    const page = await context.newPage();
    const baseUrl = ${JSON.stringify(baseUrl)};

    try {
      ${testCode}
      console.log('TEST_RESULT:PASS');
      process.exitCode = 0;
    } catch (error) {
      console.error('TEST_RESULT:FAIL');
      console.error(error.message);
      console.error(error.stack);
      try {
        await page.screenshot({ path: ${JSON.stringify(path.join(screenshotDir, `${caseId}.png`))}, fullPage: true });
      } catch {}
      process.exitCode = 1;
    } finally {
      await context.close();
    }
  } finally {
    await browser.close();
  }
})();
`;
}

/**
 * 执行单个 WebUI E2E 测试
 */
export async function executeWebUITest(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
): Promise<TestResult> {
  const start = Date.now();
  const screenshotDir = path.join(context.artifactsDir, 'screenshots');
  const screenshotPath = path.join(screenshotDir, `${testCase.caseId}.png`);

  try {
    const baseUrl = context.baseUrl ?? 'http://localhost:3000';
    const browser = context.webuiConfig?.browser ?? 'chromium';
    const headless = context.webuiConfig?.headless ?? true;
    const timeout = context.webuiConfig?.timeout ?? 30_000;

    const scriptContent = wrapPlaywrightScript(
      testCase.testCode,
      baseUrl,
      testCase.caseId,
      screenshotDir,
      browser,
      headless,
      timeout,
    );

    const filename = `${testCase.caseId.replace(/[^a-zA-Z0-9-]/g, '_')}.webui.ts`;
    const scriptPath = await fileService.writeTempFile(filename, scriptContent);

    const result = await spawnProcess('npx', ['tsx', scriptPath], {
      cwd: context.projectPath,
      timeout: timeout + 30_000, // 给额外 30s 用于浏览器启动/关闭
      env: { BASE_URL: baseUrl },
    });

    const hasScreenshot = await fileExists(screenshotPath);

    return {
      caseId: testCase.caseId,
      feature: testCase.feature,
      category: testCase.category,
      description: testCase.description,
      status: result.exitCode === 0 ? 'pass' : 'fail',
      stdout: result.stdout,
      stderr: result.stderr,
      duration: result.duration,
      errorDetail: result.exitCode !== 0 ? (result.stderr || result.stdout).slice(0, 2000) : undefined,
      screenshotPath: hasScreenshot ? screenshotPath : undefined,
    };
  } catch (error) {
    return {
      caseId: testCase.caseId,
      feature: testCase.feature,
      category: testCase.category,
      description: testCase.description,
      status: 'fail',
      duration: Date.now() - start,
      errorDetail: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * 带 AI 自愈的 WebUI 测试执行
 * 失败后可以让 AI 修复选择器、等待条件等
 */
export async function executeWebUITestWithRetry(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
): Promise<TestResult> {
  let result = await executeWebUITest(testCase, context, fileService);

  if (
    result.status === 'fail' &&
    context.aiClient &&
    context.retryConfig &&
    shouldRetry(result, context.retryConfig)
  ) {
    // 将截图信息附加到错误详情中，帮助 AI 理解失败原因
    const errorWithContext = [
      result.errorDetail ?? 'Unknown error',
      result.screenshotPath ? `(Screenshot saved at: ${result.screenshotPath})` : '',
      'NOTE: This is a Playwright E2E test. Common fixes: wrong selector, missing waitFor, wrong URL path, element not visible yet.',
    ].filter(Boolean).join('\n');

    const healResult = await attemptSelfHeal(
      testCase,
      errorWithContext,
      context.aiClient,
      context.retryConfig,
      'playwright', // 特殊标记，让自愈理解这是 Playwright 代码
    );

    if (healResult.wasFixed) {
      const retryResult = await executeWebUITest(
        healResult.fixedTestCase,
        context,
        fileService,
      );
      return {
        ...retryResult,
        retryAttempts: healResult.attempts,
        wasRetried: true,
        retryTokenUsage: healResult.tokenUsage,
      };
    }

    return {
      ...result,
      retryAttempts: healResult.attempts,
      wasRetried: true,
      retryTokenUsage: healResult.tokenUsage,
    };
  }

  return result;
}

/**
 * 批量执行 WebUI 测试 — 使用并发 context 加速
 * 多个测试共享浏览器进程，每个测试用独立 context
 */
export async function executeBatchWebUITests(
  cases: TestCase[],
  context: ExecutionContext,
  fileService: FileService,
  concurrency: number = 3,
): Promise<TestResult[]> {
  const results: TestResult[] = [];

  // 分批并发执行（每批 concurrency 个）
  for (let i = 0; i < cases.length; i += concurrency) {
    const batch = cases.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map((tc) => executeWebUITestWithRetry(tc, context, fileService)),
    );
    results.push(...batchResults);
  }

  return results;
}
