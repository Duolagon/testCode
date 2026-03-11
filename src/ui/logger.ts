import chalk from 'chalk';

export const logger = {
  info(msg: string) {
    console.log(chalk.blue('ℹ'), msg);
  },
  success(msg: string) {
    console.log(chalk.green('✔'), msg);
  },
  warn(msg: string) {
    console.log(chalk.yellow('⚠'), msg);
  },
  error(msg: string) {
    console.log(chalk.red('✖'), msg);
  },
  dim(msg: string) {
    console.log(chalk.dim(msg));
  },
  heading(msg: string) {
    console.log();
    console.log(chalk.bold.underline(msg));
    console.log();
  },
  testPass(caseId: string, description: string, duration: number) {
    console.log(
      `  ${chalk.green('PASS')} ${chalk.dim(caseId)} ${description} ${chalk.dim(`(${(duration / 1000).toFixed(1)}s)`)}`,
    );
  },
  testFail(caseId: string, description: string, errorDetail?: string) {
    console.log(`  ${chalk.red('FAIL')} ${chalk.dim(caseId)} ${description}`);
    if (errorDetail) {
      console.log(`       ${chalk.red(errorDetail)}`);
    }
  },
  testSkip(caseId: string, description: string) {
    console.log(`  ${chalk.yellow('SKIP')} ${chalk.dim(caseId)} ${description}`);
  },
};
