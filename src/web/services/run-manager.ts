import * as path from 'node:path';
import * as crypto from 'node:crypto';
import { loadConfig } from '../../config/index.js';
import { analyzeProject } from '../../core/analyzer/index.js';
import { generateTestCases, generateIntegrationCases, generateFromRequirement } from '../../core/generator/index.js';
import { parseRequirementDoc } from '../../core/analyzer/requirement-parser.js';
import type { TestCase } from '../../core/generator/types.js';
import { executeTestCases, executeIntegrationTests } from '../../core/executor/index.js';
import type { ExecutionContext } from '../../core/executor/types.js';
import type { TestResult } from '../../core/executor/types.js';
import { generateReport } from '../../core/reporter/index.js';
import { createAIClient } from '../../services/ai-client-factory.js';
import { FileService } from '../../services/file-service.js';
import { DevServerManager } from '../../services/dev-server.js';
import { collectCoverage } from '../../services/coverage-service.js';
import { exportTestCasesToXMind } from '../../services/xmind-export.js';
import type { TestCategory } from '../../utils/constants.js';
import { eventBus } from './event-bus.js';

export interface RunConfig {
  path: string;
  category?: string;
  provider?: string;
  model?: string;
  mode?: 'full' | 'incremental';
  coverage?: boolean;
  headed?: boolean;
  spec?: string;
}

interface RunState {
  id: string;
  status: 'running' | 'completed' | 'failed';
  results: TestResult[];
  report?: string;
  summary?: Record<string, unknown>;
  error?: string;
}

const runs = new Map<string, RunState>();

export function getRunState(runId: string): RunState | undefined {
  return runs.get(runId);
}

export function startRun(config: RunConfig): string {
  const runId = crypto.randomUUID().slice(0, 8);
  const state: RunState = {
    id: runId,
    status: 'running',
    results: [],
  };
  runs.set(runId, state);

  // Run async, don't await
  executeRun(runId, config, state).catch((err) => {
    state.status = 'failed';
    state.error = err instanceof Error ? err.message : String(err);
    eventBus.emitError(runId, state.error);
  });

  return runId;
}

