/**
 * 代码洞察模块：静态分析源代码提取分支、错误处理、边界条件，
 * 用于指导 AI 生成更全面的测试用例。
 */

export interface CodeInsight {
  /** 导出的函数/类名 */
  exports: string[];
  /** 分支条件（if/switch/ternary） */
  branches: BranchInfo[];
  /** 错误处理路径（try/catch/throw） */
  errorPaths: string[];
  /** 参数校验模式 */
  validations: string[];
  /** 外部依赖调用（fs/网络/数据库等） */
  externalCalls: string[];
  /** 异步模式 */
  asyncPatterns: string[];
  /** 复杂度评分（分支数 + 错误路径数） */
  complexity: number;
}

export interface BranchInfo {
  type: 'if' | 'switch' | 'ternary' | 'nullish' | 'optional-chain';
  condition: string;
  line: number;
}

/**
 * 分析源代码文件，提取测试指导信息
 */
export function analyzeCodeInsight(content: string, filePath: string): CodeInsight {
  const lines = content.split('\n');
  const exports: string[] = [];
  const branches: BranchInfo[] = [];
  const errorPaths: string[] = [];
  const validations: string[] = [];
  const externalCalls: string[] = [];
  const asyncPatterns: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const trimmed = line.trim();
    const lineNum = i + 1;

    // 提取导出
    const exportMatch = trimmed.match(/^export\s+(?:async\s+)?(?:function|class|const|let|type|interface)\s+(\w+)/);
    if (exportMatch) {
      exports.push(exportMatch[1]);
    }

    // export default
    if (trimmed.startsWith('export default')) {
      exports.push('default');
    }

    // 分支条件
    const ifMatch = trimmed.match(/^(?:}\s*else\s+)?if\s*\((.+?)\)\s*\{?$/);
    if (ifMatch) {
      branches.push({ type: 'if', condition: ifMatch[1].trim(), line: lineNum });
    }

    // switch
    const switchMatch = trimmed.match(/^switch\s*\((.+?)\)\s*\{?$/);
    if (switchMatch) {
      branches.push({ type: 'switch', condition: switchMatch[1].trim(), line: lineNum });
    }

    // 三元运算
    if (trimmed.includes('?') && trimmed.includes(':') && !trimmed.startsWith('//') && !trimmed.startsWith('*')) {
      const ternaryMatch = trimmed.match(/(\w[\w.]*)\s*\?\s*/);
      if (ternaryMatch) {
        branches.push({ type: 'ternary', condition: ternaryMatch[1], line: lineNum });
      }
    }

    // 可选链
    if (trimmed.includes('?.')) {
      branches.push({ type: 'optional-chain', condition: trimmed.slice(0, 60), line: lineNum });
    }

    // 空值合并
    if (trimmed.includes('??')) {
      branches.push({ type: 'nullish', condition: trimmed.slice(0, 60), line: lineNum });
    }

    // 错误处理
    if (trimmed.startsWith('throw ')) {
      errorPaths.push(`throw at line ${lineNum}: ${trimmed.slice(0, 80)}`);
    }
    if (trimmed.startsWith('catch')) {
      errorPaths.push(`catch at line ${lineNum}`);
    }
    if (trimmed.includes('reject(') || trimmed.includes('.reject(')) {
      errorPaths.push(`reject at line ${lineNum}`);
    }

    // 参数校验
    if (trimmed.includes('!== undefined') || trimmed.includes('!== null') ||
        trimmed.includes('=== undefined') || trimmed.includes('=== null') ||
        trimmed.includes('typeof ')) {
      validations.push(`validation at line ${lineNum}: ${trimmed.slice(0, 80)}`);
    }

    // 外部调用检测
    if (trimmed.includes('fs.') || trimmed.includes("from 'node:fs")) {
      externalCalls.push('filesystem');
    }
    if (trimmed.includes('fetch(') || trimmed.includes('http.') || trimmed.includes('https.')) {
      externalCalls.push('network');
    }
    if (trimmed.includes('spawn(') || trimmed.includes('exec(') || trimmed.includes('execSync(')) {
      externalCalls.push('process');
    }

    // 异步模式
    if (trimmed.includes('async ') || trimmed.includes('await ') || trimmed.includes('Promise')) {
      asyncPatterns.push(`async at line ${lineNum}`);
    }
  }

  return {
    exports,
    branches,
    errorPaths,
    validations,
    externalCalls: [...new Set(externalCalls)],
    asyncPatterns,
    complexity: branches.length + errorPaths.length,
  };
}

/**
 * 将 CodeInsight 转换为 AI 可读的测试指导文本
 */
export function insightToTestGuidance(insight: CodeInsight, filePath: string): string {
  const parts: string[] = [];

  parts.push(`## Code Analysis for: ${filePath}`);
  parts.push(`Complexity Score: ${insight.complexity}`);

  if (insight.exports.length > 0) {
    parts.push(`\nExported functions/classes to test: ${insight.exports.join(', ')}`);
  }

  if (insight.branches.length > 0) {
    parts.push(`\n### Branch Conditions (${insight.branches.length} branches - MUST test both true/false paths):`);
    // 只列出前 20 个分支，避免 prompt 过长
    for (const b of insight.branches.slice(0, 20)) {
      parts.push(`- [${b.type}] Line ${b.line}: ${b.condition}`);
    }
    if (insight.branches.length > 20) {
      parts.push(`  ... and ${insight.branches.length - 20} more branches`);
    }
  }

  if (insight.errorPaths.length > 0) {
    parts.push(`\n### Error Handling Paths (MUST test error scenarios):`);
    for (const e of insight.errorPaths.slice(0, 10)) {
      parts.push(`- ${e}`);
    }
  }

  if (insight.validations.length > 0) {
    parts.push(`\n### Input Validations (MUST test null/undefined/invalid inputs):`);
    for (const v of insight.validations.slice(0, 10)) {
      parts.push(`- ${v}`);
    }
  }

  if (insight.externalCalls.length > 0) {
    parts.push(`\n### External Dependencies (MUST mock these): ${insight.externalCalls.join(', ')}`);
  }

  return parts.join('\n');
}
