import type { TestCategory, TestStatus } from '../../utils/constants.js';
import type { AIClient, TokenUsage } from '../../services/ai-client.js';

export interface TestResult {
  caseId: string;
  feature: string;
  category: TestCategory;
  description: string;
  status: TestStatus;
  stdout?: string;
  stderr?: string;
  duration: number;
  errorDetail?: string;
  screenshotPath?: string;
  artifactPaths?: string[];
  /** AI 自愈重试次数 */
  retryAttempts?: number;
  /** 是否经过了自愈重试 */
  wasRetried?: boolean;
  /** 重试消耗的 Token */
  retryTokenUsage?: TokenUsage;
}

export interface RetryConfig {
  maxAttempts: number;
  retrySyntaxErrors: boolean;
  retryAssertionErrors: boolean;
  retryTimeouts: boolean;
}

export interface ExecutionContext {
  projectPath: string;
  tempDir: string;
  artifactsDir: string;
  testRunner: string | null;
  baseUrl?: string;
  /** AI 客户端，用于自愈重试 */
  aiClient?: AIClient;
  /** 重试配置 */
  retryConfig?: RetryConfig;
}
