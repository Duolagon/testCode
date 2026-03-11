import type { AIClient, AIPrompt, TokenUsage } from '../../services/ai-client.js';
import type { TestCase } from '../generator/types.js';
import type { TestResult, RetryConfig } from './types.js';
import { postProcessTestCode, validateTestCodeSyntax } from '../generator/case-parser.js';
import { logger } from '../../ui/logger.js';

/** 错误分类 */
export type ErrorCategory = 'syntax' | 'assertion' | 'timeout' | 'unknown';

/**
 * 根据 errorDetail 将测试失败分类
 */
export function classifyError(errorDetail: string): ErrorCategory {
  const lower = errorDetail.toLowerCase();

  // 语法 / 编译错误（esbuild / tsc）
  if (
    lower.includes('unterminated string literal') ||
    lower.includes('syntax error') ||
    lower.includes('transform failed') ||
    lower.includes('unexpected token') ||
    lower.includes('unexpected end of input') ||
    lower.includes('cannot find module') ||
    lower.includes('cannot access') ||
    lower.includes('is not defined') ||
    lower.includes('parse error') ||
    lower.includes('expected expression') ||
    lower.includes('is not a function')
  ) {
    return 'syntax';
  }

  // 超时
  if (lower.includes('timed out') || lower.includes('timeout')) {
    return 'timeout';
  }

  // 断言错误
  if (
    lower.includes('assertionerror') ||
    lower.includes('assertion') ||
    lower.includes('expected') ||
    lower.includes('tohave') ||
    lower.includes('tobe') ||
    lower.includes('toequal') ||
    lower.includes('tomatch') ||
    lower.includes('tocontain')
  ) {
    return 'assertion';
  }

  return 'unknown';
}

/**
 * 判断一个失败的测试是否应该重试
 */
export function shouldRetry(
  result: TestResult,
  config: RetryConfig | undefined,
): boolean {
  if (!config || config.maxAttempts <= 0) return false;
  if (result.status !== 'fail') return false;

  const category = classifyError(result.errorDetail ?? '');
  switch (category) {
    case 'syntax':
      return config.retrySyntaxErrors;
    case 'assertion':
      return config.retryAssertionErrors;
    case 'timeout':
      return config.retryTimeouts;
    default:
      // unknown 错误默认跟随 syntax 配置
      return config.retrySyntaxErrors;
  }
}

/**
 * 构建 AI 修复 prompt
 */
function buildFixPrompt(
  testCase: TestCase,
  errorDetail: string,
  errorCategory: ErrorCategory,
  attemptNumber: number,
): AIPrompt {
  const assertionGuidance =
    errorCategory === 'assertion'
      ? `
5. For assertion errors: the test's expected values may be WRONG because the AI hallucinated the expected behavior.
   - Carefully re-read the error output to understand what the ACTUAL result is.
   - Adjust the assertions to match the actual correct behavior of the code, not what was blindly guessed.
   - If the test expected N items but got M, fix the expected count to M (if M is logically correct).
   - Do NOT just flip assertions — understand WHY they failed and fix the root cause.`
      : '';

  const system = `You are an expert test code debugger. You will be given a failing test case with its error details. Fix the testCode so it compiles and passes correctly.

RULES:
1. Output ONLY the fixed testCode as raw TypeScript code.
2. Do NOT wrap it in JSON, markdown code blocks (\`\`\`), or any other formatting.
3. Do NOT change the overall intent or structure of the test.
4. Focus on fixing the specific error reported.
5. Common fixes for syntax errors:
   - Unterminated string literals: ensure all backticks, quotes, and template literals are properly closed and escaped.
   - Nested quotes: if mock content contains the same quote type as the enclosing string, escape them or switch quote types.
   - Template literal backticks inside template literals: escape inner backticks with backslash.
   - vi.mock hoisting: do NOT reference local variables inside vi.mock() factory functions.
   - Import paths: test files are in ai-test-tmp/ so imports should use '../src/...'.${assertionGuidance}
6. Preserve all imports and the describe/it structure.
7. This is fix attempt #${attemptNumber}. Previous attempts have failed — try a different approach if needed.`;

  const user = `Fix the following failing test code.

## Test Case
- Case ID: ${testCase.caseId}
- Feature: ${testCase.feature}
- Category: ${testCase.category}
- Description: ${testCase.description}

## Current testCode (broken):
${testCase.testCode}

## Error Detail:
${errorDetail}

Output ONLY the corrected TypeScript test code. No explanations, no markdown fences, no JSON.`;

  return { system, user };
}

