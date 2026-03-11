/**
 * 统一的 AI 客户端接口
 * 所有大模型 provider 都实现此接口，上层业务代码只依赖接口
 */

// 统一的 prompt 格式
export interface AIPrompt {
  system: string;
  user: string;
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AIResponse {
  text: string;
  usage: TokenUsage;
}

// 所有 AI Client 必须实现的接口
export interface AIClient {
  /** provider 名称，用于日志显示 */
  readonly provider: string;
  /** 当前使用的模型名 */
  readonly model: string;
  /** 根据 prompt 生成文本响应 */
  generate(prompt: AIPrompt): Promise<AIResponse>;
  /** 根据 prompt 返回字符流生成响应，用于打字机效果 */
  generateStream(prompt: AIPrompt): AsyncGenerator<string, AIResponse, unknown>;
}

// 支持的 provider 枚举
export const AI_PROVIDERS = ['gemini', 'anthropic', 'openai'] as const;
export type AIProvider = (typeof AI_PROVIDERS)[number];
