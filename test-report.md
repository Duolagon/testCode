# Test Report

## Summary

- Total Cases: 175
- Passed: 124 (70.9%)
- Failed: 51
- Blocked: 0
- Skipped: 0
- Duration: 354.7s
- Token Usage: Total 881752 (Prompt: 158147, Completion: 171962)

## Results by Category

| Category | Total | Passed | Failed |
| --- | --- | --- | --- |
| Frontend | 54 | 19 | 35 |
| Backend | 62 | 56 | 6 |
| Compatibility | 34 | 27 | 7 |
| Performance | 25 | 22 | 3 |

## Feature: Create Analyze

- Total Cases: 15 (Pass: 15, Fail: 0, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-F002 | Frontend | Verifies the /analyze endpoint uses the fallback path from options when `req.body.path` is not provided. |
| TC-F003 | Frontend | Verifies the endpoint returns a 500 error with a proper message when a downstream operation throws an `Error` object. This covers the `err instanceof Error` true path. |
| TC-F001 | Frontend | Verifies the /analyze endpoint successfully analyzes a project when the path is provided in the request body. |
| TC-B001 | Backend | Verifies the POST /analyze handler successfully analyzes a project using the path provided in the request body. |
| TC-B003 | Backend | Verifies the handler returns a 500 error with a proper message when `analyzeProject` throws a standard `Error` object. |
| TC-B004 | Backend | Verifies the handler returns a 500 error with a stringified message when `analyzeProject` throws a non-Error object (e.g., a string). |
| TC-B002 | Backend | Verifies the handler uses the fallback project path from options when `req.body.path` is not provided. |
| TC-B005 | Backend | Verifies the handler returns a 500 error if the `loadConfig` function fails, preventing `analyzeProject` from being called. |
| TC-C001 | Compatibility | Verifies that the endpoint correctly handles and resolves Windows-style file paths with backslashes, ensuring cross-platform compatibility. |
| TC-F004 | Frontend | Verifies the endpoint returns a 500 error with a stringified message when a downstream operation throws a non-Error object (e.g., a string). This covers the `err instanceof Error` false path. |
| TC-C003 | Compatibility | Ensures the endpoint gracefully falls back to the default project path provided during initialization when the request body does not contain a path. |
| TC-C002 | Compatibility | Verifies that the endpoint correctly handles and resolves POSIX-style file paths with forward slashes, ensuring cross-platform compatibility. |
| TC-P001 | Performance | Verifies the /analyze endpoint can handle 20 concurrent requests with a simulated 50ms analysis time, completing in under 100ms, demonstrating efficient handling of parallel operations. |
| TC-C004 | Compatibility | Verifies the endpoint's error handling robustness by ensuring it can catch and correctly format exceptions that are not instances of Error (e.g., a thrown string), which can occur with older libraries or in certain JavaScript environments. |
| TC-P002 | Performance | Measures the sequential throughput of the /analyze endpoint, ensuring it can process over 1000 requests per second when the underlying analysis logic is instantaneous. |


## Feature: Create Browse

- Total Cases: 22 (Pass: 18, Fail: 4, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B001 | Backend | Verifies browsing a valid directory returns a sorted and filtered list of its contents |
| TC-B006 | Backend | Verifies a 500 error is returned when 'fs.readdir' throws an error |
| TC-B002 | Backend | Verifies that browsing without a path defaults to the root ('/') and sets 'parentPath' to null |
| TC-B003 | Backend | Verifies a 400 error is returned if the requested path is a file, not a directory |
| TC-B004 | Backend | Verifies a 500 error is returned when 'fs.stat' throws an error (e.g., path not found) |
| TC-B007 | Backend | Verifies a 500 error is handled correctly when a non-Error object is thrown |
| TC-B005 | Backend | Verifies that browsing an empty directory correctly returns an empty 'entries' array |
| TC-F001 | Frontend | Should return a sorted and filtered list of directory contents on a valid path |
| TC-F002 | Frontend | Should return a 400 error when the requested path is a file |
| TC-F004 | Frontend | Should return `null` for `parentPath` when browsing the root directory |
| TC-F003 | Frontend | Should handle filesystem errors gracefully by returning a 500 status |
| TC-F005 | Frontend | Should default to the root directory '/' if no path is provided in the request body |
| TC-F006 | Frontend | Should correctly handle an empty directory |
| TC-F007 | Frontend | Should handle non-Error objects thrown in the catch block |
| TC-P001 | Performance | Verifies that the /browse endpoint responds with low latency for a directory containing a small number of entries (10). |
| TC-P002 | Performance | Measures the performance of the /browse endpoint when listing a directory with a large number of entries (1,000) to test sorting and mapping efficiency. |
| TC-P003 | Performance | Assesses the server's ability to handle 100 concurrent requests to the /browse endpoint without significant performance degradation. |
| TC-C001 | Compatibility | Verifies that the API correctly handles Windows-style paths (e.g., 'C:\Users') by mocking the path module to simulate a Windows environment. |
| TC-C005 | Compatibility | Ensures that filenames with Unicode characters (e.g., Cyrillic, CJK) are handled correctly, testing for potential encoding issues that can arise from different system locales or environments. |
| TC-C003 | Compatibility | Verifies correct handling of the root directory ('/') on POSIX-like systems, ensuring 'parentPath' is correctly set to null, which can differ from Windows root handling. |
| TC-C002 | Compatibility | Ensures the API returns a 500 error when a filesystem operation fails due to permissions (EACCES), a common cross-platform environmental issue. |
| TC-C004 | Compatibility | Tests how the system classifies a symbolic link. The behavior of `fs.readdir` with `withFileTypes` for symlinks is consistent, but this test verifies the application's interpretation, which is important for compatibility across different filesystems (e.g., those with or without symlink support). |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-C001 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C001.test.ts > browseRoutes Compatibility > TC-C001: should correctly handle Windows-style paths TypeError: Cannot create property 'value' on string '/'  ❯ ai-test-tmp/TC-C001.test.ts:33:25      31\|     vi.mocked(path.join).mockImplementation((...args) => path.win32.jo…      32\|     vi.mocked(path.dirname).mockReturnValue(parentPath);      33\|     vi.mocked(path.sep).value = '\\'; // Ensure path separator is for …        \|                         ^      34\|       35\|     vi.mocked(fs.stat).mockResolvedValue({ isDirectory: () => true } a…  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C005 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C005.test.ts > browseRoutes Compatibility > TC-C005: should handle filenames with Unicode characters correctly AssertionError: expected "spy" to be called with arguments: [ { …(3) } ][90m  Received:   [1m  1st spy call:  [22m[33m@@ -1,17 +1,17 @@[90m [2m  [[22m [2m    {[22m [32m-     "currentPath": "/international",[90m [31m+     "currentPath": "international",[90m [2m      "entries": [[22m [2m        {[22m [2m          "name": "папка",[22m [32m-         "path": "/international/папка",[90m [31m+         "path": "international/папка",[90m [2m          "type": "dir",[22m [2m        },[22m [2m        {[22m [2m          "name": "你好.txt",[22m [32m-         "path": "/international/你好.txt",[90m [31m+         "path": "international/你好.txt",[90m [2m          "type": "file",[22m [2m        },[22m [2m      ],[22m [2m      "parentPath": "/",[22m [2m    },[22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-C005.test.ts:41:26      39\|     await postHandler(mockReq, mockRes, mockNext);      40\|       41\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^      42\|       currentPath: '/international',      43\|       parentPath: '/',  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C003 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C003.test.ts > browseRoutes Compatibility > TC-C003: should correctly handle the POSIX root directory AssertionError: expected "spy" to be called with arguments: [ ObjectContaining{…} ][90m  Number of calls: [1m0[22m [39m  ❯ ai-test-tmp/TC-C003.test.ts:35:26      33\|     await postHandler(mockReq, mockRes, mockNext);      34\|       35\|     expect(mockRes.json).toHaveBeenCalledWith(expect.objectContaining({        \|                          ^      36\|       currentPath: '/',      37\|       parentPath: null,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C004 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C004.test.ts [ ai-test-tmp/TC-C004.test.ts ] Error: Transform failed with 1 error: /Users/lilong/Desktop/testCode/ai-test-tmp/TC-C004.test.ts:31:2: ERROR: Unexpected "}"   Plugin: vite:esbuild   File: /Users/lilong/Desktop/testCode/ai-test-tmp/TC-C004.test.ts:31:2      Unexpected "}"   29 \|        { name: 'a-real-dir', isDirectory: () => true },   30 \|        { name: 'symlink-to-dir', isDirectory: () => false }, // readdir's Dirent for a symlink has isDirectory() === f...   31 \|    });      \|    ^   32 \|  });     ❯ failureErrorWithLog node_modules/esbuild/lib/main.js:1467:15  ❯ node_modules/esbuild/lib/main.js:736:50  ❯ responseCallbacks.<computed> node_modules/esbuild/lib/main.js:603:9  ❯ handleIncomingPacket node_modules/esbuild/lib/main.js:658:12  ❯ Socket.readFromStdout node_modules/esbuild/lib/main.js:581:7  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Get Config

