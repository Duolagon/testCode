import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileExists } from '../utils/fs.js';
import { defaultConfig } from '../config/defaults.js';
import { logger } from '../ui/logger.js';

const GITHUB_ACTION_TEMPLATE = `name: AI Test

on:
  pull_request:
    branches: [main, master]
  push:
    branches: [main, master]

jobs:
  ai-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci

      - name: Run AI Tests
        env:
          GEMINI_API_KEY: \${{ secrets.GEMINI_API_KEY }}
          # ANTHROPIC_API_KEY: \${{ secrets.ANTHROPIC_API_KEY }}
          # OPENAI_API_KEY: \${{ secrets.OPENAI_API_KEY }}
        run: npx ai-test run --ci --no-interactive --budget 500000

      - name: Upload Test Report
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: ai-test-report
          path: |
            test-report.md
            test-results/report.json

      - name: Comment PR with results
        if: github.event_name == 'pull_request' && always()
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          path: test-report.md
`;

interface InitOptions {
  ci?: boolean;
}

export async function handleInit(options: InitOptions = {}) {
  const configPath = path.resolve('ai-test.config.json');

  if (await fileExists(configPath)) {
    logger.warn('ai-test.config.json already exists, skipping.');
  } else {
    const configContent = {
      ai: {
        provider: defaultConfig.ai.provider,
        model: defaultConfig.ai.model,
        maxTokens: defaultConfig.ai.maxTokens,
      },
      project: {
        exclude: defaultConfig.project.exclude,
      },
      webui: {
        baseUrl: defaultConfig.webui.baseUrl,
        browser: defaultConfig.webui.browser,
        headless: defaultConfig.webui.headless,
      },
      mcp: {
        configPath: null,
        timeout: defaultConfig.mcp.timeout,
      },
      output: {
        dir: defaultConfig.output.dir,
        reportFile: defaultConfig.output.reportFile,
        screenshots: defaultConfig.output.screenshots,
      },
      coverage: {
        enabled: false,
        provider: 'v8',
        thresholds: {
          lines: 0,
          branches: 0,
          functions: 0,
          statements: 0,
        },
      },
      budget: {
        maxTokens: 0,
        confirmBeforeRun: false,
        pricePerPrompt1k: 0,
        pricePerCompletion1k: 0,
      },
      ci: {
        enabled: false,
        passRateThreshold: 80,
        jsonReportPath: './test-results/report.json',
      },
      interactive: defaultConfig.interactive,
    };

    await fs.writeFile(configPath, JSON.stringify(configContent, null, 2) + '\n', 'utf-8');
    logger.success(`Created ${configPath}`);
    logger.info('Set API Key: export GEMINI_API_KEY=your-key');
    logger.info('Switch provider: change ai.provider to "gemini" | "anthropic" | "openai"');
  }

  // Generate GitHub Actions workflow
  if (options.ci) {
    const workflowDir = path.resolve('.github', 'workflows');
    const workflowPath = path.join(workflowDir, 'ai-test.yml');

    if (await fileExists(workflowPath)) {
      logger.warn('.github/workflows/ai-test.yml already exists, skipping.');
    } else {
      await fs.mkdir(workflowDir, { recursive: true });
      await fs.writeFile(workflowPath, GITHUB_ACTION_TEMPLATE, 'utf-8');
      logger.success(`Created ${workflowPath}`);
      logger.info('Add your API key as a GitHub secret: Settings > Secrets > GEMINI_API_KEY');
    }
  }
}
