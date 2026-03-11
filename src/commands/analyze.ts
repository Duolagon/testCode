import * as path from 'node:path';
import { loadConfig } from '../config/index.js';
import { analyzeProject } from '../core/analyzer/index.js';
import { createSpinner } from '../ui/spinner.js';
import { logger } from '../ui/logger.js';
import { printFeatureTable } from '../ui/table.js';

interface AnalyzeOptions {
  path: string;
  output?: string;
}

export async function handleAnalyze(options: AnalyzeOptions) {
  const projectPath = path.resolve(options.path);
  const config = await loadConfig(projectPath);

  const spinner = createSpinner('Analyzing project structure...');
  spinner.start();

  try {
    const projectInfo = await analyzeProject(projectPath, config);
    spinner.succeed('Project analysis complete');

    // Print summary
    logger.heading('Project Summary');
    logger.info(`Path: ${projectInfo.projectPath}`);
    logger.info(`Files scanned: ${projectInfo.files.length}`);

    if (projectInfo.frontend.framework) {
      logger.info(`Frontend framework: ${projectInfo.frontend.framework}`);
      logger.info(`Routes: ${projectInfo.frontend.routes.length}`);
      logger.info(`Components: ${projectInfo.frontend.components.length}`);
    } else {
      logger.dim('No frontend framework detected');
    }

    if (projectInfo.backend.framework) {
      logger.info(`Backend framework: ${projectInfo.backend.framework}`);
      logger.info(`Endpoints: ${projectInfo.backend.endpoints.length}`);
    } else {
      logger.dim('No backend framework detected');
    }

    if (projectInfo.mcp.servers.length > 0) {
      logger.info(`MCP Servers: ${projectInfo.mcp.servers.length}`);
      for (const s of projectInfo.mcp.servers) {
        logger.dim(`  - ${s.name} (${s.transport})`);
      }
    } else {
      logger.dim('No MCP servers found');
    }

    if (projectInfo.detectedTestRunner) {
      logger.info(`Test runner: ${projectInfo.detectedTestRunner}`);
    }

    // Print feature map
    if (projectInfo.features.length > 0) {
      logger.heading('Feature Map');
      printFeatureTable(projectInfo.features);
    } else {
      logger.warn('No features detected. The project may be empty or not supported.');
    }

    // Save output if requested
    if (options.output) {
      const fs = await import('node:fs/promises');
      await fs.writeFile(options.output, JSON.stringify(projectInfo, null, 2));
      logger.success(`Analysis saved to ${options.output}`);
    }
  } catch (error) {
    spinner.fail('Analysis failed');
    logger.error(error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}
