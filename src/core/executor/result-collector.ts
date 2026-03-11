import type { TestResult } from './types.js';

export class ResultCollector {
  private results: TestResult[] = [];

  add(result: TestResult): void {
    this.results.push(result);
  }

  addAll(results: TestResult[]): void {
    this.results.push(...results);
  }

  getAll(): TestResult[] {
    return [...this.results];
  }

  getPassed(): TestResult[] {
    return this.results.filter((r) => r.status === 'pass');
  }

  getFailed(): TestResult[] {
    return this.results.filter((r) => r.status === 'fail');
  }

  getBlocked(): TestResult[] {
    return this.results.filter((r) => r.status === 'blocked');
  }

  getSkipped(): TestResult[] {
    return this.results.filter((r) => r.status === 'skipped');
  }

  getSummary() {
    return {
      total: this.results.length,
      passed: this.getPassed().length,
      failed: this.getFailed().length,
      blocked: this.getBlocked().length,
      skipped: this.getSkipped().length,
      totalDuration: this.results.reduce((sum, r) => sum + r.duration, 0),
    };
  }
}
