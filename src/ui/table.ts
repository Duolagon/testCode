import Table from 'cli-table3';
import chalk from 'chalk';
import type { FeatureEntry } from '../core/analyzer/types.js';
import type { TestResult } from '../core/executor/types.js';

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
