import * as p from '@clack/prompts';
import type { TestCase } from '../core/generator/types.js';

export type CaseApprovalAction = 'approve_all' | 'select' | 'skip' | 'regenerate';

export async function promptCaseApproval(
  featureName: string,
  cases: TestCase[],
): Promise<CaseApprovalAction> {
  const action = await p.select({
    message: `为 "${featureName}" 生成了 ${cases.length} 个测试用例，请核阅:`,
    options: [
      { value: 'approve_all', label: '✅ 全部采纳 (Approve all)' },
      { value: 'select', label: '🔍 挑选部分 (Select individually via list)' },
      { value: 'skip', label: '⏭️ 跳过此模块 (Skip this feature)' },
      { value: 'regenerate', label: '🔄 重新生成 (Regenerate)' },
    ],
  });

  if (p.isCancel(action)) {
    return 'skip';
  }
  return action as CaseApprovalAction;
}

export async function promptCaseSelection(cases: TestCase[]): Promise<TestCase[]> {
  const selected = await p.multiselect({
    message: '按空格键勾选或取消，Enter 键确认：',
    options: cases.map(c => ({
      value: c,
      label: `${c.caseId} [${c.category}]`,
      hint: c.description.length > 50 ? c.description.slice(0, 47) + '...' : c.description,
    })),
    required: false,
  });

  if (p.isCancel(selected)) {
    return [];
  }
  return selected as TestCase[];
}

export async function promptContinueAfterFailures(failCount: number): Promise<boolean> {
  const go = await p.confirm({
    message: `有 ${failCount} 个用例在此阶段失败。是否强行继续后续阶段的执行？`,
    initialValue: true,
  });
  if (p.isCancel(go)) return false;
  return go;
}
