import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { loadConfig } from '../config/index.js';
import { analyzeProject } from '../core/analyzer/index.js';
import { generateTestCases, generateIntegrationCases, generateFromRequirement } from '../core/generator/index.js';
import { parseRequirementDoc } from '../core/analyzer/requirement-parser.js';
import type { TestCase } from '../core/generator/types.js';
import { executeTestCases, executeIntegrationTests } from '../core/executor/index.js';
import type { ExecutionContext } from '../core/executor/types.js';
import { generateReport } from '../core/reporter/index.js';
import { createAIClient } from '../services/ai-client-factory.js';
import { FileService } from '../services/file-service.js';
import { DevServerManager } from '../services/dev-server.js';
import { collectCoverage } from '../services/coverage-service.js';
import { exportTestCasesToXMind } from '../services/xmind-export.js';
import { createSpinner } from '../ui/spinner.js';
import { logger } from '../ui/logger.js';
import { printResultsSummary, printCoverageSummary, printCostSummary } from '../ui/table.js';
import { promptCaseApproval, promptCaseSelection } from '../ui/prompts.js';
import type { TestCategory } from '../utils/constants.js';
import type { Config } from '../config/types.js';

interface RunOptions {
  path: string;
  category?: string;
  provider?: string;
  headed?: boolean;
  model?: string;
  interactive?: boolean;
  mode?: 'full' | 'incremental';
  coverage?: boolean;
  ci?: boolean;
  budget?: string;
  spec?: string;
}

/**
 * 估算成本（基于 token 价格配置）
 */
function estimateCost(
  tokenUsage: { promptTokens: number; completionTokens: number },
  config: Config,
): { totalCost: number; promptCost: number; completionCost: number } {
  const promptCost = (tokenUsage.promptTokens / 1000) * config.budget.pricePerPrompt1k;
  const completionCost = (tokenUsage.completionTokens / 1000) * config.budget.pricePerCompletion1k;
  return { totalCost: promptCost + completionCost, promptCost, completionCost };
}

/**
 * 检查预算是否超限
 */
function checkBudget(
  totalTokens: number,
  maxTokens: number,
): boolean {
  if (maxTokens <= 0) return true; // 不限制
  return totalTokens <= maxTokens;
}

/**
 * 生成 CI JSON 报告
 */
