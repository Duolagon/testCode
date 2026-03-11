import * as path from 'node:path';
import { loadConfig } from '../config/index.js';
import { analyzeProject } from '../core/analyzer/index.js';
import { generateTestCases, generateIntegrationCases } from '../core/generator/index.js';
import type { TestCase } from '../core/generator/types.js';
import { executeTestCases, executeIntegrationTests } from '../core/executor/index.js';
import type { ExecutionContext } from '../core/executor/types.js';
import { generateReport } from '../core/reporter/index.js';
import { createAIClient } from '../services/ai-client-factory.js';
import { FileService } from '../services/file-service.js';
import { DevServerManager } from '../services/dev-server.js';
import { createSpinner } from '../ui/spinner.js';
import { logger } from '../ui/logger.js';
import { printResultsSummary } from '../ui/table.js';
import { promptCaseApproval, promptCaseSelection } from '../ui/prompts.js';
import type { TestCategory } from '../utils/constants.js';

interface RunOptions {
  path: string;
  category?: string;
  provider?: string;
  headed?: boolean;
  model?: string;
  interactive?: boolean;
  mode?: 'full' | 'incremental';
}

export async function handleRun(options: RunOptions) {
  const projectPath = path.resolve(options.path);

  // 构建 CLI 覆盖配置
  const cliOverrides: Record<string, unknown> = {};
  if (options.provider) {
    (cliOverrides as any).ai = { ...(cliOverrides as any).ai, provider: options.provider };
  }
  if (options.model) {
    (cliOverrides as any).ai = { ...(cliOverrides as any).ai, model: options.model };
  }
  if (options.headed !== undefined) {
    (cliOverrides as any).webui = { headless: !options.headed };
  }
  if (options.mode) {
    cliOverrides.mode = options.mode;
  }
  const config = await loadConfig(projectPath, cliOverrides as any);

  // --no-interactive 必须在 loadConfig 之后强制覆盖（deepMerge 中 false 不会被正确合并）
  if (options.interactive === false) {
    config.interactive = false;
  }

  // 校验 API Key
  if (!config.ai.apiKey) {
    logger.error(`AI API Key 未设置。请运行: export ${config.ai.provider === 'gemini' ? 'GEMINI_API_KEY' : config.ai.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'}=your-key`);
    process.exit(1);
  }

  // Initialize file service
  const fileService = new FileService(config.output.dir, projectPath);
  const { tempDir, artifactsDir } = await fileService.init();

  // Dev server manager (for WebUI tests)
  const devServer = new DevServerManager(projectPath, config.webui);

  try {
    // 提前创建 AI 客户端，供生成和自愈重试共用
    const aiClient = await createAIClient(config);

    // Step 1: Analyze
    logger.heading('Step 1: Analyzing project');
    const projectInfo = await analyzeProject(projectPath, config);
    logger.success(`Found ${projectInfo.features.length} features`);

    if (projectInfo.features.length === 0) {
      logger.warn('No features detected. Nothing to test.');
      return;
    }

    // Filter by category if specified
    const categoryFilter = options.category as TestCategory | undefined;

    // Helper for token usage
    const totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const addTokenUsage = (usage?: { promptTokens: number; completionTokens: number; totalTokens: number }) => {
      if (usage) {
        totalTokenUsage.promptTokens += usage.promptTokens;
        totalTokenUsage.completionTokens += usage.completionTokens;
        totalTokenUsage.totalTokens += usage.totalTokens;
      }
    };

    // Step 2: Generate test cases (复用 aiClient)
    logger.heading('Step 2: Generating test cases');
    const allCases: TestCase[] = [];

    for await (const batch of generateTestCases(projectInfo, config, aiClient)) {
      addTokenUsage(batch.usage);
      if (categoryFilter && batch.category !== categoryFilter) continue;
      if (batch.cases.length === 0) continue;

      // Interactive approval
      if (config.interactive) {
        const action = await promptCaseApproval(batch.featureName, batch.cases);
        if (action === 'skip') continue;
        if (action === 'approve_all') {
          allCases.push(...batch.cases);
        } else if (action === 'select') {
          const selectedCases = await promptCaseSelection(batch.cases);
          allCases.push(...selectedCases);
        } else if (action === 'regenerate') {
          // TODO: regenerate cases
          logger.warn('Regeneration not yet implemented, skipping');
          continue;
        }
      } else {
        allCases.push(...batch.cases);
      }
    }

    if (allCases.length === 0) {
      logger.warn('No test cases to execute.');
      return;
    }

    logger.success(`Total test cases to execute: ${allCases.length}`);

    // Step 3: Start dev server if WebUI tests exist
    const hasWebUI = allCases.some((c) => c.category === 'WebUI');
    let baseUrl: string | undefined;
    if (hasWebUI) {
      const s = (await import('@clack/prompts')).spinner();
      s.start('Starting dev server...');
      try {
        baseUrl = await devServer.ensureRunning();
        s.stop(`Dev server running at ${baseUrl}`);
      } catch (error) {
        s.stop(`Dev server not available: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    // Build execution context（注入 aiClient 和 retryConfig 以启用自愈重试）
    const context: ExecutionContext = {
      projectPath,
      tempDir,
      artifactsDir,
      testRunner: projectInfo.detectedTestRunner,
      baseUrl,
      aiClient,
      retryConfig: config.retry,
    };

    // Step 4: Execute tests (含自愈重试)
    logger.heading('Step 3: Executing test cases');
    if (config.retry.maxAttempts > 0) {
      logger.info(`Self-healing enabled: max ${config.retry.maxAttempts} fix attempts per failed test`);
    }
    const results = await executeTestCases(
      allCases,
      context,
      fileService,
      projectInfo.mcp.servers,
    );

    // 累加重试消耗的 Token
    for (const r of results) {
      addTokenUsage(r.retryTokenUsage);
    }

    // Step 5: Integration tests (复用 aiClient)
    if (!categoryFilter || categoryFilter === 'Frontend') {
      const failedCount = results.filter((r) => r.status === 'fail').length;
      if (failedCount === 0 && projectInfo.features.length > 1) {
        logger.heading('Step 4: Integration tests');
        const integrationResult = await generateIntegrationCases(projectInfo, config, aiClient);
        addTokenUsage(integrationResult.usage);
        if (integrationResult.cases.length > 0) {
          const integrationResults = await executeIntegrationTests(
            integrationResult.cases,
            context,
            fileService,
          );
          results.push(...integrationResults);
          // 累加集成测试的重试 Token
          for (const r of integrationResults) {
            addTokenUsage(r.retryTokenUsage);
          }
        }
      } else if (failedCount > 0) {
        logger.warn(`Skipping integration tests: ${failedCount} unit/E2E test(s) failed`);
      }
    }

    // Step 6: Report
    logger.heading('Step 5: Generating report');
    const reportPath = await generateReport(results, projectInfo, config.output.reportFile, totalTokenUsage);
    logger.success(`Report saved to ${reportPath}`);

    // Print summary
    printResultsSummary(results);
  } finally {
    await devServer.stop();
    await fileService.cleanup();
  }
}

// Default action when no subcommand is given
export const handleFullWorkflow = handleRun;
