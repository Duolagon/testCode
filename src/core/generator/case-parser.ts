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
    // 策略 1: 修复 JSON string 内部的原始换行符
    let fixed = sanitized.replace(
      /"(?:[^"\\]|\\.)*"/g,
      (match) => {
        return match
          .replace(/\r\n/g, '\\n')
          .replace(/\r/g, '\\n')
          .replace(/\n/g, '\\n')
          .replace(/\t/g, '\\t');
      }
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

  // Bug 2 修复：替换 {{TEST_RUNNER}} 占位符
  processed = processed.replace(/\{\{TEST_RUNNER\}\}/g, testRunner);

  // 根因 A 修复：大模型在 JSON string 中使用了 \\n 双重转义
  const hasRealNewlines = processed.includes('\n');
  const hasLiteralBackslashN = processed.includes('\\n');

  if (!hasRealNewlines && hasLiteralBackslashN) {
    processed = processed
      .replace(/\\n/g, '\n')
      .replace(/\\t/g, '\t');
  }

  // 根因 A2 修复已移除：正则表达式在跨行和匹配时导致了毁灭性的错误替换
  // 现在完全依赖在 system prompt 中增加的 "String Escaping" 规则来防止此问题

  // 根因 B 修复：vi.mocked(await import('...')) 在非 async 上下文中使用
  // 这会导致 "await can only be used inside an async function" 错误
  // 直接移除这种模式，因为正确的方式是在 vi.mock 中注册然后 import
  processed = processed.replace(
    /vi\.mocked\(await\s+import\(['"]([^'"]+)['"]\)\)/g,
    (_match, _modulePath) => {
      return `vi.mocked(readFileContent)`;
    }
  );

  // 根因 C 修复：mocked(xxx) → vi.mocked(xxx)
  // 大模型 import { mocked } from 'vitest' 是旧版 API
  // 替换独立的 mocked() 调用为 vi.mocked()
  processed = processed.replace(
    /(?<![.\w])mocked\(/g,
    'vi.mocked('
  );
  // 移除对 mocked 的独立 import（已包含在 vi 中）
  processed = processed.replace(
    /,\s*mocked\b/g,
    ''
  );
  processed = processed.replace(
    /\bmocked\s*,\s*/g,
    ''
  );

  // 根因 C2 修复：模板字面量中的 :id → 可能被 esbuild 误解析
  // 将 mockResolvedValue(`...`) 中的模板字面量改为普通字符串
  // 实际上这个问题很少，暂不处理更复杂的情况

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

