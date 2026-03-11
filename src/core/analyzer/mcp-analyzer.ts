import * as path from 'node:path';
import * as os from 'node:os';
import { readJsonFile, fileExists } from '../../utils/fs.js';
import type { McpInfo, McpServerConfig } from './types.js';

interface McpConfigFile {
  mcpServers?: Record<
    string,
    {
      command: string;
      args?: string[];
      env?: Record<string, string>;
      transport?: 'stdio' | 'sse' | 'http';
      url?: string;
    }
  >;
}

const CONFIG_SEARCH_PATHS = [
  'mcp.json',
  '.mcp.json',
  '.mcp/config.json',
];

export async function analyzeMcp(
  projectPath: string,
  customConfigPath?: string | null,
): Promise<McpInfo> {
  const servers: McpServerConfig[] = [];

  // Search for config files
  const searchPaths = customConfigPath
    ? [customConfigPath]
    : [
        ...CONFIG_SEARCH_PATHS.map((p) => path.join(projectPath, p)),
        path.join(os.homedir(), '.claude', 'claude_desktop_config.json'),
      ];

  for (const configPath of searchPaths) {
    if (await fileExists(configPath)) {
      const config = await readJsonFile<McpConfigFile>(configPath);
      if (config?.mcpServers) {
        for (const [name, serverConf] of Object.entries(config.mcpServers)) {
          servers.push({
            name,
            command: serverConf.command,
            args: serverConf.args ?? [],
            env: serverConf.env,
            transport: serverConf.url
              ? (serverConf.url.includes('sse') ? 'sse' : 'http')
              : serverConf.transport ?? 'stdio',
          });
        }
        break; // Use the first config file found
      }
    }
  }

  return { servers };
}
