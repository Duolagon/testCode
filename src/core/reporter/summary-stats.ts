import type { TestResult } from '../executor/types.js';

export interface TestStats {
  total: number;
  passed: number;
  failed: number;
  blocked: number;
  skipped: number;
  passRate: string;
  totalDuration: string;
  byCategory: Record<string, { total: number; passed: number; failed: number }>;
}

export function computeStats(results: TestResult[]): TestStats {
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const blocked = results.filter((r) => r.status === 'blocked').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const totalDuration = results.reduce((sum, r) => sum + r.duration, 0);

  const byCategory: TestStats['byCategory'] = {};
  for (const result of results) {
    if (!byCategory[result.category]) {
      byCategory[result.category] = { total: 0, passed: 0, failed: 0 };
    }
    byCategory[result.category].total++;
    if (result.status === 'pass') byCategory[result.category].passed++;
    if (result.status === 'fail') byCategory[result.category].failed++;
  }

  return {
    total: results.length,
    passed,
    failed,
    blocked,
    skipped,
    passRate: results.length > 0 ? ((passed / results.length) * 100).toFixed(1) : '0',
    totalDuration: (totalDuration / 1000).toFixed(1),
    byCategory,
  };
}
