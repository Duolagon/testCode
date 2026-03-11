import * as path from 'node:path';
import { spawnProcess } from '../../utils/process.js';
import { FileService } from '../../services/file-service.js';
import { fileExists } from '../../utils/fs.js';
import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext } from './types.js';

function wrapPlaywrightScript(testCode: string, baseUrl: string, caseId: string, screenshotDir: string): string {
  return `import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
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
      await page.screenshot({ path: ${JSON.stringify(path.join(screenshotDir, `${caseId}.png`))} });
    } catch {}
    process.exitCode = 1;
  } finally {
    await browser.close();
  }
})();
`;
}

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
    const scriptContent = wrapPlaywrightScript(
      testCase.testCode,
      baseUrl,
      testCase.caseId,
      screenshotDir,
    );

    const filename = `${testCase.caseId.replace(/[^a-zA-Z0-9-]/g, '_')}.webui.ts`;
    const scriptPath = await fileService.writeTempFile(filename, scriptContent);

    const result = await spawnProcess('npx', ['tsx', scriptPath], {
      cwd: context.projectPath,
      timeout: 120_000,
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
