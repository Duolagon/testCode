/**
 * AI 客户端工厂
 * 根据 Config 中的 provider 设置创建对应的 AI Client 实例
 */
import type { AIClient, AIProvider } from './ai-client.js';
import type { Config } from '../config/types.js';

// 按需延迟加载各 provider，避免未使用的 SDK 报错
export async function createAIClient(config: Config): Promise<AIClient> {
    const { provider, apiKey, model, maxTokens } = config.ai;

    if (!apiKey) {
        throw new Error(
            `未设置 API Key。请设置环境变量或在 ai-test.config.json 中配置 ai.apiKey\n` +
            `  Gemini:    export GEMINI_API_KEY=your-key\n` +
            `  Anthropic: export ANTHROPIC_API_KEY=your-key\n` +
            `  OpenAI:    export OPENAI_API_KEY=your-key`,
        );
    }

    switch (provider) {
        case 'gemini': {
            // 动态 import 以避免未安装 SDK 时报错
            const { GeminiClient } = await import('./gemini-client.js');
            return new GeminiClient(apiKey, model, maxTokens);
        }
        case 'anthropic': {
            const { ClaudeClient } = await import('./claude-client.js');
            return new ClaudeClient(apiKey, model, maxTokens);
        }
        case 'openai': {
            // 预留 OpenAI 接口，尚未实现
            throw new Error('OpenAI provider 暂未实现，请使用 gemini 或 anthropic');
        }
        default:
            throw new Error(`不支持的 AI provider: ${provider}`);
    }
}

// 返回各 provider 对应的环境变量名
export function getEnvKeyName(provider: AIProvider): string {
    switch (provider) {
        case 'gemini':
            return 'GEMINI_API_KEY';
        case 'anthropic':
            return 'ANTHROPIC_API_KEY';
        case 'openai':
            return 'OPENAI_API_KEY';
        default:
            return 'AI_API_KEY';
    }
}
