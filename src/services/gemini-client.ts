/**
 * Google Gemini (AI Studio) 客户端
 * 使用 @google/genai SDK
 */
import { GoogleGenAI } from '@google/genai';
import { retry } from '../utils/retry.js';
import type { AIClient, AIPrompt, AIResponse, TokenUsage } from './ai-client.js';

export class GeminiClient implements AIClient {
    readonly provider = 'gemini';
    readonly model: string;
    private ai: GoogleGenAI;
    private maxTokens: number;

    constructor(apiKey: string, model = 'gemini-2.5-pro', maxTokens = 65536) {
        this.ai = new GoogleGenAI({ apiKey });
        this.model = model;
        this.maxTokens = maxTokens;
    }

    async generate(prompt: AIPrompt): Promise<AIResponse> {
        return retry(
            async () => {
                const response = await this.ai.models.generateContent({
                    model: this.model,
                    contents: prompt.user,
                    config: {
                        maxOutputTokens: this.maxTokens,
                        systemInstruction: prompt.system,
                    }
                });
                return {
                    text: response.text ?? '',
                    usage: {
                        promptTokens: response.usageMetadata?.promptTokenCount ?? 0,
                        completionTokens: response.usageMetadata?.candidatesTokenCount ?? 0,
                        totalTokens: response.usageMetadata?.totalTokenCount ?? 0,
                    }
                };
            },
            {
                maxRetries: 10,
                baseDelay: 5000,
                onRetry: (_err, attempt) => {
                    console.log(`  重试 Gemini API 调用 (第 ${attempt} 次)...`);
                },
            },
        );
    }

    async * generateStream(prompt: AIPrompt): AsyncGenerator<string, AIResponse, unknown> {
        let responseStream;
        let attempt = 0;

        while (true) {
            try {
                responseStream = await this.ai.models.generateContentStream({
                    model: this.model,
                    contents: prompt.user,
                    config: {
                        maxOutputTokens: this.maxTokens,
                        systemInstruction: prompt.system,
                    }
                });
                break;
            } catch (err) {
                if (attempt >= 10) throw err;
                attempt++;
                console.error(`  重试 Gemini Stream API 调用 (第 ${attempt} 次)...`, err);
                await new Promise(r => setTimeout(r, 5000 * Math.pow(1.5, attempt - 1)));
            }
        }

        let fullText = '';
        let usage: TokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };

        for await (const chunk of responseStream) {
            if (chunk.text) {
                fullText += chunk.text;
                yield chunk.text;
            }
            if (chunk.usageMetadata) {
                usage = {
                    promptTokens: chunk.usageMetadata.promptTokenCount ?? usage.promptTokens,
                    completionTokens: chunk.usageMetadata.candidatesTokenCount ?? usage.completionTokens,
                    totalTokens: chunk.usageMetadata.totalTokenCount ?? usage.totalTokens,
                };
            }
        }

        return { text: fullText, usage };
    }
}
