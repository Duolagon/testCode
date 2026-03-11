import type { TestCase } from '../generator/types.js';
import type { TestResult, ExecutionContext } from './types.js';
import { FileService } from '../../services/file-service.js';
import { executeUnitTest } from './unit-executor.js';

// Integration tests are executed the same way as unit tests
// but they test cross-module interactions
export async function executeIntegrationTest(
  testCase: TestCase,
  context: ExecutionContext,
  fileService: FileService,
): Promise<TestResult> {
  return executeUnitTest(testCase, context, fileService);
}
