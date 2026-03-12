import type { Config } from './types.js';

export const defaultConfig: Config = {
  ai: {
    provider: 'gemini',
    apiKey: '',
    model: 'gemini-2.5-pro',
    maxTokens: 65536,
  },
  project: {
    exclude: ['node_modules', 'dist', 'build', '.git', 'coverage'],
    frontendDir: null,
    backendDir: null,
    testRunner: null,
  },
  webui: {
    baseUrl: 'http://localhost:3000',
    devCommand: null,
    browser: 'chromium',
    headless: true,
    timeout: 30000,
  },
  mcp: {
    configPath: null,
    timeout: 10000,
  },
  output: {
    dir: './test-results',
    reportFile: './test-report.md',
    screenshots: true,
    videos: false,
    traces: false,
    xmind: true,
  },
  retry: {
    maxAttempts: 2,
    retrySyntaxErrors: true,
    retryAssertionErrors: true,
    retryTimeouts: false,
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
  interactive: true,
  mode: 'full',
  specPath: null,
};

