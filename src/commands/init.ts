import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { fileExists } from '../utils/fs.js';
import { defaultConfig } from '../config/defaults.js';
import { logger } from '../ui/logger.js';

export async function handleInit() {
  const configPath = path.resolve('ai-test.config.json');

  if (await fileExists(configPath)) {
    logger.warn('ai-test.config.json 已存在，跳过。');
    return;
  }

  const configContent = {
    ai: {
      provider: defaultConfig.ai.provider,
      model: defaultConfig.ai.model,
      maxTokens: defaultConfig.ai.maxTokens,
    },
    project: {
      exclude: defaultConfig.project.exclude,
    },
    webui: {
      baseUrl: defaultConfig.webui.baseUrl,
      browser: defaultConfig.webui.browser,
      headless: defaultConfig.webui.headless,
    },
    mcp: {
      configPath: null,
      timeout: defaultConfig.mcp.timeout,
    },
    output: {
      dir: defaultConfig.output.dir,
      reportFile: defaultConfig.output.reportFile,
      screenshots: defaultConfig.output.screenshots,
    },
    interactive: defaultConfig.interactive,
  };

  await fs.writeFile(configPath, JSON.stringify(configContent, null, 2) + '\n', 'utf-8');
  logger.success(`已创建 ${configPath}`);
  logger.info('设置 API Key: export GEMINI_API_KEY=your-key');
  logger.info('切换 provider: 在配置文件中修改 ai.provider 为 "gemini" | "anthropic" | "openai"');
}