- Total Cases: 18 (Pass: 17, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B001 | Backend | Verifies the GET /config handler successfully loads a configuration with an API key, sanitizes it by masking the key, and returns the correct response. |
| TC-B003 | Backend | Verifies that if 'loadConfig' rejects with an 'Error' instance, the GET /config handler catches it and returns a 500 status with the error message. |
| TC-B002 | Backend | Verifies the GET /config handler correctly processes a configuration where the API key is missing or falsy, setting it to an empty string in the response. |
| TC-B004 | Backend | Verifies that if 'loadConfig' rejects with a non-Error (e.g., a string), the handler correctly converts it to a string and returns a 500 error. |
| TC-B005 | Backend | Verifies that the POST /config handler updates the internal overrides, and a subsequent GET /config call uses these new overrides when calling 'loadConfig'. |
| TC-F001 | Frontend | Verifies that GET /config correctly returns a sanitized configuration, masking a present API key. This covers the true path for the API key ternary. |
| TC-F002 | Frontend | Verifies that GET /config returns a sanitized configuration with an empty API key string when no API key is present. This covers the false path for the API key ternary. |
| TC-F003 | Frontend | Verifies that GET /config returns a 500 error with a proper message when 'loadConfig' throws an instance of Error. This covers the 'err instanceof Error' true path. |
| TC-F004 | Frontend | Verifies that GET /config returns a 500 error with a stringified message when 'loadConfig' throws a non-Error value. This covers the 'err instanceof Error' false path. |
| TC-F005 | Frontend | Verifies that the POST /config endpoint successfully updates the configuration overrides and returns a success response. |
| TC-F006 | Frontend | Verifies that overrides sent via POST /config are applied when fetching the configuration via a subsequent GET /config request. |
| TC-C001 | Compatibility | Verifies the API gracefully handles failures from the config loader when a standard Error object is thrown, simulating a degraded environment. |
| TC-C002 | Compatibility | Verifies the API error handling is compatible with non-standard Error types (e.g., a string), which can be thrown by older or non-compliant libraries. |
| TC-C003 | Compatibility | Verifies the API correctly sanitizes configuration by masking the API key when it is present, ensuring consistent and secure output across different valid configurations. |
| TC-C004 | Compatibility | Verifies the API is compatible with configurations where the API key is absent or empty, ensuring it handles optional fields correctly without errors. |
| TC-P001 | Performance | Measures the latency of a single GET /config request to ensure it responds within a predefined threshold (50ms). |
| TC-P003 | Performance | Measures the throughput of the GET /config endpoint by sending 200 sequential requests and ensuring the total processing time is within a reasonable limit (2000ms). |
| TC-P002 | Performance | Tests the server's ability to handle 50 concurrent GET /config requests efficiently, ensuring the total completion time is within an acceptable limit (500ms). |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-P002 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-P002.test.ts > GET /config Performance Error: Hook timed out in 10000ms. If this is a long-running hook, pass a timeout value as the last argument or configure it globally with "hookTimeout".  ❯ ai-test-tmp/TC-P002.test.ts:27:3      25\|   it('should handle 100 concurrent requests with high throughput', asy…      26\|     const url = `http://localhost:${port}/config`;      27\|     const requestCount = 100;        \|   ^      28\|     const requests = Array.from({ length: requestCount }, (_, i) =>      29\|       fetch(url, {  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯  ⎯⎯⎯⎯⎯⎯ Unhandled Errors ⎯⎯⎯⎯⎯⎯  Vitest caught 1 unhandled error during the test run. This might cause false positive tests. Resolve unhandled errors to make sure your tests are not affected.  ⎯⎯⎯⎯⎯ Uncaught Exception ⎯⎯⎯⎯⎯ Error: listen EADDRINUSE: address already in use :::3000  ❯ Server.setupListenHandle [as _listen2] node:net:2008:16  ❯ listenInCluster node:net:2065:12  ❯ Server.listen node:net:2170:7  ❯ baseUrl ai-test-tmp/TC-P002.test.ts:32:41      30\|         method: 'POST',      31\|         headers: { 'Content-Type': 'application/json' },      32\|         body: JSON.stringify({ key: `value${i}` }),        \|                                         ^      33\|       })      34\|     );  ❯ ai-test-tmp/TC-P002.test.ts:32:11  ❯ processTicksAndRejections node:internal/process/task_queues:104:5  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯ Serialized Error: { code: 'EADDRINUSE', errno: -48, syscall: 'listen', address: '::', port: 3000 } This error originated in "ai-test-tmp/TC-P002.test.ts" test file. It doesn't mean the error was thrown inside the file itself, but while it was running. ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯   |


## Feature: Create Config

- Total Cases: 9 (Pass: 6, Fail: 3, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B001 | Backend | GET /config should return a sanitized configuration with the API key masked as '***' when an API key is present. |
| TC-B002 | Backend | GET /config should return a sanitized configuration with an empty string for the API key when it's missing or empty in the source. |
| TC-B003 | Backend | GET /config should return a 500 status and an error message if `loadConfig` throws an instance of Error. |
| TC-B004 | Backend | GET /config should return a 500 status and a stringified error if `loadConfig` throws a non-Error value (e.g., a string). |
| TC-B005 | Backend | POST /config should update the internal overrides object with the request body and respond with { ok: true }. |
| TC-B006 | Backend | A GET /config request should use the overrides provided by a previous POST /config request. |
| TC-C001 | Compatibility | Verifies the GET /config endpoint gracefully handles and stringifies non-Error objects (e.g., strings) thrown during config loading, ensuring compatibility with dependencies or Node.js versions that may not throw standard Error instances. |
| TC-C003 | Compatibility | Verifies that configuration overrides sent via POST /config are correctly applied on subsequent GET /config requests, ensuring state is managed reliably across different Node.js runtime environments. |
| TC-C002 | Compatibility | Ensures the GET /config endpoint functions correctly when the loaded configuration lacks an API key, reflecting a common setup in secure or CI/CD environments where keys are not stored in config files. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-C001 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C001.test.ts [ ai-test-tmp/TC-C001.test.ts ] Error: Cannot find module '../config/index.js' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-C001.test.ts'  ❯ ai-test-tmp/TC-C001.test.ts:4:1       2\| import { Router } from 'express';       3\| import { configRoutes } from '../src/web/routes/config.js';       4\| import { loadConfig } from '../config/index.js';        \| ^       5\|        6\| vi.mock('express', () => ({  Caused by: Error: Failed to load url ../config/index.js (resolved id: ../config/index.js) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-C001.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C003 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C003.test.ts [ ai-test-tmp/TC-C003.test.ts ] Error: Cannot find module '../config/index.js' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-C003.test.ts'  ❯ ai-test-tmp/TC-C003.test.ts:4:1       2\| import { Router } from 'express';       3\| import { configRoutes } from '../src/web/routes/config.js';       4\| import { loadConfig } from '../config/index.js';        \| ^       5\|        6\| vi.mock('express', () => ({  Caused by: Error: Failed to load url ../config/index.js (resolved id: ../config/index.js) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-C003.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-C002 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-C002.test.ts [ ai-test-tmp/TC-C002.test.ts ] Error: Cannot find module '../config/index.js' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-C002.test.ts'  ❯ ai-test-tmp/TC-C002.test.ts:4:1       2\| import { Router } from 'express';       3\| import { configRoutes } from '../src/web/routes/config.js';       4\| import { loadConfig } from '../config/index.js';        \| ^       5\|        6\| vi.mock('express', () => ({  Caused by: Error: Failed to load url ../config/index.js (resolved id: ../config/index.js) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-C002.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Config API

- Total Cases: 4 (Pass: 4, Fail: 0, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-P001 | Performance | Measures the latency of the POST /config endpoint by sending 500 sequential requests and ensuring the total execution time is within an acceptable limit. |
| TC-P002 | Performance | Measures the throughput of the POST /config endpoint by sending 100 concurrent requests and ensuring they all complete within an acceptable time frame. |
| TC-P003 | Performance | Measures the latency of the GET /config endpoint under sequential load (200 requests) with a mocked file system to isolate the route handler's performance. |
| TC-P004 | Performance | Measures the throughput of the GET /config endpoint by sending 100 concurrent requests with a mocked file system, ensuring it can handle parallel load efficiently. |


## Feature: Get Report

- Total Cases: 17 (Pass: 12, Fail: 5, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B001 | Backend | Should return 404 Not Found if the run ID does not exist |
| TC-B002 | Backend | Should return 404 Not Found if the run exists but the report is not yet available |
| TC-B003 | Backend | Should return 200 with report markdown and its HTML conversion for a valid run ID |
| TC-B004 | Backend | Should correctly convert complex markdown including headers, lists, and code blocks |
| TC-B006 | Backend | Should handle an empty markdown report string gracefully |
| TC-B005 | Backend | Should correctly convert markdown tables and skip separator lines |
| TC-C001 | Compatibility | Verifies the endpoint gracefully handles a non-existent run ID by returning a 404 error, ensuring compatibility with error states. |
| TC-C002 | Compatibility | Verifies the endpoint handles a state where the run exists but the report is not yet generated, returning a 404. This tests fallback behavior for ongoing processes. |
| TC-F001 | Frontend | GET /report/:id should return 404 if the run state is not found, covering the '!state' branch. |
| TC-C004 | Compatibility | Verifies the markdown-to-HTML conversion correctly handles non-ASCII and Unicode characters (e.g., accented letters, emojis), ensuring i18n compatibility. |
| TC-F002 | Frontend | GET /report/:id should return 404 if a run state exists but its report is not available, covering the '!state.report' branch. |
| TC-P001 | Performance | Verifies that the markdown-to-HTML conversion for a single, large report completes within a specified latency threshold. |
| TC-P002 | Performance | Measures the throughput of the report generation logic by processing a high number of requests sequentially and ensuring the total execution time is within limits. |
| TC-F003 | Frontend | GET /report/:id should return 200 with the report content when the run and report are found. |
| TC-F005 | Frontend | The markdownToHtml function should handle table conversion, producing separate <tr> elements separated by <br><br> tags. |
| TC-F004 | Frontend | The markdownToHtml function should correctly handle list conversion, replacing the entire list block with '<ul>{{SOURCE_CODE}}</ul>' due to its implementation. |
| TC-C003 | Compatibility | Verifies that an empty markdown string is handled correctly, producing an empty HTML string without errors. This tests compatibility with edge case inputs. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-F001 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F001.test.ts > GET /report/:id > should convert markdown tables to HTML rows, separated by line breaks AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<tr><td>Head 1</td><td>Head 2</td></tr><tr><td>R1C1</td><td>R1C2</td></tr>",[90m [31m+     "html": "<tr><td>Head 1</td><td>Head 2</td><td>\\n</td><td>---</td><td>---</td><td>\\n</td><td>R1C1</td><td>R1C2</td></tr>",[90m [2m      "markdown": "\| Head 1 \| Head 2 \|\\n\| --- \| --- \|\\n\| R1C1 \| R1C2 \|",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F001.test.ts:110:26     108\|     const expectedHtml = `${headerRow}${dataRow}`;     109\|          110\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^     111\|         markdown: markdown,     112\|         html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F002 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F002.test.ts > GET /report/:id > should convert markdown tables to HTML rows, separated by line breaks AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<table><tr><td>\| Head 1 \| Head 2 \|\\n\| --- \| --- \|\\n\| R1C1 \| R1C2 \|</td></tr></table>",[90m [31m+     "html": "<tr><td>Head 1</td><td>Head 2</td><td>\\n</td><td>---</td><td>---</td><td>\\n</td><td>R1C1</td><td>R1C2</td></tr>",[90m [2m      "markdown": "\| Head 1 \| Head 2 \|\\n\| --- \| --- \|\\n\| R1C1 \| R1C2 \|",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F002.test.ts:105:26     103\|     const expectedHtml = '<table><tr><td>\| Head 1 \| Head 2 \|\\n\| --- \|…     104\|          105\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^     106\|         markdown: markdown,     107\|         html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F003 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 2 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F003.test.ts > GET /report/:id > should correctly convert a markdown list, noting the literal "{{SOURCE_CODE}}" replacement AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<ul>[90m [32m- <li>item 1</li>[90m [32m- <li>item 2</li>[90m [32m- </ul>[90m [32m- ",[90m [31m+     "html": "<ul><li>item 1</li>[90m [31m+ <li>item 2</li></ul>",[90m [2m      "markdown": "- item 1[22m [2m  - item 2",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F003.test.ts:90:26      88\|     const expectedHtml = '<ul>\n<li>item 1</li>\n<li>item 2</li>\n</ul…      89\|         90\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^      91\|       markdown: markdown,      92\|       html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯   FAIL  ai-test-tmp/TC-F003.test.ts > GET /report/:id > should convert markdown tables to HTML rows, separated by line breaks AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": StringContaining "<table>",[90m [31m+     "html": "<tr><td>Head 1</td><td>Head 2</td></tr>[90m [31m+[90m [31m+ <tr><td>R1C1</td><td>R1C2</td></tr>",[90m [2m      "markdown": "\| Head 1 \| Head 2 \|[22m [2m  \| --- \| --- \|[22m [2m  \| R1C1 \| R1C2 \|",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F003.test.ts:106:26     104\|     const expectedHtml = '<table>\n<thead>\n<tr>\n<th id="head-1">Head…     105\|          106\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^     107\|         markdown: markdown,     108\|         html: expect.stringContaining('<table>'),  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯   |
| TC-F005 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F005.test.ts > GET /report/:id > should return a 200 response with markdown and HTML content when a report is found AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<h1>Report Title[90m [32m-[90m [32m- This is the report.</h1>",[90m [31m+     "html": "<h1>Report Title\\n\\nThis is the report.</h1>",[90m [2m      "markdown": "# Report Title\\n\\nThis is the report.",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F005.test.ts:72:26      70\|     expect(getRunState).toHaveBeenCalledWith('valid-id');      71\|     expect(mockRes.status).not.toHaveBeenCalled();      72\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^      73\|       markdown: markdown,      74\|       html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯   FAIL  ai-test-tmp/TC-F005.test.ts > GET /report/:id > should correctly convert a markdown list, noting the literal "{{SOURCE_CODE}}" replacement AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<ul><li>item 1[90m [32m- - item 2</li></ul>",[90m [31m+     "html": "<ul><li>item 1\\n- item 2</li></ul>",[90m [2m      "markdown": "- item 1\\n- item 2",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F005.test.ts:89:26      87\|     const expectedHtml = '<ul><li>item 1\n- item 2</li></ul>';      88\|         89\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^      90\|       markdown: markdown,      91\|       html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯   FAIL  ai-test-tmp/TC-F005.test.ts > GET /report/:id > should convert markdown tables to HTML rows, separated by line breaks AssertionError: ex |
| TC-F004 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 3 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F004.test.ts > GET /report/:id > should return a 200 response with markdown and HTML content when a report is found AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<h1>Report Title[90m [32m-[90m [32m- This is the report.</h1>",[90m [31m+     "html": "<h1>Report Title\\n\\nThis is the report.</h1>",[90m [2m      "markdown": "# Report Title\\n\\nThis is the report.",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F004.test.ts:72:26      70\|     expect(getRunState).toHaveBeenCalledWith('valid-id');      71\|     expect(mockRes.status).not.toHaveBeenCalled();      72\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^      73\|       markdown: markdown,      74\|       html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/3]⎯   FAIL  ai-test-tmp/TC-F004.test.ts > GET /report/:id > should correctly convert a markdown list, noting the literal "{{SOURCE_CODE}}" replacement AssertionError: expected "spy" to be called with arguments: [ { …(2) } ][90m  Received:   [1m  1st spy call:  [22m[2m  [[22m [2m    {[22m [32m-     "html": "<ul><li>item 1[90m [32m- - item 2</li></ul>",[90m [31m+     "html": "<ul><li>item 1\\n- item 2</li></ul>",[90m [2m      "markdown": "- item 1\\n- item 2",[22m [2m    },[22m [2m  ][22m [39m[90m  Number of calls: [1m1[22m [39m  ❯ ai-test-tmp/TC-F004.test.ts:89:26      87\|     const expectedHtml = '<ul><li>item 1\n- item 2</li></ul>';      88\|         89\|     expect(mockRes.json).toHaveBeenCalledWith({        \|                          ^      90\|       markdown: markdown,      91\|       html: expectedHtml,  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/3]⎯   FAIL  ai-test-tmp/TC-F004.test.ts > GET /report/:id > should convert markdown tables to HTML rows, separated by line breaks AssertionError: ex |


## Feature: Create Run

- Total Cases: 36 (Pass: 21, Fail: 15, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B001 | Backend | POST /run should start a new run successfully when a valid project path is provided. |
| TC-B003 | Backend | POST /run should return a 500 Internal Server Error if `startRun` throws an Error object. |
| TC-B004 | Backend | POST /run should return a 500 Internal Server Error if `startRun` throws a non-Error (e.g., a string). |
| TC-B002 | Backend | POST /run should return a 400 Bad Request if the project path is missing. |
| TC-B007 | Backend | GET /run/:id/events should send existing results upon client reconnection to a running task. |
| TC-B006 | Backend | GET /run/:id/events should establish an SSE connection for a running task. |
| TC-B008 | Backend | GET /run/:id/events should send a 'complete' event and close the connection for a completed run. |
| TC-B005 | Backend | GET /run/:id/events should return 404 Not Found if the run state does not exist. |
| TC-B009 | Backend | GET /run/:id/events should send an 'error' event and close the connection for a failed run. |
| TC-B010 | Backend | GET /run/:id/events listener should handle 'complete' and 'error' events by ending the response. |
| TC-B011 | Backend | GET /run/:id/events should detach the event listener when the client connection closes. |
| TC-B013 | Backend | GET /run/:id/results should return the current state of a valid run. |
| TC-B012 | Backend | GET /run/:id/results should return 404 Not Found if the run state does not exist. |
| TC-F003 | Frontend | POST /run should return a 500 Internal Server Error if `startRun` throws an Error object. |
| TC-F006 | Frontend | GET /run/:id/results should return 404 Not Found if the run ID does not exist. |
| TC-F001 | Frontend | POST /run with a valid configuration should start a new run and return a runId with a 200 OK status. |
| TC-F007 | Frontend | GET /run/:id/events should return 404 Not Found if the run ID does not exist. |
| TC-F008 | Frontend | GET /run/:id/events should immediately stream existing results for a run that is already in progress upon connection. |
| TC-F005 | Frontend | GET /run/:id/results should return the complete run state for a valid run ID. |
| TC-C001 | Compatibility | Verifies the POST /run endpoint gracefully handles non-Error exceptions from the service layer, ensuring robustness against varied error types from dependencies. |
| TC-C002 | Compatibility | Ensures the GET /run/:id/events SSE endpoint sets correct HTTP headers required for compatibility with various browsers and proxies, preventing buffering and caching issues. |
| TC-C003 | Compatibility | Verifies that the server correctly cleans up event listeners when a client disconnects from the SSE stream. This prevents memory leaks and ensures resource compatibility in long-running processes. |
| TC-C004 | Compatibility | Tests the SSE reconnection logic to ensure a client joining an in-progress run receives all prior results, ensuring a consistent state for clients with intermittent connections. |
| TC-C005 | Compatibility | Ensures the GET /run/:id/events and GET /run/:id/results endpoints handle non-existent run IDs gracefully by returning a 404 status, which is critical for client-side error handling compatibility. |
| TC-C006 | Compatibility | Verifies that for an already completed run, the SSE endpoint sends a final 'complete' event and immediately closes the connection, ensuring client state machines can transition to a final state reliably. |
| TC-F004 | Frontend | POST /run should return a 500 Internal Server Error if `startRun` throws a non-Error object (e.g., a string). |
| TC-P002 | Performance | Measures the throughput of the POST /run endpoint by sending a high volume of concurrent requests. |
| TC-F002 | Frontend | POST /run without a 'path' in the request body should return a 400 Bad Request status. |
| TC-P003 | Performance | Verifies that the GET /run/:id/results endpoint responds quickly, even when handling a large result payload. |
| TC-P004 | Performance | Measures the latency for establishing a Server-Sent Events (SSE) connection and receiving initial, pre-existing run results via GET /run/:id/events. |
| TC-F010 | Frontend | GET /run/:id/events should send a single 'error' event and close the connection if the run has already failed. |
| TC-F009 | Frontend | GET /run/:id/events should send a single 'complete' event and close the connection if the run is already completed. |
| TC-F011 | Frontend | GET /run/:id/events should stream live events as they are emitted and close the connection upon receiving a 'complete' event. |
| TC-P001 | Performance | Verifies that a single request to the POST /run endpoint completes within an acceptable latency threshold. |
| TC-F012 | Frontend | GET /run/:id/events should stream live events and close the connection upon receiving an 'error' event. |
| TC-F013 | Frontend | The server should clean up the event listener by calling `eventBus.off` when an SSE client disconnects. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-B013 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-B013.test.ts > runRoutes TypeError: Cannot read properties of undefined (reading 'get')  ❯ ai-test-tmp/TC-B013.test.ts:24:47      22\|     const MockRouter = vi.mocked(Router);      23\|     const routerInstance = MockRouter.mock.instances[0];      24\|     const getCalls = vi.mocked(routerInstance.get).mock.calls;        \|                                               ^      25\|     const resultsRoute = getCalls.find(call => call[0] === '/run/:id/r…      26\|     getResultsHandler = resultsRoute ? resultsRoute[1] : undefined;  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F003 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F003.test.ts [ ai-test-tmp/TC-F003.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F003.test.ts'  ❯ ai-test-tmp/TC-F003.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\|   Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F003.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F006 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F006.test.ts [ ai-test-tmp/TC-F006.test.ts ] Error: [vitest] There was an error when mocking a module. If you are using "vi.mock" factory, make sure there are no top level variables inside, since this call is hoisted to top of the file. Read more: https://vitest.dev/api/vi.html#vi-mock  ❯ src/web/routes/run.ts:2:1       1\| import { Router } from 'express';       2\| import { startRun, getRunState } from '../services/run-manager.js';        \| ^       3\| import { eventBus, type RunEvent } from '../services/event-bus.js';       4\|   Caused by: ReferenceError: Cannot access 'mockStartRun' before initialization  ❯ ai-test-tmp/TC-F006.test.ts:11:13  ❯ src/web/routes/run.ts:2:1  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F001 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F001.test.ts [ ai-test-tmp/TC-F001.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F001.test.ts'  ❯ ai-test-tmp/TC-F001.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { startRun } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F001.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F007 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F007.test.ts [ ai-test-tmp/TC-F007.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F007.test.ts'  ❯ ai-test-tmp/TC-F007.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F007.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F008 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F008.test.ts [ ai-test-tmp/TC-F008.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F008.test.ts'  ❯ ai-test-tmp/TC-F008.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run';       5\| import type { RunState } from '../src/web/services/run-manager';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F008.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F005 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F005.test.ts [ ai-test-tmp/TC-F005.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F005.test.ts'  ❯ ai-test-tmp/TC-F005.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import type { RunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F005.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F004 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F004.test.ts [ ai-test-tmp/TC-F004.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F004.test.ts'  ❯ ai-test-tmp/TC-F004.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { startRun } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F004.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F002 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F002.test.ts [ ai-test-tmp/TC-F002.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F002.test.ts'  ❯ ai-test-tmp/TC-F002.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { startRun } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F002.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F010 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F010.test.ts [ ai-test-tmp/TC-F010.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F010.test.ts'  ❯ ai-test-tmp/TC-F010.test.ts:4:1       2\| import { describe, it, expect, vi, beforeEach } from 'vitest';       3\| import express from 'express';       4\| import request from 'supertest';        \| ^       5\| import { runRoutes } from '../src/web/routes/run.js';       6\| import type { RunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F010.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F009 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F009.test.ts [ ai-test-tmp/TC-F009.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F009.test.ts'  ❯ ai-test-tmp/TC-F009.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import type { RunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F009.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F011 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F011.test.ts [ ai-test-tmp/TC-F011.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F011.test.ts'  ❯ ai-test-tmp/TC-F011.test.ts:15:1      13\| import { describe, it, expect, vi, beforeEach } from 'vitest';      14\| import express from 'express';      15\| import request from 'supertest';        \| ^      16\| import { runRoutes } from '../src/web/routes/run.js';      17\| import { getRunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F011.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-P001 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-P001.test.ts [ ai-test-tmp/TC-P001.test.ts ] Error: Transform failed with 1 error: /Users/lilong/Desktop/testCode/ai-test-tmp/TC-P001.test.ts:10:10: ERROR: Expected "}" but found "new"   Plugin: vite:esbuild   File: /Users/lilong/Desktop/testCode/ai-test-tmp/TC-P001.test.ts:10:10      Expected "}" but found "new"   8  \|  }));   9  \|  vi.mock('../src/web/services/event-bus.js', () => ({ // Mock eventBus as it's used in other routes\n  eventBus: { on:...   10 \|      await new Promise(resolve => {      \|            ^   11 \|        res.json = vi.fn(resolve);   12 \|        router(req, res, next);     ❯ failureErrorWithLog node_modules/esbuild/lib/main.js:1467:15  ❯ node_modules/esbuild/lib/main.js:736:50  ❯ responseCallbacks.<computed> node_modules/esbuild/lib/main.js:603:9  ❯ handleIncomingPacket node_modules/esbuild/lib/main.js:658:12  ❯ Socket.readFromStdout node_modules/esbuild/lib/main.js:581:7  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F012 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F012.test.ts [ ai-test-tmp/TC-F012.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F012.test.ts'  ❯ ai-test-tmp/TC-F012.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import type { RunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F012.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F013 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F013.test.ts [ ai-test-tmp/TC-F013.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F013.test.ts'  ❯ ai-test-tmp/TC-F013.test.ts:3:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import type { RunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F013.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Get Run events

- Total Cases: 25 (Pass: 10, Fail: 15, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B002 | Backend | Should set SSE headers for a valid, running process |
| TC-B003 | Backend | Should send existing results if a client reconnects to a running process |
| TC-B005 | Backend | Should send an 'error' event and close the connection for a failed run |
| TC-B001 | Backend | Should return 404 Not Found if the run ID does not exist |
| TC-B004 | Backend | Should send a 'complete' event and close the connection for a completed run |
| TC-B007 | Backend | Should remove the event listener when the client disconnects |
| TC-B006 | Backend | Should correctly handle and stream a 'complete' event from the event bus |
| TC-B008 | Backend | Should detach listener if `res.write` throws an error (e.g., client disconnected abruptly) |
| TC-F001 | Frontend | Should return 404 Not Found if the provided run ID does not exist. |
| TC-F005 | Frontend | Should send a 'complete' event and immediately close the connection if the run is already completed. |
| TC-C001 | Compatibility | Verifies that the server sets the correct SSE-specific HTTP headers to ensure compatibility with standard clients and proxy servers. |
| TC-C002 | Compatibility | Ensures that a client reconnecting to a completed run receives historical results and the final 'complete' event, after which the connection is closed. This validates the reconnection logic. |
| TC-C003 | Compatibility | Verifies graceful handling of an unexpected client disconnect by ensuring the corresponding event listener is removed from the event bus to prevent memory leaks. |
| TC-F004 | Frontend | Should connect successfully and wait for future events if a run is ongoing but has no results yet. |
| TC-F003 | Frontend | Should immediately send existing test results when a client connects or reconnects to a run. |
| TC-P002 | Performance | Measures the throughput of streaming a large number of events to a single client over SSE. |
| TC-P003 | Performance | Tests the server's ability to broadcast an event to multiple concurrent clients connected to the same run without significant performance degradation. |
| TC-P004 | Performance | Measures the performance of sending a large backlog of historical run results to a newly connecting client. |
| TC-P001 | Performance | Verifies that the initial SSE connection to the /run/:id/events endpoint is established within an acceptable latency threshold. |
| TC-F006 | Frontend | Should send an 'error' event and immediately close the connection if the run has already failed. |
| TC-C004 | Compatibility | Verifies robust error handling when writing to a closed stream, ensuring the event listener is cleaned up to prevent further failed writes. |
| TC-F002 | Frontend | Should set the correct SSE (Server-Sent Events) headers for a valid, running run. |
| TC-F008 | Frontend | Should receive a live 'complete' event from the event bus and then close the connection. |
| TC-F009 | Frontend | Should clean up the event bus listener when the client disconnects. |
| TC-F007 | Frontend | Should receive live events of type 'result' from the event bus and keep the connection open. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-B005 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-B005.test.ts > GET /run/:id/events > should send error event and close connection for a failed run AssertionError: expected "spy" to be called with arguments: [ Array(1) ][90m  Number of calls: [1m0[22m [39m  ❯ ai-test-tmp/TC-B005.test.ts:54:27      52\|       data: { error: mockError },      53\|     };      54\|     expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify…        \|                           ^      55\|     expect(mockRes.end).toHaveBeenCalled();      56\|     expect(eventBus.on).not.toHaveBeenCalled();  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-B001 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-B001.test.ts > GET /run/:id/events > should return 404 if run is not found AssertionError: expected "spy" to be called with arguments: [ 'non-existent-id' ][90m  Number of calls: [1m0[22m [39m  ❯ ai-test-tmp/TC-B001.test.ts:46:25      44\|     router.handle(mockReq, mockRes, () => {});      45\|       46\|     expect(getRunState).toHaveBeenCalledWith('non-existent-id');        \|                         ^      47\|     expect(mockRes.status).toHaveBeenCalledWith(404);      48\|     expect(mockRes.json).toHaveBeenCalledWith({ error: 'Run not found'…  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-B004 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-B004.test.ts > GET /run/:id/events > should send complete event and close connection for a completed run AssertionError: expected "spy" to be called with arguments: [ Array(1) ][90m  Number of calls: [1m0[22m [39m  ❯ ai-test-tmp/TC-B004.test.ts:54:27      52\|       data: { summary: mockSummary },      53\|     };      54\|     expect(mockRes.write).toHaveBeenCalledWith(`data: ${JSON.stringify…        \|                           ^      55\|     expect(mockRes.end).toHaveBeenCalled();      56\|     expect(eventBus.on).not.toHaveBeenCalled();  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-B006 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-B006.test.ts > GET /run/:id/events > should stream a complete event and close the connection TypeError: Cannot read properties of undefined (reading '1')  ❯ ai-test-tmp/TC-B006.test.ts:46:57      44\|     router.handle(mockReq, mockRes, () => {});      45\|       46\|     const listener = vi.mocked(eventBus.on).mock.calls[0][1];        \|                                                         ^      47\|     const completeEvent = { type: 'complete', runId: 'running-id', dat…      48\|     listener(completeEvent);  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-B008 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-B008.test.ts > GET /run/:id/events > should detach listener if res.write throws an error TypeError: Cannot read properties of undefined (reading '1')  ❯ ai-test-tmp/TC-B008.test.ts:46:57      44\|     router.handle(mockReq, mockRes, () => {});      45\|       46\|     const listener = vi.mocked(eventBus.on).mock.calls[0][1];        \|                                                         ^      47\|     const testEvent = { type: 'result', runId: 'running-id', data: { t…      48\|       ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F001 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F001.test.ts [ ai-test-tmp/TC-F001.test.ts ] Error: Cannot find module 'supertest' Require stack: - /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F001.test.ts  ❯ ai-test-tmp/TC-F001.test.ts:3:18       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request = require('supertest');        \|                  ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F005 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F005.test.ts [ ai-test-tmp/TC-F005.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F005.test.ts'  ❯ ai-test-tmp/TC-F005.test.ts:6:1       4\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       5\| import express from 'express';       6\| import request from 'supertest';        \| ^       7\| import { runRoutes } from '../src/web/routes/run.js';       8\| import { getRunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F005.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F004 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F004.test.ts [ ai-test-tmp/TC-F004.test.ts ] Error: Cannot find module 'supertest' Require stack: - /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F004.test.ts  ❯ ai-test-tmp/TC-F004.test.ts:3:18       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request = require('supertest');        \|                  ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F003 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F003.test.ts [ ai-test-tmp/TC-F003.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F003.test.ts'  ❯ ai-test-tmp/TC-F003.test.ts:3:1       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F003.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-P001 | FAIL |  ⎯⎯⎯⎯⎯⎯⎯ Failed Tests 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-P001.test.ts > GET /run/:id/events Performance > TC-P001: should establish an SSE connection with low latency Error: Test timed out in 5000ms. If this is a long-running test, pass a timeout value as the last argument or configure it globally with "testTimeout".  ❯ ai-test-tmp/TC-P001.test.ts:45:3      43\|   });      44\|       45\|   it('TC-P001: should establish an SSE connection with low latency', a…        \|   ^      46\|     const runId = 'perf-run-1';      47\|     vi.mocked(getRunState).mockReturnValue({  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/2]⎯   FAIL  ai-test-tmp/TC-P001.test.ts > GET /run/:id/events Performance > TC-P001: should establish an SSE connection with low latency Error: Hook timed out in 10000ms. If this is a long-running hook, pass a timeout value as the last argument or configure it globally with "hookTimeout".  ❯ ai-test-tmp/TC-P001.test.ts:41:3      39\|   });      40\|       41\|   afterEach(async () => {        \|   ^      42\|     await new Promise(resolve => server.close(resolve));      43\|   });  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[2/2]⎯   |
| TC-F006 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F006.test.ts [ ai-test-tmp/TC-F006.test.ts ] Error: Cannot find module 'supertest' Require stack: - /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F006.test.ts  ❯ ai-test-tmp/TC-F006.test.ts:3:18       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request = require('supertest');        \|                  ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F002 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F002.test.ts [ ai-test-tmp/TC-F002.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F002.test.ts'  ❯ ai-test-tmp/TC-F002.test.ts:3:1       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F002.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F008 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F008.test.ts [ ai-test-tmp/TC-F008.test.ts ] Error: Cannot find module 'supertest' Require stack: - /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F008.test.ts  ❯ ai-test-tmp/TC-F008.test.ts:3:18       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request = require('supertest');        \|                  ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F009 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F009.test.ts [ ai-test-tmp/TC-F009.test.ts ] Error: Cannot find module 'supertest' Require stack: - /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F009.test.ts  ❯ ai-test-tmp/TC-F009.test.ts:3:17       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| const request = require('supertest');        \|                 ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |
| TC-F007 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-F007.test.ts [ ai-test-tmp/TC-F007.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-F007.test.ts'  ❯ ai-test-tmp/TC-F007.test.ts:3:1       1\| import { vi, describe, it, expect, beforeEach, afterEach } from 'vites…       2\| import express from 'express';       3\| import request from 'supertest';        \| ^       4\| import { runRoutes } from '../src/web/routes/run.js';       5\| import { getRunState } from '../src/web/services/run-manager.js';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-F007.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Get Run results

- Total Cases: 11 (Pass: 11, Fail: 0, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B001 | Backend | Verifies that the API returns the correct run state for a valid, existing run ID. |
| TC-B002 | Backend | Verifies that the API returns a 404 Not Found error when the requested run ID does not exist. |
| TC-F001 | Frontend | Verifies the API returns a 200 status and the correct run data when a valid run ID is provided. |
| TC-F002 | Frontend | Verifies the API returns a 404 Not Found error when the requested run ID does not exist. |
| TC-C002 | Compatibility | Verifies the API correctly returns partial results for a run that is still in progress. This ensures compatibility with transient or incomplete data states during a run. |
| TC-C001 | Compatibility | Verifies the API correctly returns a 404 error when the requested run ID does not exist, ensuring graceful fallback for missing data across different environments. |
| TC-C003 | Compatibility | Verifies the API returns complete data for a finished run, ensuring compatibility with the final, successful data state. |
| TC-C004 | Compatibility | Verifies the API gracefully handles state objects with undefined properties, ensuring resilience against partially formed data which might occur in different environments or due to race conditions. |
| TC-P001 | Performance | Verifies the GET /run/:id/results endpoint responds with low latency (< 50ms) when the requested run ID does not exist (404 case). |
| TC-P002 | Performance | Verifies the GET /run/:id/results endpoint can handle and serialize a large number of results (10,000 items) within an acceptable performance threshold (< 200ms). |
| TC-P003 | Performance | Measures the endpoint's ability to handle high concurrency, ensuring that 100 simultaneous requests complete within an acceptable timeframe (< 500ms). |


## Feature: Run Management API

- Total Cases: 10 (Pass: 10, Fail: 0, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-B003 | Backend | Verifies that a new run can be successfully started via the 'POST /run' endpoint with a valid configuration. |
| TC-B004 | Backend | Verifies that 'POST /run' returns a 400 Bad Request error if the 'path' property is missing from the request body. |
| TC-B005 | Backend | Verifies that 'POST /run' returns a 500 Internal Server Error if the 'startRun' service throws an exception. |
| TC-B006 | Backend | Verifies that the SSE endpoint 'GET /run/:id/events' returns a 404 Not Found error if the run ID does not exist. |
| TC-B007 | Backend | Verifies the SSE endpoint sends existing results upon connection to an in-progress run. |
| TC-B008 | Backend | Verifies the SSE endpoint sends a 'complete' event and closes the connection when connecting to an already completed run. |
| TC-B009 | Backend | Verifies the SSE endpoint sends an 'error' event and closes the connection when connecting to a failed run. |
| TC-B010 | Backend | Verifies that the event bus listener is properly removed when an SSE client disconnects. |
| TC-B011 | Backend | Verifies that the SSE connection is closed when a 'complete' event is received from the event bus for an active run. |
| TC-B012 | Backend | Verifies that the SSE connection is closed when an 'error' event is received from the event bus for an active run. |


## Feature: Run

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I004 | Frontend | Verifies that connecting to an event stream of an already completed run sends a 'complete' event and closes the stream. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I004 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I004.test.ts [ ai-test-tmp/TC-I004.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I004.test.ts'  ❯ ai-test-tmp/TC-I004.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import { runRoutes } from './src/web/routes/run';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I004.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Browse

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I008 | Frontend | Verifies that requesting to browse a path that is a file, not a directory, results in a 400 Bad Request error. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I008 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I008.test.ts [ ai-test-tmp/TC-I008.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I008.test.ts'  ❯ ai-test-tmp/TC-I008.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import * as fs from 'node:fs/promises';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I008.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Cross-Feature (Config, Analyze)

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I002 | Frontend | Verifies that a configuration override set via POST /config is correctly applied when POST /analyze is called. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I002 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I002.test.ts [ ai-test-tmp/TC-I002.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I002.test.ts'  ❯ ai-test-tmp/TC-I002.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import { configRoutes } from './src/web/routes/config';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I002.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Cross-Feature (Config, Run, Report)

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I001 | Frontend | Verifies the full lifecycle: updating config, starting a run, and fetching the final report. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I001 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I001.test.ts [ ai-test-tmp/TC-I001.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I001.test.ts'  ❯ ai-test-tmp/TC-I001.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import { configRoutes } from './src/web/routes/config';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I001.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Cross-Feature (Run, Report)

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I005 | Frontend | Verifies that attempting to fetch a report for a run that is still in progress returns a specific 'not available' error. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I005 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I005.test.ts [ ai-test-tmp/TC-I005.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I005.test.ts'  ❯ ai-test-tmp/TC-I005.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import { reportRoutes } from './src/web/routes/report';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I005.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Cross-Feature (Run, Results)

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I007 | Frontend | Verifies that a client can fetch the complete results of a finished run after it has been started. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I007 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I007.test.ts [ ai-test-tmp/TC-I007.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I007.test.ts'  ❯ ai-test-tmp/TC-I007.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import { runRoutes } from './src/web/routes/run';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I007.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Config

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I006 | Frontend | Verifies that the GET /config endpoint sanitizes sensitive information like API keys before sending the response. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I006 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I006.test.ts [ ai-test-tmp/TC-I006.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I006.test.ts'  ❯ ai-test-tmp/TC-I006.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import { configRoutes } from './src/web/routes/config';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I006.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Feature: Cross-Feature (Browse, Run)

- Total Cases: 1 (Pass: 0, Fail: 1, Blocked: 0, Skipped: 0)

### Generated Test Cases

| Case ID | Category | Description |
| --- | --- | --- |
| TC-I003 | Frontend | Verifies the user flow of browsing for a directory and then using that path to start a new run. |


### Failed / Blocked Execution Details

| Case ID | Status | Error Detail |
| --- | --- | --- |
| TC-I003 | FAIL |  ⎯⎯⎯⎯⎯⎯ Failed Suites 1 ⎯⎯⎯⎯⎯⎯⎯   FAIL  ai-test-tmp/TC-I003.test.ts [ ai-test-tmp/TC-I003.test.ts ] Error: Cannot find package 'supertest' imported from '/Users/lilong/Desktop/testCode/ai-test-tmp/TC-I003.test.ts'  ❯ ai-test-tmp/TC-I003.test.ts:2:1       1\| import { describe, it, expect, vi, beforeEach } from 'vitest';       2\| import request from 'supertest';        \| ^       3\| import express from 'express';       4\| import * as fs from 'node:fs/promises';  Caused by: Error: Failed to load url supertest (resolved id: supertest) in /Users/lilong/Desktop/testCode/ai-test-tmp/TC-I003.test.ts. Does the file exist?  ❯ loadAndTransform node_modules/vite/dist/node/chunks/config.js:22663:33  ⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯⎯[1/1]⎯   |


## Self-Healing Retry Summary

- Cases retried: 65
- Successfully fixed: 24
- Still failing after retry: 41
- Retry token usage: 492011

| Case ID | Category | Attempts | Final Status |
| --- | --- | --- | --- |
| TC-C001 | Compatibility | 1 | FAIL |
| TC-C005 | Compatibility | 1 | FAIL |
| TC-C003 | Compatibility | 1 | FAIL |
| TC-C002 | Compatibility | 1 | PASS |
| TC-C001 | Compatibility | 1 | FAIL |
| TC-B004 | Backend | 1 | PASS |
| TC-B006 | Backend | 1 | PASS |
| TC-C004 | Compatibility | 2 | FAIL |
| TC-B005 | Backend | 1 | PASS |
| TC-C003 | Compatibility | 1 | FAIL |
| TC-C002 | Compatibility | 1 | FAIL |
| TC-F001 | Frontend | 1 | FAIL |
| TC-C004 | Compatibility | 1 | PASS |
| TC-F002 | Frontend | 1 | FAIL |
| TC-P001 | Performance | 1 | PASS |
| TC-P002 | Performance | 1 | PASS |
| TC-F003 | Frontend | 1 | FAIL |
| TC-B001 | Backend | 1 | PASS |
| TC-F005 | Frontend | 1 | FAIL |
| TC-B003 | Backend | 1 | PASS |
| TC-F004 | Frontend | 1 | FAIL |
| TC-B004 | Backend | 1 | PASS |
| TC-B002 | Backend | 1 | PASS |
| TC-B007 | Backend | 1 | PASS |
| TC-B006 | Backend | 1 | PASS |
| TC-B008 | Backend | 1 | PASS |
| TC-B005 | Backend | 1 | PASS |
| TC-B009 | Backend | 1 | PASS |
| TC-B010 | Backend | 1 | PASS |
| TC-B011 | Backend | 1 | PASS |
| TC-B013 | Backend | 1 | FAIL |
| TC-B012 | Backend | 1 | PASS |
| TC-C003 | Compatibility | 1 | PASS |
| TC-F003 | Frontend | 1 | FAIL |
| TC-F006 | Frontend | 1 | FAIL |
| TC-F001 | Frontend | 1 | FAIL |
| TC-F007 | Frontend | 1 | FAIL |
| TC-F008 | Frontend | 1 | FAIL |
| TC-F005 | Frontend | 1 | FAIL |
| TC-F004 | Frontend | 1 | FAIL |
| TC-F002 | Frontend | 1 | FAIL |
| TC-F010 | Frontend | 1 | FAIL |
| TC-B002 | Backend | 1 | PASS |
| TC-F009 | Frontend | 1 | FAIL |
| TC-B003 | Backend | 1 | PASS |
| TC-B005 | Backend | 1 | FAIL |
| TC-F011 | Frontend | 1 | FAIL |
| TC-B001 | Backend | 1 | FAIL |
| TC-B004 | Backend | 1 | FAIL |
| TC-P001 | Performance | 2 | FAIL |
| TC-F012 | Frontend | 1 | FAIL |
| TC-B007 | Backend | 1 | PASS |
| TC-B006 | Backend | 1 | FAIL |
| TC-B008 | Backend | 1 | FAIL |
| TC-F013 | Frontend | 1 | FAIL |
| TC-F001 | Frontend | 1 | FAIL |
| TC-F005 | Frontend | 1 | FAIL |
| TC-F004 | Frontend | 1 | FAIL |
| TC-F003 | Frontend | 1 | FAIL |
| TC-F006 | Frontend | 1 | FAIL |
| TC-C004 | Compatibility | 1 | PASS |
| TC-F002 | Frontend | 1 | FAIL |
| TC-F008 | Frontend | 1 | FAIL |
| TC-F009 | Frontend | 1 | FAIL |
| TC-F007 | Frontend | 1 | FAIL |


## Project Info

- Path: /Users/lilong/Desktop/testCode
- Backend: express
- Features tested: 8

---

Generated by ai-test at 2026-03-12T18:53:12.258Z