/**
 * 从 AI 响应中提取纯代码（去除可能的 markdown 包裹）
 */
function extractCodeFromResponse(text: string): string {
  const codeBlockMatch = text.match(
    /```(?:typescript|ts|javascript|js)?\s*\n([\s\S]*?)\n```/,
  );
  if (codeBlockMatch) {
    return codeBlockMatch[1].trim();
  }
  return text.trim();
}

export interface SelfHealingResult {
  fixedTestCase: TestCase;
  tokenUsage: TokenUsage;
  attempts: number;
  wasFixed: boolean;
}

/**
 * 核心自愈函数：将失败的测试交给 AI 修复，最多尝试 maxAttempts 次。
 * 每次修复后会用 esbuild 做语法预检，语法通过才算修复成功。
 */
export async function attemptSelfHeal(
  testCase: TestCase,
  errorDetail: string,
  aiClient: AIClient,
  retryConfig: RetryConfig,
  testRunner: string,
): Promise<SelfHealingResult> {
  const totalUsage: TokenUsage = {
    promptTokens: 0,
    completionTokens: 0,
    totalTokens: 0,
  };
  let currentTestCase = { ...testCase };
  let currentError = errorDetail;
  let attempts = 0;

  const errorCategory = classifyError(errorDetail);

  for (let i = 0; i < retryConfig.maxAttempts; i++) {
    attempts++;
    logger.info(
      `  🔧 Self-healing [${testCase.caseId}] attempt ${attempts}/${retryConfig.maxAttempts} (${errorCategory})...`,
    );

    try {
      const prompt = buildFixPrompt(
        currentTestCase,
        currentError,
        errorCategory,
        attempts,
      );
      const response = await aiClient.generate(prompt);

      // 累计 Token
      totalUsage.promptTokens += response.usage.promptTokens;
      totalUsage.completionTokens += response.usage.completionTokens;
      totalUsage.totalTokens += response.usage.totalTokens;

      // 提取并后处理修复代码
      let fixedCode = extractCodeFromResponse(response.text);
      fixedCode = postProcessTestCode(fixedCode, testRunner);

      // esbuild 语法预检
      const validation = await validateTestCodeSyntax(fixedCode);
      if (validation.valid) {
        logger.success(
          `  ✅ Self-healing [${testCase.caseId}] produced syntactically valid code`,
        );
        return {
          fixedTestCase: { ...currentTestCase, testCode: fixedCode },
          tokenUsage: totalUsage,
          attempts,
          wasFixed: true,
        };
      }

      // 修复代码本身仍有语法错误，带入下一轮
      logger.warn(
        `  ⚠️ Self-healing [${testCase.caseId}] attempt ${attempts} still has syntax error: ${validation.error?.slice(0, 200)}`,
      );
      currentError = validation.error ?? 'Unknown syntax error in fixed code';
      currentTestCase = { ...currentTestCase, testCode: fixedCode };
    } catch (error) {
      logger.warn(
        `  ❌ Self-healing [${testCase.caseId}] attempt ${attempts} AI call failed: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // 所有尝试耗尽
  logger.warn(
    `  Self-healing [${testCase.caseId}] exhausted ${attempts} attempts, returning original`,
  );
  return {
    fixedTestCase: currentTestCase,
    tokenUsage: totalUsage,
    attempts,
    wasFixed: false,
  };
}
