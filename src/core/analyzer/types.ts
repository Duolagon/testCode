import type { TestCategory } from '../../utils/constants.js';

export interface FileEntry {
  path: string;
  relativePath: string;
  type: 'component' | 'page' | 'route' | 'controller' | 'model' | 'service' | 'config' | 'test' | 'style' | 'middleware' | 'other';
  language: 'ts' | 'tsx' | 'js' | 'jsx' | 'vue' | 'svelte' | 'py' | 'other';
  size: number;
}

export interface FrontendInfo {
  framework: string | null;
  routes: string[];
  components: ComponentInfo[];
  pages: string[];
}

export interface ComponentInfo {
  name: string;
  filePath: string;
  type: 'component' | 'page';
}

export interface BackendInfo {
  framework: string | null;
  endpoints: EndpointInfo[];
  models: string[];
  middleware: string[];
}

export interface EndpointInfo {
  method: string;
  path: string;
  filePath: string;
  handlerName: string;
}

export interface McpServerConfig {
  name: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  transport: 'stdio' | 'sse' | 'http';
  tools?: McpToolInfo[];
}

export interface McpToolInfo {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
}

export interface McpInfo {
  servers: McpServerConfig[];
}

export interface FeatureEntry {
  id: string;
  name: string;
  description: string;
  frontendComponents: string[];
  backendEndpoints: string[];
  mcpTools: string[];
  applicableCategories: TestCategory[];
}

export interface ProjectInfo {
  projectPath: string;
  packageJson: Record<string, unknown> | null;
  files: FileEntry[];
  frontend: FrontendInfo;
  backend: BackendInfo;
  mcp: McpInfo;
  features: FeatureEntry[];
  detectedTestRunner: string | null;
}