async function writeCiReport(
  reportPath: string,
  results: { caseId: string; feature: string; category: string; status: string; duration: number; errorDetail?: string }[],
  tokenUsage: { promptTokens: number; completionTokens: number; totalTokens: number },
  coverage: { lines: number; branches: number; functions: number; statements: number } | null,
  passRate: number,
  cost: { totalCost: number } | null,
) {
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      total: results.length,
      passed: results.filter(r => r.status === 'pass').length,
      failed: results.filter(r => r.status === 'fail').length,
      blocked: results.filter(r => r.status === 'blocked').length,
      skipped: results.filter(r => r.status === 'skipped').length,
      passRate,
    },
    tokenUsage,
    cost,
    coverage,
    results: results.map(r => ({
      caseId: r.caseId,
      feature: r.feature,
      category: r.category,
      status: r.status,
      duration: r.duration,
      errorDetail: r.errorDetail,
    })),
  };

  const dir = path.dirname(reportPath);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2), 'utf-8');
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
  if (options.coverage) {
    (cliOverrides as any).coverage = { enabled: true };
  }
  if (options.ci) {
    (cliOverrides as any).ci = { enabled: true };
    (cliOverrides as any).interactive = false;
  }
  if (options.budget) {
    const maxTokens = parseInt(options.budget, 10);
    if (!isNaN(maxTokens)) {
      (cliOverrides as any).budget = { maxTokens };
    }
  }
  if (options.spec) {
    (cliOverrides as any).specPath = options.spec;
  }

  const config = await loadConfig(projectPath, cliOverrides as any);

  // --no-interactive 必须在 loadConfig 之后强制覆盖
  if (options.interactive === false || config.ci.enabled) {
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

  let exitCode = 0;

  try {
    const aiClient = await createAIClient(config);

    // Step 1: Analyze project (always needed for metadata)
    logger.heading('Step 1: Analyzing project');
    const projectInfo = await analyzeProject(projectPath, config);

    // 检测模式：有需求文档 → 需求驱动模式，否则 → 代码驱动模式
    const isRequirementMode = !!config.specPath;
    let requirementSpec: Awaited<ReturnType<typeof parseRequirementDoc>> | null = null;

    if (isRequirementMode) {
      logger.info('Mode: Requirement-driven (from spec document)');
      try {
        requirementSpec = await parseRequirementDoc(config.specPath!);
        logger.success(`Parsed requirement doc: "${requirementSpec.title}" with ${requirementSpec.items.length} features`);
        for (const item of requirementSpec.items) {
          logger.info(`  - ${item.name}${item.priority ? ` [${item.priority}]` : ''}: ${item.acceptanceCriteria.length} ACs, ${item.uiSpecs.length} UI specs, ${item.apiSpecs.length} API specs`);
        }
      } catch (err) {
        logger.error(`Failed to parse requirement document: ${err instanceof Error ? err.message : String(err)}`);
        return;
      }
    } else {
      logger.info('Mode: Code-driven (from source analysis)');
      logger.success(`Found ${projectInfo.features.length} features`);
    }

    if (!isRequirementMode && projectInfo.features.length === 0) {
      logger.warn('No features detected. Nothing to test.');
      return;
    }
    if (isRequirementMode && requirementSpec && requirementSpec.items.length === 0) {
      logger.warn('No requirement items found in spec document. Nothing to test.');
      return;
    }

    const categoryFilter = options.category as TestCategory | undefined;

    // Token usage tracking
    const totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const addTokenUsage = (usage?: { promptTokens: number; completionTokens: number; totalTokens: number }) => {
      if (usage) {
        totalTokenUsage.promptTokens += usage.promptTokens;
        totalTokenUsage.completionTokens += usage.completionTokens;
        totalTokenUsage.totalTokens += usage.totalTokens;
      }
    };

    // Budget: 预估提示
    if (config.budget.maxTokens > 0) {
      logger.info(`Token budget: ${config.budget.maxTokens.toLocaleString()} tokens max`);
    }

    // Step 2: Generate test cases
    logger.heading('Step 2: Generating test cases');
    const allCases: TestCase[] = [];

    // 选择生成器：需求驱动 vs 代码驱动
    const generator = isRequirementMode && requirementSpec
      ? generateFromRequirement(requirementSpec, projectInfo, config, aiClient)
      : generateTestCases(projectInfo, config, aiClient);

    for await (const batch of generator) {
      addTokenUsage(batch.usage);

      // 预算检查：生成阶段超预算则停止
      if (config.budget.maxTokens > 0 && totalTokenUsage.totalTokens > config.budget.maxTokens) {
        logger.warn(`Budget exceeded during generation (${totalTokenUsage.totalTokens.toLocaleString()} / ${config.budget.maxTokens.toLocaleString()} tokens). Stopping generation.`);
        break;
      }

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

    // Export XMind test cases
    if (config.output.xmind) {
      try {
        const projectName = path.basename(projectPath);
        const xmindPath = await exportTestCasesToXMind(allCases, config.output.dir, projectName);
        logger.success(`XMind test cases exported to ${xmindPath}`);
      } catch (err) {
        logger.warn(`XMind export failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Step 3: Start dev server if WebUI tests exist
    const hasWebUI = allCases.some((c) => c.category === 'WebUI');
    let baseUrl: string | undefined;
    let devServerFailed = false;
    if (hasWebUI) {
      const s = (await import('@clack/prompts')).spinner();
      s.start('Starting dev server...');
      try {
        baseUrl = await devServer.ensureRunning();
        s.stop(`Dev server running at ${baseUrl}`);
      } catch (error) {
        devServerFailed = true;
        s.stop(`Dev server not available: ${error instanceof Error ? error.message : String(error)}`);
        // Dev server 不可用时，将 WebUI 测试标记为 blocked 并移除
        const webuiCount = allCases.filter(c => c.category === 'WebUI').length;
        logger.warn(`Skipping ${webuiCount} WebUI tests (no dev server)`);
      }
    }

    // 过滤掉无法执行的 WebUI 测试
    const executableCases = devServerFailed
      ? allCases.filter(c => c.category !== 'WebUI')
      : allCases;
    const blockedWebUIResults = devServerFailed
      ? allCases.filter(c => c.category === 'WebUI').map(c => ({
          caseId: c.caseId,
          feature: c.feature,
          category: c.category,
          description: c.description,
          status: 'blocked' as const,
          duration: 0,
          errorDetail: 'Dev server not available — WebUI test skipped',
        }))
      : [];

    // Build execution context
    const context: ExecutionContext = {
      projectPath,
      tempDir,
      artifactsDir,
      testRunner: projectInfo.detectedTestRunner,
      baseUrl,
      aiClient,
      retryConfig: config.retry,
      coverageConfig: config.coverage.enabled ? {
        enabled: true,
        provider: config.coverage.provider,
      } : undefined,
      webuiConfig: {
        browser: config.webui.browser,
        headless: config.webui.headless,
        timeout: config.webui.timeout,
      },
    };

    // Step 4: Execute tests
    logger.heading('Step 3: Executing test cases');
    if (config.retry.maxAttempts > 0) {
      logger.info(`Self-healing enabled: max ${config.retry.maxAttempts} fix attempts per failed test`);
    }
    if (config.coverage.enabled) {
      logger.info(`Coverage collection enabled (provider: ${config.coverage.provider})`);
    }

    const results = await executeTestCases(
      executableCases,
      context,
      fileService,
      projectInfo.mcp.servers,
    );

    // 添加 blocked 的 WebUI 结果
    results.push(...blockedWebUIResults as any);

    for (const r of results) {
      addTokenUsage(r.retryTokenUsage);
    }

    // Step 5: Integration tests
    if (!categoryFilter || categoryFilter === 'Frontend') {
      const failedFeatures = new Set(
        results.filter((r) => r.status === 'fail').map((r) => r.feature),
      );
      if (projectInfo.features.length > 1) {
        if (failedFeatures.size > 0) {
          logger.warn(`Integration tests: skipping features with failures: ${[...failedFeatures].join(', ')}`);
        }
        logger.heading('Step 4: Integration tests');
        const integrationResult = await generateIntegrationCases(projectInfo, config, aiClient);
        addTokenUsage(integrationResult.usage);
        const validCases = integrationResult.cases.filter(
          (c) => !failedFeatures.has(c.feature),
        );
        if (validCases.length > 0) {
          const integrationResults = await executeIntegrationTests(
            validCases,
            context,
            fileService,
          );
          results.push(...integrationResults);
          for (const r of integrationResults) {
            addTokenUsage(r.retryTokenUsage);
          }
        }
      }
    }

    // Step 6: Coverage collection
    let coverageReport = null;
    if (config.coverage.enabled) {
      logger.heading('Step 5: Collecting coverage');
      coverageReport = await collectCoverage(
        projectPath,
        projectInfo.detectedTestRunner,
        config.coverage.provider,
        config.coverage.thresholds,
      );
      if (coverageReport) {
        printCoverageSummary(coverageReport.summary);
        if (!coverageReport.thresholdsPassed) {
          logger.warn('Coverage thresholds not met:');
          for (const f of coverageReport.failures) {
            logger.warn(`  - ${f}`);
          }
          exitCode = 1;
        }
      }
    }

    // Step 7: Report
    logger.heading(config.coverage.enabled ? 'Step 6: Generating report' : 'Step 5: Generating report');
    const reportPath = await generateReport(results, projectInfo, config.output.reportFile, totalTokenUsage, coverageReport?.summary);
    logger.success(`Report saved to ${reportPath}`);

    // Cost summary
    const cost = estimateCost(totalTokenUsage, config);
    if (config.budget.pricePerPrompt1k > 0 || config.budget.pricePerCompletion1k > 0) {
      printCostSummary(totalTokenUsage, cost);
    }

    // Budget check
    if (!checkBudget(totalTokenUsage.totalTokens, config.budget.maxTokens)) {
      logger.warn(`Budget exceeded: ${totalTokenUsage.totalTokens.toLocaleString()} tokens used (limit: ${config.budget.maxTokens.toLocaleString()})`);
    }

    // Print summary
    printResultsSummary(results);

    // CI mode: JSON report + exit code
    const passRate = results.length > 0
      ? Math.round((results.filter(r => r.status === 'pass').length / results.length) * 1000) / 10
      : 0;

    if (config.ci.enabled) {
      await writeCiReport(
        config.ci.jsonReportPath,
        results,
        totalTokenUsage,
        coverageReport ? {
          lines: coverageReport.summary.lines.pct,
          branches: coverageReport.summary.branches.pct,
          functions: coverageReport.summary.functions.pct,
          statements: coverageReport.summary.statements.pct,
        } : null,
        passRate,
        cost.totalCost > 0 ? cost : null,
      );
      logger.success(`CI JSON report saved to ${config.ci.jsonReportPath}`);

      if (passRate < config.ci.passRateThreshold) {
        logger.error(`CI failed: pass rate ${passRate}% < threshold ${config.ci.passRateThreshold}%`);
        exitCode = 1;
      }
    }
  } finally {
    const cleanupResults = await Promise.allSettled([
      devServer.stop(),
      fileService.cleanup(),
    ]);
    for (const result of cleanupResults) {
      if (result.status === 'rejected') {
        logger.warn(`Cleanup warning: ${result.reason instanceof Error ? result.reason.message : String(result.reason)}`);
      }
    }
  }

  // CI 模式下设置退出码
  if (exitCode !== 0) {
    process.exit(exitCode);
  }
}

// Default action when no subcommand is given
export const handleFullWorkflow = handleRun;
