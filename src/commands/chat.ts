import * as p from '@clack/prompts';
import { handleRun } from './run.js';
import { handleAnalyze } from './analyze.js';
import { handleReport } from './report.js';
// 根据需要可以在这引入 ai-client 让大模型解析自然语言意图

export async function handleChat(options: any) {
    console.clear();
    p.intro('🚀 欢迎进入 AI-Test 交互式终端 (REPL)');
    p.note('提示: 可以使用斜杠指令 (如 /run, /analyze, /report, /exit) 直接执行任务。');

    while (true) {
        const userInput = await p.text({
            message: '❯ ',
            placeholder: '输入自然语言需求或 /指令',
        });

        if (p.isCancel(userInput)) {
            p.outro('👋 退出会话！');
            process.exit(0);
        }

        const text = (userInput as string).trim();

        if (!text) continue;

        if (text === '/exit' || text === 'exit' || text === 'quit') {
            p.outro('👋 再见！');
            break;
        } else if (text.startsWith('/run')) {
            const isIncremental = text.includes('incremental');
            p.log.info(`开始执行测试流水线 (模式: ${isIncremental ? 'incremental' : 'full'})...`);
            await handleRun({
                path: '.',
                mode: isIncremental ? 'incremental' : 'full',
            });
            p.log.success('流水线结单，回到对话。');
        } else if (text.startsWith('/analyze')) {
            await handleAnalyze({ path: '.' });
        } else if (text.startsWith('/report')) {
            await handleReport({ input: './test-results', output: './test-report.md' });
        } else if (text.startsWith('/')) {
            p.log.warn(`未知指令: ${text}`);
        } else {
            p.log.step(`正在思考: "${text}"`);
            // 可以在此处接入 AIClient 和 Tool Call 做意图路由
            p.log.message('说明: 本程序的常驻自然语言解析引擎正在开发对接中。目前您可以利用 /run 等指令先行调度。');
        }
    }
}
