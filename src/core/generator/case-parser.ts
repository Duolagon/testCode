import { z } from 'zod';
import type { TestCase } from './types.js';

const TestCaseSchema = z.object({
  caseId: z.string(),
  feature: z.string(),
  category: z.enum(['Frontend', 'Backend', 'Integration', 'Compatibility', 'Performance', 'WebUI', 'MCP']),
  description: z.string(),
  preconditions: z.array(z.string()).default([]),
  steps: z.array(z.string()).default([]),
  expectedResult: z.string().default(''),
  testCode: z.string(),
  mcpServerName: z.string().optional(),
});

const TestCaseArraySchema = z.array(TestCaseSchema);

function extractJsonFromMarkdown(text: string): string {
  let jsonStr = text;
  // 尝试从 markdown code block 中提取 JSON
  const codeBlockMatch = text.match(/```(?:json)?\s*\n([\s\S]*?)\n```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  } else {
    // 尝试匹配裸的 JSON 数组
    const arrayMatch = text.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      jsonStr = arrayMatch[0];
    }
  }

  return jsonStr;
}

/**
 * 清理 JSON 字符串中的非法转义字符
 * 大模型有时会在 JSON string 值中生成未正确转义的控制字符
 */
function sanitizeJsonString(jsonStr: string): string {
  // 修复非法的转义序列：\' 不是合法的 JSON 转义，替换为 '
  let sanitized = jsonStr.replace(/\\'/g, "'");

  // 尝试直接解析
  try {
    JSON.parse(sanitized);
    return sanitized;
  } catch {
    // 策略 1: 修复 JSON string 内部的原始换行符（单次遍历替换）
    let fixed = sanitized.replace(
      /"(?:[^"\\]|\\.)*"/g,
      (match) => match.replace(/\r\n|\r|\n|\t/g, (ch) => {
        if (ch === '\t') return '\\t';
        return '\\n';
      }),
    );

    try {
      JSON.parse(fixed);
      return fixed;
    } catch {
      // 策略 2: 逐字符扫描修复非法转义序列
      // JSON 合法的转义只有: \", \\, \/, \b, \f, \n, \r, \t, \uXXXX
      const legalEscapes = new Set(['"', '\\', '/', 'b', 'f', 'n', 'r', 't', 'u']);
      let result = '';
      let inString = false;

      for (let i = 0; i < fixed.length; i++) {
        const ch = fixed[i];

        if (!inString) {
          if (ch === '"') inString = true;
          result += ch;
        } else {
          if (ch === '\\') {
            const next = fixed[i + 1];
            if (next && legalEscapes.has(next)) {
              // 合法转义，保留
              result += ch + next;
              i++;
            } else if (next === "'") {
              // \' → '
              result += "'";
              i++;
            } else {
              // 非法转义（如 \a, \g 等）→ 去掉反斜杠，只保留字符
              result += (next ?? '');
              i++;
            }
          } else if (ch === '"') {
            inString = false;
            result += ch;
          } else {
            result += ch;
          }
        }
      }

      try {
        JSON.parse(result);
        return result;
      } catch {
        // 策略 3: 返回最后的 fixed 版本，让外层捕获此错误
        return fixed;
      }
    }
  }
}

/**
 * 对解析出的 testCode 做后处理：
 * 1. 替换残留的 {{TEST_RUNNER}} 占位符
 * 2. 将字面量 \n/\t 转义序列转换为真实换行/制表符
 * 3. 修复 it/describe 字符串中的内嵌单引号
 * 4. 修复 describe 顶层使用 await import 的语法错误
 * 5. 修复 mocked() → vi.mocked()
 */
