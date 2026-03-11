# AI Testing Tool - Requirements

## Overview

An AI-powered automated testing tool, analogous to Claude Code for development. This tool focuses on **automated test analysis, case generation, execution, and reporting** for projects. Since the primary use case is web applications, the tool provides **built-in web UI automation testing** capabilities. Additionally, the tool supports **MCP (Model Context Protocol) Server tool call testing** to verify AI tool integrations.

## Core Workflow

```
Analyze Project -> Generate Cases -> Unit Test -> Web UI Auto Test -> MCP Tool Test -> Integration Test -> Report
```

### Step 1: Project Feature Analysis

- Scan the current project's codebase (frontend + backend)
- Identify all functional modules and their boundaries
- Discover MCP Server configurations and registered tools
- Build a feature list (including MCP tool capabilities) as the basis for test coverage

### Step 2: Test Case Generation

For each identified feature, generate test cases covering:

| Category | Scope | Examples |
|----------|-------|---------|
| Frontend Case | UI interaction, rendering, state management | Form validation, page routing, component rendering |
| Backend Case | API, business logic, data layer | API response, parameter validation, DB read/write |
| Web UI Auto Case | Browser-level E2E user flows | Click, input, navigation, assertion on real pages |
| MCP Tool Case | MCP Server tool discovery, invocation, response | Tool listing, parameter validation, error handling |

Each case should include:

- Case ID
- Target feature
- Category (Frontend / Backend / Web UI Auto / MCP Tool)
- Description
- Preconditions
- Input / Operation steps
- Expected result

### Step 3: Sequential Unit Testing

- Execute test cases one by one
- Record the result of each case (Pass / Fail / Blocked)
- Capture error details and context for failed cases

### Step 4: Web UI Automation Testing

Use browser automation to test real user flows on the running web application.

#### Automation Engine

- Based on **Playwright** / **Puppeteer** (headless or headed browser)
- AI generates automation scripts automatically from the test cases
- Support Chromium / Firefox / WebKit multi-browser execution

#### Capability Matrix

| Capability | Description |
|------------|-------------|
| Page Navigation | Open URLs, handle redirects, wait for page load |
| Element Interaction | Click, type, select, drag, hover, scroll |
| Form Testing | Fill forms, submit, validate success/error states |
| Assertion | Check element text, visibility, attributes, URL, page title |
| Screenshot & Video | Capture screenshots on failure, optional video recording |
| Network Interception | Mock API responses, validate request payloads |
| Multi-page Flow | Login -> operate -> verify, shopping cart flow, etc. |
| Responsive Testing | Test across multiple viewport sizes (mobile / tablet / desktop) |
| Wait Strategy | Smart waits for elements, network idle, animations |

#### Execution Flow

```
Start Dev Server (if needed)
       |
  Open Browser (headless)
       |
  For each Web UI Auto Case:
       |-- Navigate to target page
       |-- Execute interaction steps
       |-- Run assertions
       |-- Capture screenshot on failure
       |-- Record Pass / Fail
       |
  Close Browser
```

#### Example Generated Script (Playwright)

```typescript
// Auto-generated: TC-W001 - User Login Flow
test('user can login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('#username', 'testuser');
  await page.fill('#password', 'testpass');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('.welcome')).toContainText('testuser');
});
```

### Step 5: MCP Server Tool Call Testing

Test all MCP Server tool integrations to ensure tools are correctly registered, callable, and return expected results.

#### What is MCP Tool Testing

MCP (Model Context Protocol) defines a standard for AI models to discover and invoke external tools exposed by MCP Servers. This step verifies that:

- MCP Servers start and connect successfully
- Tools are correctly registered and discoverable via `tools/list`
- Tool calls with valid parameters return correct results
- Tool calls with invalid parameters return proper errors
- Tools handle edge cases (timeout, large payloads, concurrent calls)

#### Test Dimensions

| Dimension | Description |
|-----------|-------------|
| Server Lifecycle | Server start, initialize handshake, graceful shutdown, reconnection |
| Tool Discovery | `tools/list` returns all expected tools with correct schemas (name, description, inputSchema) |
| Parameter Validation | Required params, optional params, type mismatch, missing params, extra params |
| Normal Invocation | Call each tool with valid inputs, verify output structure and content |
| Error Handling | Invalid tool name, malformed request, server-side exception, timeout |
| Edge Cases | Empty input, very large input, special characters, concurrent calls |
| Transport Layer | stdio / SSE / Streamable HTTP — verify protocol-level correctness |

#### Execution Flow

```
Read MCP config (mcp.json / claude_desktop_config.json)
       |
  For each MCP Server:
       |-- Start server process (stdio) or connect (SSE/HTTP)
       |-- Send initialize request, verify capabilities
       |-- Call tools/list, validate tool schemas
       |
       |-- For each Tool:
       |     |-- Call with valid params -> assert result
       |     |-- Call with invalid params -> assert error
       |     |-- Call with edge-case params -> assert behavior
       |     |-- Measure response time
       |
       |-- Send shutdown, verify clean exit
       |
  Record all results
```

#### Example Test Cases

```
TC-M001: Server starts and completes initialize handshake
TC-M002: tools/list returns expected tools with correct inputSchema
TC-M003: Tool "search_files" returns results for valid query
TC-M004: Tool "search_files" returns error for missing required param "query"
TC-M005: Tool "read_file" handles non-existent file path gracefully
TC-M006: Tool call with 10MB payload returns within timeout
TC-M007: 10 concurrent tool calls complete without errors
TC-M008: Server reconnects after unexpected disconnect
```

