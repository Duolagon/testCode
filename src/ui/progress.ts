import chalk from 'chalk';

export class ProgressBar {
  private total: number;
  private current = 0;
  private barLength = 30;

  constructor(total: number) {
    this.total = total;
  }

  update(current: number, label?: string) {
    this.current = current;
    const ratio = this.total > 0 ? this.current / this.total : 0;
    const filled = Math.round(this.barLength * ratio);
    const empty = this.barLength - filled;
    const bar = chalk.green('█'.repeat(filled)) + chalk.dim('░'.repeat(empty));
    const percent = Math.round(ratio * 100);
    const info = label ? ` ${label}` : '';
    process.stdout.write(`\r  ${bar} ${percent}% (${this.current}/${this.total})${info}  `);
  }

  finish() {
    this.update(this.total);
    console.log();
  }
}
