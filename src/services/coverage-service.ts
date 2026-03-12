import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { spawnProcess } from '../utils/process.js';
import type { CoverageSummary } from '../core/executor/types.js';
import { logger } from '../ui/logger.js';

export interface CoverageReport {
  summary: CoverageSummary;
  thresholdsPassed: boolean;
  failures: string[];
}

/**
 * 在所有测试执行完毕后，收集最终的代码覆盖率。
 * 通过运行一次带 --coverage 的空测试来合并已有的覆盖率数据。
 */
export async function collectCoverage(
  projectPath: string,
  testRunner: string | null,
  provider: 'v8' | 'istanbul',
  thresholds: { lines: number; branches: number; functions: number; statements: number },
): Promise<CoverageReport | null> {
  // 读取 coverage-summary.json
  const coveragePath = path.join(projectPath, 'coverage', 'coverage-summary.json');

  try {
    const raw = await fs.readFile(coveragePath, 'utf-8');
    const data = JSON.parse(raw);

    if (!data.total) {
      logger.warn('Coverage data exists but has no "total" field');
      return null;
    }

    const summary: CoverageSummary = {
      lines: data.total.lines ?? { total: 0, covered: 0, pct: 0 },
      branches: data.total.branches ?? { total: 0, covered: 0, pct: 0 },
      functions: data.total.functions ?? { total: 0, covered: 0, pct: 0 },
      statements: data.total.statements ?? { total: 0, covered: 0, pct: 0 },
    };

    // 检查阈值
    const failures: string[] = [];
    if (thresholds.lines > 0 && summary.lines.pct < thresholds.lines) {
      failures.push(`Lines: ${summary.lines.pct}% < ${thresholds.lines}%`);
    }
    if (thresholds.branches > 0 && summary.branches.pct < thresholds.branches) {
      failures.push(`Branches: ${summary.branches.pct}% < ${thresholds.branches}%`);
    }
    if (thresholds.functions > 0 && summary.functions.pct < thresholds.functions) {
      failures.push(`Functions: ${summary.functions.pct}% < ${thresholds.functions}%`);
    }
    if (thresholds.statements > 0 && summary.statements.pct < thresholds.statements) {
      failures.push(`Statements: ${summary.statements.pct}% < ${thresholds.statements}%`);
    }

    return {
      summary,
      thresholdsPassed: failures.length === 0,
      failures,
    };
  } catch {
    logger.warn('No coverage data found. Install @vitest/coverage-v8 or @vitest/coverage-istanbul for coverage support.');
    return null;
  }
}
