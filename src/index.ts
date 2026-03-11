// Public API
export { analyzeProject } from './core/analyzer/index.js';
export { generateTestCases, generateIntegrationCases } from './core/generator/index.js';
export { executeTestCases, executeIntegrationTests } from './core/executor/index.js';
export { generateReport } from './core/reporter/index.js';
export { loadConfig } from './config/index.js';
export { createAIClient } from './services/ai-client-factory.js';

// Types
export type { ProjectInfo, FeatureEntry } from './core/analyzer/types.js';
export type { TestCase, GeneratedBatch } from './core/generator/types.js';
export type { TestResult, ExecutionContext } from './core/executor/types.js';
export type { Config } from './config/types.js';
export type { AIClient, AIProvider, AIPrompt } from './services/ai-client.js';

