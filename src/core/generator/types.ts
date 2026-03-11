import type { TestCategory, TestStatus } from '../../utils/constants.js';
import type { TokenUsage } from '../../services/ai-client.js';

export interface TestCase {
  caseId: string;
  feature: string;
  category: TestCategory;
  description: string;
  preconditions: string[];
  steps: string[];
  expectedResult: string;
  testCode: string;
  mcpServerName?: string;
}

export interface GeneratedBatch {
  featureId: string;
  featureName: string;
  category: TestCategory;
  cases: TestCase[];
  usage?: TokenUsage;
}
