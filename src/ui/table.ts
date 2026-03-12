import Table from 'cli-table3';
import chalk from 'chalk';
import type { FeatureEntry } from '../core/analyzer/types.js';
import type { TestResult, CoverageSummary } from '../core/executor/types.js';

export function printFeatureTable(features: FeatureEntry[]) {
  const table = new Table({
    head: [
      chalk.bold('ID'),
      chalk.bold('Feature'),
      chalk.bold('Frontend'),
      chalk.bold('Backend'),
      chalk.bold('MCP Tools'),
      chalk.bold('Categories'),
    ],
  });

  for (const f of features) {
    table.push([
      f.id,
      f.name,
      f.frontendComponents.length > 0 ? f.frontendComponents.length.toString() : '-',
      f.backendEndpoints.length > 0 ? f.backendEndpoints.length.toString() : '-',
      f.mcpTools.length > 0 ? f.mcpTools.join(', ') : '-',
      f.applicableCategories.join(', '),
    ]);
  }

  console.log(table.toString());
}

export function printResultsSummary(results: TestResult[]) {
  const passed = results.filter((r) => r.status === 'pass').length;
  const failed = results.filter((r) => r.status === 'fail').length;
  const skipped = results.filter((r) => r.status === 'skipped').length;
  const blocked = results.filter((r) => r.status === 'blocked').length;

  console.log();
  console.log(
    `  ${chalk.bold('Total:')} ${results.length}  ` +
      `${chalk.green('Passed:')} ${passed}  ` +
      `${chalk.red('Failed:')} ${failed}  ` +
      `${chalk.yellow('Skipped:')} ${skipped}  ` +
      `${chalk.dim('Blocked:')} ${blocked}`,
  );
  console.log();
}

export function printCoverageSummary(coverage: CoverageSummary) {
  const table = new Table({
    head: [
      chalk.bold('Metric'),
      chalk.bold('Covered'),
      chalk.bold('Total'),
      chalk.bold('Percentage'),
    ],
  });

  const colorize = (pct: number) =>
    pct >= 80 ? chalk.green(`${pct}%`) :
    pct >= 50 ? chalk.yellow(`${pct}%`) :
    chalk.red(`${pct}%`);

  table.push(
    ['Statements', String(coverage.statements.covered), String(coverage.statements.total), colorize(coverage.statements.pct)],
    ['Branches', String(coverage.branches.covered), String(coverage.branches.total), colorize(coverage.branches.pct)],
    ['Functions', String(coverage.functions.covered), String(coverage.functions.total), colorize(coverage.functions.pct)],
    ['Lines', String(coverage.lines.covered), String(coverage.lines.total), colorize(coverage.lines.pct)],
  );

  console.log();
  console.log(chalk.bold('  Code Coverage:'));
  console.log(table.toString());
}

export function printCostSummary(
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number },
  cost: { totalCost: number; promptCost: number; completionCost: number },
) {
  console.log();
  console.log(chalk.bold('  Cost Summary:'));
  console.log(
    `  Tokens: ${tokenUsage.totalTokens.toLocaleString()} ` +
    `(Prompt: ${tokenUsage.promptTokens.toLocaleString()}, Completion: ${tokenUsage.completionTokens.toLocaleString()})`,
  );
  if (cost.totalCost > 0) {
    console.log(
      `  Estimated Cost: $${cost.totalCost.toFixed(4)} ` +
      `(Prompt: $${cost.promptCost.toFixed(4)}, Completion: $${cost.completionCost.toFixed(4)})`,
    );
  }
  console.log();
}
