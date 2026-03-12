import * as path from 'node:path';
import * as fs from 'node:fs/promises';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { ensureDir } from '../../utils/fs.js';
import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext } from './types.js';
import type { McpServerConfig } from '../analyzer/types.js';

const MCP_OPERATION_TIMEOUT = 30_000; // 30s per MCP operation

function withTimeout<T>(promise: Promise<T>, ms: number, operation: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`MCP operation "${operation}" timed out after ${ms}ms`)), ms),
    ),
  ]);
}

interface McpTestStep {
  action: 'list_tools' | 'call_tool';
  toolName?: string;
  arguments?: Record<string, unknown>;
  expected?: {
    toolNames?: string[];
    hasContent?: boolean;
    contentType?: string;
    isError?: boolean;
  };
}

export async function executeMcpTest(
  testCase: TestCase,
  context: ExecutionContext,
  mcpServers: McpServerConfig[],
): Promise<TestResult> {
  const start = Date.now();
  const mcpLogsDir = path.join(context.artifactsDir, 'mcp');
  await ensureDir(mcpLogsDir);

  const server = mcpServers.find((s) => s.name === testCase.mcpServerName);
  if (!server) {
    return {
      caseId: testCase.caseId,
      feature: testCase.feature,
      category: testCase.category,
      description: testCase.description,
      status: 'blocked',
      duration: 0,
      errorDetail: `MCP server "${testCase.mcpServerName}" not found in config`,
    };
  }

  let client: Client | null = null;
  const logs: { request: unknown; response: unknown; timestamp: number }[] = [];

  try {
    // Parse test steps
    let steps: McpTestStep[];
    try {
      steps = JSON.parse(testCase.testCode);
    } catch {
      return {
        caseId: testCase.caseId,
        feature: testCase.feature,
        category: testCase.category,
        description: testCase.description,
        status: 'fail',
        duration: Date.now() - start,
        errorDetail: 'Invalid testCode: expected JSON array of MCP test steps',
      };
    }

    // Connect to MCP server
    if (server.transport === 'stdio') {
      const transport = new StdioClientTransport({
        command: server.command,
        args: server.args,
        env: server.env as Record<string, string> | undefined,
      });
      client = new Client({ name: 'ai-test-client', version: '1.0.0' });
      await withTimeout(client.connect(transport), MCP_OPERATION_TIMEOUT, 'connect');
    } else {
      return {
        caseId: testCase.caseId,
        feature: testCase.feature,
        category: testCase.category,
        description: testCase.description,
        status: 'blocked',
        duration: Date.now() - start,
        errorDetail: `Transport "${server.transport}" not yet supported`,
      };
    }

    // Execute test steps
    for (const step of steps) {
      if (step.action === 'list_tools') {
        const result = await withTimeout(client.listTools(), MCP_OPERATION_TIMEOUT, 'list_tools');
        logs.push({ request: { action: 'list_tools' }, response: result, timestamp: Date.now() });

        if (step.expected?.toolNames) {
          const actualNames = result.tools.map((t) => t.name);
          for (const expectedName of step.expected.toolNames) {
            if (!actualNames.includes(expectedName)) {
              throw new Error(
                `Expected tool "${expectedName}" not found. Available: ${actualNames.join(', ')}`,
              );
            }
          }
        }
      } else if (step.action === 'call_tool') {
        if (!step.toolName) throw new Error('call_tool step missing toolName');

        const result = await withTimeout(
          client.callTool({ name: step.toolName, arguments: step.arguments ?? {} }),
          MCP_OPERATION_TIMEOUT,
          `call_tool:${step.toolName}`,
        );
        logs.push({
          request: { action: 'call_tool', toolName: step.toolName, arguments: step.arguments },
          response: result,
          timestamp: Date.now(),
        });

        if (step.expected?.isError && !result.isError) {
          throw new Error(`Expected error but got success for tool "${step.toolName}"`);
        }
        if (step.expected?.isError === false && result.isError) {
          throw new Error(
            `Expected success but got error for tool "${step.toolName}": ${JSON.stringify(result.content)}`,
          );
        }
        if (step.expected?.hasContent && (!result.content || (result.content as unknown[]).length === 0)) {
          throw new Error(`Expected content but got empty response for tool "${step.toolName}"`);
        }
      }
    }

    // Save logs
    const logPath = path.join(mcpLogsDir, `${testCase.caseId}.json`);
    await fs.writeFile(logPath, JSON.stringify(logs, null, 2));

    return {
      caseId: testCase.caseId,
      feature: testCase.feature,
      category: testCase.category,
      description: testCase.description,
      status: 'pass',
      duration: Date.now() - start,
      artifactPaths: [logPath],
    };
  } catch (error) {
    // Save logs even on failure
    const logPath = path.join(mcpLogsDir, `${testCase.caseId}.json`);
    try {
      await fs.writeFile(logPath, JSON.stringify(logs, null, 2));
    } catch {}

    return {
      caseId: testCase.caseId,
      feature: testCase.feature,
      category: testCase.category,
      description: testCase.description,
      status: 'fail',
      duration: Date.now() - start,
      errorDetail: error instanceof Error ? error.message : String(error),
      artifactPaths: [logPath],
    };
  } finally {
    try {
      await client?.close();
    } catch {}
  }
}
