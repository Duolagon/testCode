# Test Report

## Summary

- Total Cases: 52
- Passed: 48 (92.3%)
- Failed: 4
- Blocked: 0
- Skipped: 0
- Duration: 125.2s
- Token Usage: Total 136330 (Prompt: 66155, Completion: 35086)

## Results by Category

| Category | Total | Passed | Failed |
| --- | --- | --- | --- |
| Frontend | 29 | 27 | 2 |
| Backend | 12 | 12 | 0 |
| Compatibility | 6 | 4 | 2 |
| Performance | 5 | 5 | 0 |

## Feature: Core Application Logic

- Total Cases: 52 (Pass: 48, Fail: 4, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-F002 | Frontend | Verifies that `extractEndpoints` correctly parses Express.js style route definitions. |
| TC-F005 | Frontend | Verifies that `scanFiles` correctly classifies files into different types like 'controller', 'model', 'test', etc. |
| TC-F001 | Frontend | Verifies that `detectBackendFramework` correctly identifies the backend framework from package.json dependencies. |
| TC-F006 | Frontend | Verifies `extractPageRoute` correctly extracts routes for Next.js App Router and Pages Router. |
| TC-B001 | Backend | Should correctly identify an Express.js framework from package.json and extract basic endpoints. |
| TC-F003 | Frontend | Verifies that `extractEndpoints` correctly parses NestJS style route definitions with controller prefixes. |
| TC-F008 | Frontend | Verifies that `validateTestCodeSyntax` uses esbuild to correctly identify valid and invalid TypeScript syntax. |
| TC-F009 | Frontend | Verifies that `analyzeProject` in incremental mode correctly filters features based on changed files. |
| TC-F004 | Frontend | Verifies that `extractEndpoints` ignores routes inside multi-line template literals and block comments. |
| TC-B003 | Backend | Should return null for the framework when no known backend framework dependency is found. |
| TC-B009 | Backend | Should handle NestJS path joining edge cases correctly. |
| TC-B010 | Backend | Should not crash and should return an empty endpoint list for a file if `readFileContent` throws an error. |
| TC-B002 | Backend | Should correctly identify a NestJS framework and extract endpoints with their controller prefixes. |
| TC-B007 | Backend | Should not extract endpoints from multi-line template literals or block comments. |
| TC-B005 | Backend | Should correctly identify and list model and middleware files based on their type. |
| TC-B006 | Backend | Should use fallback logic to find endpoints in 'service' or 'other' files if none are found in 'controller' or 'route' files. |
| TC-B008 | Backend | Should return a default/empty BackendInfo object when the input file list is empty. |
| TC-B004 | Backend | Should handle a null package.json object gracefully without crashing. |
| TC-F003 | Frontend | Verifies `detectBackendFramework` returns null when no known framework is found. |
| TC-B011 | Backend | Should correctly identify a Fastify framework and extract its endpoints. |
| TC-B012 | Backend | Should correctly handle multiple NestJS controllers in a single file. |
| TC-F001 | Frontend | Verifies `detectBackendFramework` correctly identifies 'express' from package.json dependencies. |
| TC-F005 | Frontend | Verifies `extractEndpoints` correctly parses NestJS style routes with controller prefixes. |
| TC-F004 | Frontend | Verifies `extractEndpoints` correctly parses Express.js style routes. |
| TC-F007 | Frontend | Verifies the `analyzeBackend` orchestrator correctly aggregates models, middleware, and endpoints. |
| TC-F006 | Frontend | Verifies `extractEndpoints` ignores routes inside multi-line comments and multi-line template literals. |
| TC-F002 | Frontend | Verifies `detectBackendFramework` correctly identifies a framework from package.json devDependencies. |
| TC-F011 | Frontend | Verifies `scanFiles` correctly ignores specified directories and default patterns. |
| TC-F013 | Frontend | Verifies `extractRoutes` can parse routes from React Router's JSX syntax. |
| TC-F009 | Frontend | Verifies `getChangedFiles` handles errors from `execSync` gracefully. |
| TC-F010 | Frontend | Verifies `classifyFile` in `file-scanner.ts` correctly categorizes various file paths. |
| TC-F012 | Frontend | Verifies `extractPageRoute` in `frontend-analyzer.ts` correctly parses Next.js routes. |
| TC-F016 | Frontend | Verifies `buildFeatureMap` creates a fallback feature for CLI/library projects with no UI or APIs. |
| TC-F015 | Frontend | Verifies `buildFeatureMap` creates features by linking frontend routes to backend APIs. |
| TC-C003 | Compatibility | Verifies that `analyzeMcp` correctly constructs file search paths using the operating system's home directory, ensuring compatibility with different OS environments (e.g., Windows, macOS, Linux). |
| TC-C001 | Compatibility | Verifies that `getChangedFiles` gracefully falls back to returning an empty array when the `git` command fails, simulating an environment without Git or a non-Git repository. |
| TC-F020 | Frontend | Verifies `parseCases` returns an empty array and logs an error for unrecoverable JSON. |
| TC-C006 | Compatibility | Ensures `scanFiles` operates robustly in environments with file permission issues by gracefully skipping unreadable files instead of crashing the process. |
| TC-F007 | Frontend | Verifies that `postProcessTestCode` correctly cleans and formats the generated test code string. |
| TC-P001 | Performance | Verifies that `scanFiles` can process a large number of file paths (10,000) efficiently within an acceptable time limit, ensuring the file system scanning is not a bottleneck. |
| TC-P002 | Performance | Measures the execution time of `analyzeBackend` when analyzing 500 controller files with complex content to ensure regex matching is performant. |
| TC-P004 | Performance | Verifies the overall performance of the `analyzeProject` pipeline for a simulated large-scale project with 5,000 files. |
| TC-F008 | Frontend | Verifies `getChangedFiles` correctly processes and combines outputs from git commands. |
| TC-F018 | Frontend | Verifies `parseCases` successfully parses a valid JSON array from a markdown code block. |
| TC-F019 | Frontend | Verifies `parseCases` can sanitize and parse JSON with unescaped newlines inside string values. |
| TC-C005 | Compatibility | Verifies that `parseCases` can handle malformed JSON strings from LLMs, specifically those with unescaped literal newlines and invalid escape sequences (e.g., '), ensuring compatibility with imperfect model outputs. |
| TC-F014 | Frontend | Verifies `detectTestRunner` correctly identifies the test runner from package.json. |
| TC-C004 | Compatibility | Ensures the backend endpoint extractor is compatible with various code formatting styles, such as inconsistent spacing and different quote types, making it robust to common developer code styles. |
| TC-P003 | Performance | Assesses the performance of `analyzeFrontend` when processing a large number of frontend files (1000 total) to ensure efficient analysis. |
| TC-F017 | Frontend | Verifies `postProcessTestCode` fixes common AI-generated issues in test code strings. |
| TC-P005 | Performance | Ensures that `parseCases` can efficiently parse, sanitize, and validate a large JSON string containing 100 test cases without significant delay. |
| TC-C002 | Compatibility | Ensures that the `classifyFile` function correctly handles Windows-style backslash path separators by normalizing them, allowing for consistent file type classification across different operating systems. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-F008 | FAIL |  DEPRECATED  'basic' reporter is deprecated and will be removed in Vitest v3. Remove 'basic' from 'reporters' option. To match 'basic' reporter 100%, use configuration: {   "test": {     "reporters": [       [         "default",         {           "summary": false         }       ]     ]   } }  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F008.test.ts > getChangedFiles > should return a combined list of changed and untracked files AssertionError: expected [] to have a length of 3 but got +0  [32m- Expected[39m [31m+ Received[39m  [32m- 3[39m [31m+ 0[39m   ❯ ai-test-tmp/TC-F008.test.ts:24:19      22\|     const files = getChangedFiles(projectPath);      23\|       24\|     expect(files).toHaveLength(3);        \|                   ^      25\|     expect(files).toEqual([      26\|       path.join(projectPath, 'src/file1.ts'),  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C004 | FAIL |  DEPRECATED  'basic' reporter is deprecated and will be removed in Vitest v3. Remove 'basic' from 'reporters' option. To match 'basic' reporter 100%, use configuration: {   "test": {     "reporters": [       [         "default",         {           "summary": false         }       ]     ]   } }  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C004.test.ts > analyzeBackend code style compatibility > should extract endpoints regardless of extra whitespace or quote type AssertionError: expected [ { method: 'POST', …(3) }, …(1) ] to have a length of 3 but got 2  [32m- Expected[39m [31m+ Received[39m  [32m- 3[39m [31m+ 2[39m   ❯ ai-test-tmp/TC-C004.test.ts:28:30      26\|     const result = await analyzeBackend([mockFile], '/proj', null);      27\|       28\|     expect(result.endpoints).toHaveLength(3);        \|                              ^      29\|     expect(result.endpoints).toEqual(expect.arrayContaining([      30\|       { method: 'GET', path: '/users', filePath: mockFile.relativePath…  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F017 | FAIL |  DEPRECATED  'basic' reporter is deprecated and will be removed in Vitest v3. Remove 'basic' from 'reporters' option. To match 'basic' reporter 100%, use configuration: {   "test": {     "reporters": [       [         "default",         {           "summary": false         }       ]     ]   } }  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F017.test.ts > postProcessTestCode > should fix common AI-generated code issues AssertionError: expected 'import { describe, it, expect } from …' to contain 'import { describe, it, expect } from …'  Expected: [32m"import { describe, it, expect } from 'vitest'; const content = 'Line 1Line 2'; const myMock = vi.mocked(myFunc);"[39m Received: [31m"import { describe, it, expect } from 'vitest'; const content = 'Line 1[7m\ [27mLine 2'; const myMock = vi.mocked(myFunc);"[39m   ❯ ai-test-tmp/TC-F017.test.ts:22:31      20\|     // Normalize whitespace for comparison      21\|     const normalize = (str) => str.replace(/\s+/g, ' ').trim();      22\|     expect(normalize(result)).toContain(normalize(expectedCode));        \|                               ^      23\|   });      24\| });  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C002 | FAIL |  DEPRECATED  'basic' reporter is deprecated and will be removed in Vitest v3. Remove 'basic' from 'reporters' option. To match 'basic' reporter 100%, use configuration: {   "test": {     "reporters": [       [         "default",         {           "summary": false         }       ]     ]   } }  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C002.test.ts > scanFiles path compatibility > should correctly classify files with Windows backslash separators AssertionError: expected '../../C:/project/src/controllers/user…' to be 'src/controllers/user.controller.ts' // Object.is equality  Expected: [32m"src/controllers/user.controller.ts"[39m Received: [31m"[7m../../C:/project/[27msrc/controllers/user.controller.ts"[39m   ❯ ai-test-tmp/TC-C002.test.ts:25:36      23\|       24\|     expect(result).toHaveLength(1);      25\|     expect(result[0].relativePath).toBe('src/controllers/user.controll…        \|                                    ^      26\|     expect(result[0].type).toBe('controller');      27\|   });  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Self-Healing Retry Summary

- Cases retried: 11
- Successfully fixed: 7
- Still failing after retry: 4
- Retry token usage: 36616

| Case ID | Category | Attempts | Final Status |
| --- | --- | --- | --- |
| TC-F007 | Frontend | 1 | PASS |
| TC-F008 | Frontend | 1 | FAIL |
| TC-F018 | Frontend | 1 | PASS |
| TC-F019 | Frontend | 1 | PASS |
| TC-C005 | Compatibility | 1 | PASS |
| TC-F014 | Frontend | 1 | PASS |
| TC-C004 | Compatibility | 1 | FAIL |
| TC-P003 | Performance | 1 | PASS |
| TC-F017 | Frontend | 1 | FAIL |
| TC-P005 | Performance | 1 | PASS |
| TC-C002 | Compatibility | 1 | FAIL |


## Project Info

- Path: /Users/ll/Desktop/testcode
- Features tested: 1

---

Generated by ai-test at 2026-03-10T12:07:26.045Z
