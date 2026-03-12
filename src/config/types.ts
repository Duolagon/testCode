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
    /** 是否导出 XMind 格式的测试用例文件 */
    xmind: boolean;
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
  coverage: {
    /** 是否启用代码覆盖率收集 */
    enabled: boolean;
    /** 覆盖率提供者: v8 或 istanbul */
    provider: 'v8' | 'istanbul';
    /** 最低通过率阈值（0-100），低于此值 CI 将失败 */
    thresholds: {
      lines: number;
      branches: number;
      functions: number;
      statements: number;
    };
  };
  budget: {
    /** 单次运行最大 Token 预算，0 表示不限制 */
    maxTokens: number;
    /** 执行前是否显示成本预估并等待确认 */
    confirmBeforeRun: boolean;
    /** 每 1K prompt tokens 的价格（美元），用于成本估算 */
    pricePerPrompt1k: number;
    /** 每 1K completion tokens 的价格（美元） */
    pricePerCompletion1k: number;
  };
  ci: {
    /** CI 模式：输出 JSON 报告、设置退出码 */
    enabled: boolean;
    /** 最低通过率阈值（0-100），低于此值退出码非零 */
    passRateThreshold: number;
    /** JSON 报告输出路径 */
    jsonReportPath: string;
  };
  interactive: boolean;
  mode: 'full' | 'incremental';
  /** 需求文档路径，设置后启用需求驱动模式 */
  specPath: string | null;
}