#### Example Generated Test Script

```typescript
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';

// Auto-generated: TC-M003 - Tool "search_files" normal invocation
test('search_files returns results for valid query', async () => {
  const transport = new StdioClientTransport({
    command: 'node',
    args: ['./mcp-server/index.js'],
  });
  const client = new Client({ name: 'test-client', version: '1.0.0' });
  await client.connect(transport);

  const result = await client.callTool({
    name: 'search_files',
    arguments: { query: 'hello', path: './src' },
  });

  expect(result.isError).toBeFalsy();
  expect(result.content).toBeDefined();
  expect(result.content[0].type).toBe('text');

  await client.close();
});
```

### Step 6: Integration Testing

- After all unit-level, web UI, and MCP tool cases pass, run integration tests
- Verify cross-module interactions and end-to-end flows
- Verify MCP tools work correctly within the full application context (e.g. frontend triggers MCP tool call via backend)
- Confirm each feature works as a whole

### Step 7: Iterate Until Full Coverage

- Loop through Step 3-6 until every feature has been tested
- Re-test failed cases after fixes

### Step 8: Generate Test Report

Output a final markdown report structured as:

```markdown
# Test Report

## Summary
- Total Cases: N
- Passed: X
- Failed: Y

## Passed Cases
| Case ID | Feature | Category | Description |
|---------|---------|----------|-------------|
| TC-001  | Login   | Backend      | ...         |
| TC-W01  | Login   | Web UI Auto  | ...         |
| TC-M01  | Search  | MCP Tool     | ...         |

## Failed Cases
| Case ID | Feature | Category | Description | Error Detail |
|---------|---------|----------|-------------|--------------|
| TC-005  | Upload  | Frontend     | ...         | ...              |
| TC-W03  | Upload  | Web UI Auto  | ...         | screenshot link  |
| TC-M04  | Search  | MCP Tool     | ...         | error response   |
```

## Web UI Automation - Technical Requirements

### Environment

- Runtime: Node.js
- Framework: Playwright (preferred) or Puppeteer
- Browser: Chromium headless by default, configurable to headed mode for debugging
- Dev server: Auto-detect and start if not already running (e.g. `npm run dev`)

### AI-Driven Script Generation

The AI analyzes page structure (DOM, routes, components) to automatically generate automation scripts. No manual selector maintenance required — the AI:

1. Reads the frontend source code to understand page structure and routes
2. Identifies interactive elements and their selectors (prefer `data-testid` > role > CSS)
3. Generates Playwright test scripts for each Web UI Auto Case
4. Executes scripts and collects results

### Failure Handling

| Scenario | Action |
|----------|--------|
| Element not found | Retry with alternative selector, then fail with screenshot |
| Page load timeout | Record timeout error, capture current page state |
| Assertion failure | Screenshot + DOM snapshot + actual vs expected diff |
| Uncaught JS error | Capture console errors, attach to test result |

### Artifacts

All web automation test runs produce:

```
test-results/
├── screenshots/        # Failure screenshots
├── videos/             # Optional video recordings
├── traces/             # Playwright trace files for debugging
└── report.html         # Visual HTML report
```

## MCP Tool Testing - Technical Requirements

### MCP Config Discovery

The AI automatically locates MCP Server configurations from:

- Project-level: `mcp.json` / `.mcp.json` in project root
- User-level: `~/.claude/claude_desktop_config.json`
- Custom path: User-specified config file

### Supported Transports

| Transport | Description | Test Method |
|-----------|-------------|-------------|
| stdio | Server runs as a child process, communicates via stdin/stdout | Spawn process, pipe JSON-RPC messages |
| SSE | Server exposes HTTP SSE endpoint | HTTP client connects to SSE stream |
| Streamable HTTP | Server exposes HTTP endpoint with streaming | HTTP POST with streaming response |

### AI-Driven MCP Test Generation

The AI reads MCP Server source code and configuration to automatically generate test cases:

1. Parse MCP config to identify all registered servers and their startup commands
2. Connect to each server, call `tools/list` to get tool schemas
3. Analyze each tool's `inputSchema` (JSON Schema) to generate:
   - Valid parameter combinations (happy path)
   - Boundary values (min/max, empty string, zero)
   - Type-mismatched parameters (string where number expected)
   - Missing required parameters
   - Extra unknown parameters
4. If server source code is available, analyze business logic to generate domain-specific cases

### MCP Test Artifacts

```
test-results/
├── mcp/
│   ├── server-logs/          # stdout/stderr of each MCP server
│   ├── request-response/     # Full JSON-RPC request/response pairs
│   ├── schema-snapshots/     # tools/list schema snapshots for regression
│   └── performance.json      # Response time per tool call
```

## Key Principles

1. **Analyze first, test later** - Fully understand the project before generating any cases
2. **Four-layer coverage** - Every feature gets frontend, backend, web UI automation, and MCP tool cases as applicable
3. **Sequential execution** - Run cases one by one, not in batch, to isolate failures
4. **Web automation as first-class** - Browser-based E2E tests are a core part of the pipeline, not optional
5. **MCP tools fully verified** - Every registered MCP tool is tested for discovery, invocation, error handling, and edge cases
6. **Integration after all layers** - Only proceed to integration testing when unit, web UI, and MCP tool cases pass
7. **Loop until done** - Keep iterating until all features are fully tested
8. **Structured output** - Final report is a clear, actionable markdown with screenshots and MCP request/response logs for failures