async function executeRun(runId: string, runConfig: RunConfig, state: RunState) {
  const projectPath = path.resolve(runConfig.path);
  const emit = eventBus;

  // Build config overrides
  const cliOverrides: Record<string, unknown> = {};
  if (runConfig.provider) {
    (cliOverrides as any).ai = { provider: runConfig.provider };
  }
  if (runConfig.model) {
    (cliOverrides as any).ai = { ...(cliOverrides as any).ai, model: runConfig.model };
  }
  if (runConfig.headed !== undefined) {
    (cliOverrides as any).webui = { headless: !runConfig.headed };
  }
  if (runConfig.mode) {
    cliOverrides.mode = runConfig.mode;
  }
  if (runConfig.coverage) {
    (cliOverrides as any).coverage = { enabled: true };
  }
  if (runConfig.spec) {
    (cliOverrides as any).specPath = runConfig.spec;
  }
  cliOverrides.interactive = false;

  const config = await loadConfig(projectPath, cliOverrides as any);
  config.interactive = false;

  // Validate API key
  if (!config.ai.apiKey) {
    throw new Error(`AI API Key not set. Set ${config.ai.provider === 'gemini' ? 'GEMINI_API_KEY' : config.ai.provider === 'anthropic' ? 'ANTHROPIC_API_KEY' : 'OPENAI_API_KEY'} environment variable.`);
  }

  const fileService = new FileService(config.output.dir, projectPath);
  const { tempDir, artifactsDir } = await fileService.init();
  const devServer = new DevServerManager(projectPath, config.webui);

  try {
    const aiClient = await createAIClient(config);

    // Step 1: Analyze
    emit.emitStep(runId, 'Step 1: Analyzing project');
    const projectInfo = await analyzeProject(projectPath, config);

    const isRequirementMode = !!config.specPath;
    let requirementSpec: Awaited<ReturnType<typeof parseRequirementDoc>> | null = null;

    if (isRequirementMode) {
      emit.emitLog(runId, 'info', 'Mode: Requirement-driven');
      requirementSpec = await parseRequirementDoc(config.specPath!);
      emit.emitLog(runId, 'success', `Parsed requirement doc: "${requirementSpec.title}" with ${requirementSpec.items.length} features`);
    } else {
      emit.emitLog(runId, 'info', 'Mode: Code-driven');
      emit.emitLog(runId, 'success', `Found ${projectInfo.features.length} features`);
      for (const f of projectInfo.features) {
        emit.emitLog(runId, 'info', `  - ${f.name} (${f.applicableCategories.join(', ')})`);
      }
    }

    if (!isRequirementMode && projectInfo.features.length === 0) {
      emit.emitLog(runId, 'warn', 'No features detected. Nothing to test.');
      state.status = 'completed';
      state.summary = { total: 0, passed: 0, failed: 0 };
      emit.emitComplete(runId, state.summary);
      return;
    }

    const categoryFilter = runConfig.category as TestCategory | undefined;
    const totalTokenUsage = { promptTokens: 0, completionTokens: 0, totalTokens: 0 };
    const addTokenUsage = (usage?: { promptTokens: number; completionTokens: number; totalTokens: number }) => {
      if (usage) {
        totalTokenUsage.promptTokens += usage.promptTokens;
        totalTokenUsage.completionTokens += usage.completionTokens;
        totalTokenUsage.totalTokens += usage.totalTokens;
      }
    };

    // Step 2: Generate test cases
    emit.emitStep(runId, 'Step 2: Generating test cases');
    const allCases: TestCase[] = [];

    const generator = isRequirementMode && requirementSpec
      ? generateFromRequirement(requirementSpec, projectInfo, config, aiClient)
      : generateTestCases(projectInfo, config, aiClient);

    for await (const batch of generator) {
      addTokenUsage(batch.usage);
      if (categoryFilter && batch.category !== categoryFilter) continue;
      if (batch.cases.length === 0) continue;
      allCases.push(...batch.cases);
      emit.emitLog(runId, 'info', `Generated ${batch.cases.length} cases for ${batch.featureName} [${batch.category}]`);
    }

    if (allCases.length === 0) {
      emit.emitLog(runId, 'warn', 'No test cases to execute.');
      state.status = 'completed';
      state.summary = { total: 0, passed: 0, failed: 0 };
      emit.emitComplete(runId, state.summary);
      return;
    }

    emit.emitLog(runId, 'success', `Total test cases to execute: ${allCases.length}`);

    // Export XMind test cases
    if (config.output.xmind) {
      try {
        const projectName = path.basename(projectPath);
        const xmindPath = await exportTestCasesToXMind(allCases, config.output.dir, projectName);
        emit.emitLog(runId, 'success', `XMind test cases exported to ${xmindPath}`);
      } catch (err) {
        emit.emitLog(runId, 'warn', `XMind export failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }

    // Step 3: Dev server for WebUI
    const hasWebUI = allCases.some(c => c.category === 'WebUI');
    let baseUrl: string | undefined;
    let devServerFailed = false;
    if (hasWebUI) {
      emit.emitLog(runId, 'info', 'Starting dev server...');
      try {
        baseUrl = await devServer.ensureRunning();
        emit.emitLog(runId, 'success', `Dev server running at ${baseUrl}`);
      } catch (error) {
        devServerFailed = true;
        emit.emitLog(runId, 'warn', `Dev server not available: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

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
          errorDetail: 'Dev server not available',
        }))
      : [];

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

    // Step 4: Execute
    emit.emitStep(runId, 'Step 3: Executing test cases');
    emit.emitProgress(runId, 0, executableCases.length);

    let completedCount = 0;
    const results = await executeTestCases(
      executableCases,
      context,
      fileService,
      projectInfo.mcp.servers,
      undefined,
      {
        silent: true,
        onResult: (result) => {
          completedCount++;
          state.results.push(result);
          emit.emitResult(runId, result as any);
          emit.emitProgress(runId, completedCount, executableCases.length);
        },
      },
    );

    results.push(...blockedWebUIResults as any);
    for (const r of blockedWebUIResults) {
      state.results.push(r as any);
      emit.emitResult(runId, r as any);
    }

    for (const r of results) {
      addTokenUsage((r as any).retryTokenUsage);
    }

    // Step 5: Integration tests
    if (!categoryFilter || categoryFilter === 'Frontend') {
      const failedFeatures = new Set(
        results.filter(r => r.status === 'fail').map(r => r.feature),
      );
      if (projectInfo.features.length > 1) {
        emit.emitStep(runId, 'Step 4: Integration tests');
        const integrationResult = await generateIntegrationCases(projectInfo, config, aiClient);
        addTokenUsage(integrationResult.usage);
        const validCases = integrationResult.cases.filter(c => !failedFeatures.has(c.feature));
        if (validCases.length > 0) {
          const integrationResults = await executeIntegrationTests(
            validCases,
            context,
            fileService,
            undefined,
            {
              silent: true,
              onResult: (result) => {
                state.results.push(result);
                emit.emitResult(runId, result as any);
              },
            },
          );
          results.push(...integrationResults);
        }
      }
    }

    // Step 6: Coverage
    let coverageReport = null;
    if (config.coverage.enabled) {
      emit.emitStep(runId, 'Step 5: Collecting coverage');
      coverageReport = await collectCoverage(
        projectPath,
        projectInfo.detectedTestRunner,
        config.coverage.provider,
        config.coverage.thresholds,
      );
    }

    // Step 7: Report
    emit.emitStep(runId, 'Generating report');
    const reportPath = await generateReport(results, projectInfo, config.output.reportFile, totalTokenUsage, coverageReport?.summary);
    emit.emitLog(runId, 'success', `Report saved to ${reportPath}`);

    // Read report content
    const fs = await import('node:fs/promises');
    try {
      state.report = await fs.readFile(reportPath, 'utf-8');
    } catch {}

    // Summary
    const passed = results.filter(r => r.status === 'pass').length;
    const failed = results.filter(r => r.status === 'fail').length;
    const blocked = results.filter(r => r.status === 'blocked').length;
    const skipped = results.filter(r => r.status === 'skipped').length;

    state.status = 'completed';
    state.summary = {
      total: results.length,
      passed,
      failed,
      blocked,
      skipped,
      passRate: results.length > 0 ? Math.round((passed / results.length) * 1000) / 10 : 0,
      tokenUsage: totalTokenUsage,
    };

    emit.emitComplete(runId, state.summary);
  } finally {
    await Promise.allSettled([
      devServer.stop(),
      fileService.cleanup(),
    ]);
  }
}
