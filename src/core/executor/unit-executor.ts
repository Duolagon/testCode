import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { spawnProcess } from '../../utils/process.js';
import { FileService } from '../../services/file-service.js';
import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext, CoverageSummary } from './types.js';
import { shouldRetry, attemptSelfHeal } from './self-healing.js';

function getRunnerCommand(
  testRunner: string | null,
  coverageEnabled: boolean,
  coverageProvider: string,
): { command: string; args: (file: string) => string[] } {
  switch (testRunner) {
    case 'vitest':
      return {
        command: 'npx',
        args: (file) => {
          const baseArgs = ['vitest', 'run', file, '--reporter=default', '--silent'];
          if (coverageEnabled) {
            baseArgs.push('--coverage', `--coverage.provider=${coverageProvider}`, '--coverage.reporter=json-summary', '--coverage.reporter=text');
          }
          return baseArgs;
        },
      };
    case 'jest':
      return {
        command: 'npx',
        args: (file) => {
          const baseArgs = ['jest', '--testPathPattern', file, '--silent'];
          if (coverageEnabled) {
            baseArgs.push('--coverage', '--coverageReporters=json-summary', '--coverageReporters=text');
          }
          return baseArgs;
        },
      };
    case 'mocha':
      return { command: 'npx', args: (file) => ['mocha', file, '--reporter=min'] };
    default:
      return { command: 'node', args: (file) => ['--test', file] };
  }
}

/**
 * 从 coverage-summary.json 中读取覆盖率数据
 */
async function readCoverageSummary(projectPath: string): Promise<CoverageSummary | undefined> {
  const possiblePaths = [
    path.join(projectPath, 'coverage', 'coverage-summary.json'),
    path.join(projectPath, 'coverage', 'coverage-final.json'),
  ];

  for (const coveragePath of possiblePaths) {
    try {
      const raw = await fs.readFile(coveragePath, 'utf-8');
      const data = JSON.parse(raw);
      if (data.total) {
        return {
          lines: data.total.lines ?? { total: 0, covered: 0, pct: 0 },
          branches: data.total.branches ?? { total: 0, covered: 0, pct: 0 },
          functions: data.total.functions ?? { total: 0, covered: 0, pct: 0 },
          statements: data.total.statements ?? { total: 0, covered: 0, pct: 0 },
        };
      }
    } catch {
      // 尝试下一个路径
    }
  }
  return undefined;
}

/**
 * 执行单个单元测试用例。
 *
 * 安全注意：AI 生成的测试代码在当前 Node.js 进程权限下运行，
 * 拥有完整的文件系统和网络访问权限。在生产环境中应考虑使用
 * 容器化沙箱（如 Docker）或受限用户权限来隔离测试执行。
 */
export async function executeUnitTest(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
): Promise<TestResult> {
  const start = Date.now();

  try {
    const filename = `${testCase.caseId.replace(/[^a-zA-Z0-9-]/g, '_')}.test.ts`;
    const testFilePath = await fileService.writeTempFile(filename, testCase.testCode);

    const coverageEnabled = context.coverageConfig?.enabled ?? false;
    const coverageProvider = context.coverageConfig?.provider ?? 'v8';
    const runner = getRunnerCommand(context.testRunner, coverageEnabled, coverageProvider);

    const result = await spawnProcess(runner.command, runner.args(testFilePath), {
      cwd: context.projectPath,
      timeout: 60_000,
    });

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
 * 带 AI 自愈重试的单元测试执行器。
 * 首次执行失败后，若配置允许且错误类型匹配，会调用 AI 修复 testCode 并重新执行。
 */
export async function executeUnitTestWithRetry(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
): Promise<TestResult> {
  let result = await executeUnitTest(testCase, context, fileService);

  if (
    result.status === 'fail' &&
    context.aiClient &&
    context.retryConfig &&
    shouldRetry(result, context.retryConfig)
  ) {
    const healResult = await attemptSelfHeal(
      testCase,
      result.errorDetail ?? 'Unknown error',
      context.aiClient,
      context.retryConfig,
      context.testRunner ?? 'vitest',
    );

    if (healResult.wasFixed) {
      const retryResult = await executeUnitTest(
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

export { readCoverageSummary };
