import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { logger } from '../ui/logger.js';

interface ReportOptions {
  input: string;
  output: string;
}

export async function handleReport(options: ReportOptions) {
  const reportPath = path.resolve(options.output);

  try {
    const content = await fs.readFile(reportPath, 'utf-8');
    console.log(content);
  } catch {
    logger.error(`No report found at ${reportPath}. Run 'ai-test run' first.`);
    process.exit(1);
  }
}