export function postProcessTestCode(testCode: string, testRunner: string): string {
  let processed = testCode;

  // 替换 {{TEST_RUNNER}} 占位符
  processed = processed.replace(/\{\{TEST_RUNNER\}\}/g, testRunner);

  // 修复大模型在 JSON string 中使用了 \\n 双重转义
  const hasRealNewlines = processed.includes('\n');
  const hasLiteralBackslashN = processed.includes('\\n');

  if (!hasRealNewlines && hasLiteralBackslashN) {
    processed = processed
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
  }

  // 修复单引号/双引号字符串中的裸换行符（JS/TS 中不允许跨行）
  // AI 生成的 mock 数据经常包含多行字符串如 .mockReturnValueOnce('line1\nline2\n')
  // 将跨行的普通字符串转为模板字面量，或将内部换行转义为 \\n
  // 修复单引号/双引号字符串中的裸换行符（JS/TS 中不允许跨行）
  // 将 \r\n、\r、\n 统一转义为 \\n
  processed = processed.replace(
    /(['"])([^]*?)\1/g,
    (match, quote, content) => {
      if (!content.includes('\n') && !content.includes('\r')) return match;
      const fixed = content.replace(/\r\n|\r|\n/g, '\\n');
      return `${quote}${fixed}${quote}`;
    },
  );

  // 根据 testRunner 适配 mock API
  if (testRunner === 'vitest') {
    // vitest: mocked(await import(...)) → vi.mocked(...)
    processed = processed.replace(
      /vi\.mocked\(await\s+import\(['"]([^'"]+)['"]\)\)/g,
      (_match, _modulePath) => `vi.mocked(readFileContent)`,
    );
    // vitest: 独立的 mocked() → vi.mocked()
    processed = processed.replace(/(?<![.\w])mocked\(/g, 'vi.mocked(');
    // 移除多余的 mocked import
    processed = processed.replace(/,\s*mocked\b/g, '');
    processed = processed.replace(/\bmocked\s*,\s*/g, '');
  } else if (testRunner === 'jest') {
    // jest: vi.mock → jest.mock, vi.fn → jest.fn, vi.spyOn → jest.spyOn
    processed = processed.replace(/\bvi\.mock\(/g, 'jest.mock(');
    processed = processed.replace(/\bvi\.fn\(/g, 'jest.fn(');
    processed = processed.replace(/\bvi\.spyOn\(/g, 'jest.spyOn(');
    processed = processed.replace(/\bvi\.mocked\(/g, 'jest.mocked(');
    processed = processed.replace(/\bvi\.clearAllMocks\(\)/g, 'jest.clearAllMocks()');
    processed = processed.replace(/\bvi\.resetAllMocks\(\)/g, 'jest.resetAllMocks()');
    // jest: import { vi } from 'vitest' → 移除（jest 全局可用）
    processed = processed.replace(/import\s*\{[^}]*\bvi\b[^}]*\}\s*from\s*['"]vitest['"]\s*;?\n?/g, '');
  }
  // mocha: 不做 mock API 转换，mocha 通常配合 sinon 使用

  return processed;
}

/**
 * 用 esbuild 对 testCode 做语法预检。
 * 能精确模拟 vitest 的编译过程，提前发现未闭合字符串等语法错误。
 */
export async function validateTestCodeSyntax(
  code: string,
): Promise<{ valid: boolean; error?: string }> {
  try {
    const { transform } = await import('esbuild');
    await transform(code, { loader: 'ts' });
    return { valid: true };
  } catch (e) {
    return {
      valid: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}

export function parseCases(
  rawResponse: string,
  featureName: string,
  category: string,
  testRunner: string = 'vitest',
): TestCase[] {
  try {
    const jsonStr = extractJsonFromMarkdown(rawResponse);
    const sanitized = sanitizeJsonString(jsonStr);
    const parsed = JSON.parse(sanitized);
    const validated = TestCaseArraySchema.parse(parsed);

    // 对每个用例的 testCode 做后处理
    return validated.map((tc) => ({
      ...tc,
      testCode: postProcessTestCode(tc.testCode, testRunner),
    })) as TestCase[];
  } catch (firstError) {
    // 恢复策略：尝试把 JSON 字符串包裹成数组再解析
    try {
      const jsonStr = extractJsonFromMarkdown(rawResponse);
      const sanitized = sanitizeJsonString(jsonStr);
      const parsed = JSON.parse(`[${sanitized}]`);
      const validated = TestCaseArraySchema.parse(parsed);
      return validated.map((tc) => ({
        ...tc,
        testCode: postProcessTestCode(tc.testCode, testRunner),
      })) as TestCase[];
    } catch {
      // 最终兜底：返回空数组并输出警告
      console.error(
        `  Warning: Failed to parse test cases for "${featureName}" [${category}]:`,
        firstError instanceof Error ? firstError.message : String(firstError),
      );
      return [];
    }
  }
}

