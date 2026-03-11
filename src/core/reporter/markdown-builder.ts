export class MarkdownBuilder {
  private lines: string[] = [];

  h1(text: string): this {
    this.lines.push(`# ${text}`, '');
    return this;
  }

  h2(text: string): this {
    this.lines.push(`## ${text}`, '');
    return this;
  }

  h3(text: string): this {
    this.lines.push(`### ${text}`, '');
    return this;
  }

  bullet(text: string): this {
    this.lines.push(`- ${text}`);
    return this;
  }

  text(text: string): this {
    this.lines.push(text, '');
    return this;
  }

  table(headers: string[], rows: string[][]): this {
    if (rows.length === 0) {
      this.lines.push('(none)', '');
      return this;
    }

    // Header
    this.lines.push(`| ${headers.join(' | ')} |`);
    this.lines.push(`| ${headers.map(() => '---').join(' | ')} |`);

    // Rows
    for (const row of rows) {
      const cells = row.map((cell) => cell.replace(/\|/g, '\\|').replace(/\n/g, ' '));
      this.lines.push(`| ${cells.join(' | ')} |`);
    }

    this.lines.push('');
    return this;
  }

  blankLine(): this {
    this.lines.push('');
    return this;
  }

  toString(): string {
    return this.lines.join('\n');
  }
}
