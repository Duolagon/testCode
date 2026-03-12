import 'dotenv/config';
import { Command } from 'commander';
import { handleAnalyze } from '../commands/analyze.js';
import { handleRun, handleFullWorkflow } from '../commands/run.js';
import { handleReport } from '../commands/report.js';
import { handleInit } from '../commands/init.js';
import { handleChat } from '../commands/chat.js';
import { handleWeb } from '../commands/web.js';

const program = new Command();

program
  .name('ai-test')
  .description('AI-powered automated testing tool')
  .version('0.1.0');

program
  .command('analyze')
  .description('Analyze the project and identify features')
  .option('-p, --path <dir>', 'Target project path', '.')
  .option('-o, --output <file>', 'Save analysis result to file')
  .action(handleAnalyze);

program
  .command('run')
  .description('Run the full test workflow')
  .option('-p, --path <dir>', 'Target project path', '.')
  .option('-c, --category <cat>', 'Run only specific category (Frontend|Backend|WebUI|MCP)')
  .option('--provider <provider>', 'AI provider (gemini|anthropic|openai)')
  .option('--headed', 'Run browser tests in headed mode')
  .option('--model <model>', 'AI model to use')
  .option('--no-interactive', 'Skip interactive approval prompts')
  .option('--mode <mode>', 'Test mode (full|incremental)', 'full')
  .option('--coverage', 'Enable code coverage collection')
  .option('--ci', 'CI mode: JSON report output, exit code on failure')
  .option('--budget <tokens>', 'Max token budget for this run')
  .option('--spec <file>', 'Path to requirement document (enables requirement-driven mode)')
  .action(handleRun);

program
  .command('report')
  .description('Display the last test report')
  .option('-i, --input <dir>', 'Results directory', './test-results')
  .option('-o, --output <file>', 'Report file path', './test-report.md')
  .action(handleReport);

program
  .command('init')
  .description('Initialize ai-test configuration')
  .option('--ci', 'Also generate GitHub Actions workflow file')
  .action(handleInit);

program
  .command('chat')
  .description('Start the AI interactive REPL session')
  .action(handleChat);

program
  .command('web')
  .description('Start the web UI for interactive testing')
  .option('-p, --port <port>', 'Server port', '3456')
  .option('--path <dir>', 'Target project path', '.')
  .action(handleWeb);

// 默认动作: 不带参数进入交互模式 (如果需要单次调用请使用具体的子命令如 run)
program
  .action(handleChat);

program.parseAsync(process.argv);

