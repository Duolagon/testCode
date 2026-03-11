import type { AIProvider } from '../services/ai-client.js';

export interface Config {
  ai: {
    provider: AIProvider;
    apiKey: string;
    model: string;
    maxTokens: number;
  };
  project: {
    exclude: string[];
    frontendDir: string | null;
    backendDir: string | null;
    testRunner: string | null;
  };
  webui: {
    baseUrl: string;
    devCommand: string | null;
    browser: 'chromium' | 'firefox' | 'webkit';
    headless: boolean;
    timeout: number;
  };
  mcp: {
    configPath: string | null;
    timeout: number;
  };
  output: {
    dir: string;
    reportFile: string;
    screenshots: boolean;
    videos: boolean;
    traces: boolean;
  };
  retry: {
    /** AI 修复最大尝试次数 */
    maxAttempts: number;
    /** 语法/编译错误是否重试 */
    retrySyntaxErrors: boolean;
    /** 断言/逻辑错误是否重试 */
    retryAssertionErrors: boolean;
    /** 超时错误是否重试 */
    retryTimeouts: boolean;
  };
  interactive: boolean;
  mode: 'full' | 'incremental';
}

