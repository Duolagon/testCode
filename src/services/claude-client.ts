import Anthropic from '@anthropic-ai/sdk';
import { retry } from '../utils/retry.js';
import type { AIClient, AIPrompt, AIResponse, TokenUsage } from './ai-client.js';

export class ClaudeClient implements AIClient {
  readonly provider = 'anthropic';
  readonly model: string;
  private client: Anthropic;
  private maxTokens: number;

  constructor(apiKey: string, model = 'claude-sonnet-4-20250514', maxTokens = 8192) {
    this.client = new Anthropic({ apiKey });
    this.model = model;
    this.maxTokens = maxTokens;
  }

  async generate(prompt: AIPrompt): Promise<AIResponse> {
    return retry(
      async () => {
        const response = await this.client.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          system: prompt.system,
          messages: [{ role: 'user', content: prompt.user }],
        });

        const text = response.content
          .filter((block): block is Anthropic.TextBlock => block.type === 'text')
          .map((block) => block.text)
          .join('');
        return {
          text,
          usage: {
            promptTokens: response.usage.input_tokens,
            completionTokens: response.usage.output_tokens,
            totalTokens: response.usage.input_tokens + response.usage.output_tokens,
          }
        };
      },
      {
        maxRetries: 2,
        baseDelay: 2000,
        onRetry: (_err, attempt) => {
          console.log(`  重试 Claude API 调用 (第 ${attempt} 次)...`);
        },
      },
    );
  }

  async * generateStream(prompt: AIPrompt): AsyncGenerator<string, AIResponse, unknown> {
    let stream;
    let attempt = 0;
    while (true) {
      try {
        stream = await this.client.messages.create({
          model: this.model,
          max_tokens: this.maxTokens,
          system: prompt.system,
          messages: [{ role: 'user', content: prompt.user }],
          stream: true,
        });
        break;
      } catch (err) {
        if (attempt >= 2) throw err;
        attempt++;
        console.log(`  重试 Claude Stream API 调用 (第 ${attempt} 次)...`);
        await new Promise(r => setTimeout(r, 2000 * Math.pow(2, attempt - 1)));
      }
    }

    let fullText = '';
    let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

    for await (const chunk of stream) {
      if (chunk.type === 'message_start' && chunk.message.usage) {
        usage.promptTokens = chunk.message.usage.input_tokens;
      } else if (chunk.type === 'content_block_delta' && chunk.delta.type === 'text_delta') {
        fullText += chunk.delta.text;
        yield chunk.delta.text;
      } else if (chunk.type === 'message_delta' && chunk.usage) {
        usage.completionTokens = chunk.usage.output_tokens;
        usage.totalTokens = usage.promptTokens + usage.completionTokens;
      }
    }

    return { text: fullText, usage };
  }
}
