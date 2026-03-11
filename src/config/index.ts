import * as path from 'node:path';
import { readJsonFile } from '../utils/fs.js';
import { defaultConfig } from './defaults.js';
import { getEnvKeyName } from '../services/ai-client-factory.js';
import type { Config } from './types.js';

function deepMerge(target: Record<string, any>, source: Record<string, any>): Record<string, any> {
  const result = { ...target };
  for (const key of Object.keys(source)) {
    const sourceVal = source[key];
    const targetVal = target[key];
    if (
      sourceVal !== undefined &&
      sourceVal !== null &&
      typeof sourceVal === 'object' &&
      !Array.isArray(sourceVal) &&
      typeof targetVal === 'object' &&
      !Array.isArray(targetVal) &&
      targetVal !== null
    ) {
      result[key] = deepMerge(targetVal, sourceVal);
    } else if (sourceVal !== undefined) {
      result[key] = sourceVal;
    }
  }
  return result;
}

export async function loadConfig(
  projectPath: string,
  cliOverrides: Partial<Config> = {},
): Promise<Config> {
  // 加载配置文件
  const configPath = path.join(projectPath, 'ai-test.config.json');
  const fileConfig = (await readJsonFile<Record<string, any>>(configPath)) ?? {};

  // 兼容旧配置：如果存在 anthropic 字段，映射到 ai
  if (fileConfig.anthropic && !fileConfig.ai) {
    fileConfig.ai = { ...fileConfig.anthropic, provider: 'anthropic' };
    delete fileConfig.anthropic;
  }

  // 合并：defaults < file < CLI overrides
  let config = deepMerge(defaultConfig as any, fileConfig) as Config;
  config = deepMerge(config as any, cliOverrides as any) as Config;

  // 从环境变量读取 API Key（如果未设置）
  if (!config.ai.apiKey) {
    const envKey = getEnvKeyName(config.ai.provider);
    config.ai.apiKey = process.env[envKey] ?? process.env.AI_API_KEY ?? '';
  }

  return config;
}

export type { Config } from './types.js';

