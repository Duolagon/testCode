import * as path from 'node:path';
import { spawnProcess } from '../../utils/process.js';
import { FileService } from '../../services/file-service.js';
import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext } from './types.js';
import { shouldRetry, attemptSelfHeal } from './self-healing.js';

function getRunnerCommand(testRunner: string | null): { command: string; args: (file: string) => string[] } {
  switch (testRunner) {
    case 'vitest':
      return { command: 'npx', args: (file) => ['vitest', 'run', file, '--reporter=basic', '--silent'] };
    case 'jest':
      return { command: 'npx', args: (file) => ['jest', '--testPathPattern', file, '--silent'] };
    case 'mocha':
      return { command: 'npx', args: (file) => ['mocha', file, '--reporter=min'] };
    default:
      // 使用 Node.js 内置 test runner
      return { command: 'node', args: (file) => ['--test', file] };
  }
}

export async function executeUnitTest(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
): Promise<TestResult> {
  const start = Date.now();

  try {
    // 将测试代码写入临时文件（现在在项目目录内，vitest 可以直接发现）
    const filename = `${testCase.caseId.replace(/[^a-zA-Z0-9-]/g, '_')}.test.ts`;
    const testFilePath = await fileService.writeTempFile(filename, testCase.testCode);

    // 获取 test runner 命令
    const runner = getRunnerCommand(context.testRunner);

    // 执行测试
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
  // 首次执行
  let result = await executeUnitTest(testCase, context, fileService);

  // 判断是否需要自愈重试
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
      // 用修复后的代码重新执行
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

    // 所有修复尝试失败，返回原始结果 + 重试元数据
    return {
      ...result,
      retryAttempts: healResult.attempts,
      wasRetried: true,
      retryTokenUsage: healResult.tokenUsage,
    };
  }

  return result;
}
