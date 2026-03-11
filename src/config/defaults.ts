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
  },
  retry: {
    maxAttempts: 2,
    retrySyntaxErrors: true,
    retryAssertionErrors: true,
    retryTimeouts: false,
  },
  interactive: true,
  mode: 'full',
};

