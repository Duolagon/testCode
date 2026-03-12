# AI Test Tool — Architecture Diagram

## 系统全景

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          CLI Entry (Commander.js)                       │
│  ai-test run | analyze | report | init | chat                          │
│  --path --category --provider --model --coverage --ci --budget         │
└──────────────────────────────────┬──────────────────────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │     Commands Dispatcher      │
                    │  run.ts | analyze.ts | ...   │
                    └──────────────┬──────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐    ┌────────────────────┐    ┌────────────────────┐
│   Config Layer   │    │   UI Layer          │    │   Services Layer   │
│                 │    │                    │    │                    │
│ types.ts        │    │ logger.ts          │    │ ai-client.ts       │
│ defaults.ts     │    │ spinner.ts         │    │ ai-client-factory  │
│ index.ts        │    │ progress.ts        │    │ claude-client.ts   │
│                 │    │ prompts.ts         │    │ gemini-client.ts   │
│ ┌─────────────┐ │    │ table.ts           │    │ dev-server.ts      │
│ │ ai          │ │    │                    │    │ file-service.ts    │
│ │ project     │ │    └────────────────────┘    │ coverage-service   │
│ │ webui       │ │                              │ playwright-service │
│ │ mcp         │ │                              │ mcp-client-service │
│ │ output      │ │                              └────────────────────┘
│ │ retry       │ │
│ │ coverage    │ │
│ │ budget      │ │
│ │ ci          │ │
│ └─────────────┘ │
└─────────────────┘

```

## 核心流水线 (run.ts 主流程)

```
Step 1                Step 2               Step 3              Step 4           Step 5
ANALYZE ──────────▶  GENERATE ──────────▶  EXECUTE ──────────▶ INTEGRATE ────▶ REPORT

┌──────────┐      ┌──────────────┐      ┌──────────────┐    ┌───────────┐   ┌──────────┐
│ Analyzer │      │  Generator   │      │   Executor   │    │Integration│   │ Reporter │
│ Module   │      │  Module      │      │   Module     │    │ Module    │   │ Module   │
└────┬─────┘      └──────┬───────┘      └──────┬───────┘    └─────┬─────┘   └────┬─────┘
     │                   │                     │                  │              │
     ▼                   ▼                     ▼                  ▼              ▼
 ProjectInfo        TestCase[]           TestResult[]        TestResult[]    report.md
 (features,         (testCode,           (pass/fail,         (pass/fail)    report.json
  endpoints,         category,            errorDetail,                      coverage
  components,        steps)               duration,
  mcp servers)                            retryInfo)
```

## Step 1: Analyzer 模块详细

```
┌─────────────────────────────────────────────────────────────┐
│                    analyzeProject()                          │
│                    src/core/analyzer/index.ts                │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┼───────────────────┬──────────────────┐
        ▼                   ▼                   ▼                  ▼
┌───────────────┐  ┌────────────────┐  ┌────────────────┐  ┌─────────────┐
│ file-scanner  │  │ frontend-      │  │ backend-       │  │ mcp-        │
│               │  │ analyzer       │  │ analyzer       │  │ analyzer    │
│ 递归扫描文件   │  │                │  │                │  │             │
│ 分类: component│  │ 检测框架:      │  │ 检测框架:      │  │ 读取配置:   │
│ page, route,  │  │ React/Vue/     │  │ Express/       │  │ mcp.json    │
│ controller,   │  │ Next/Nuxt/     │  │ Fastify/       │  │ claude cfg  │
│ model,        │  │ Svelte/Angular │  │ NestJS/Koa     │  │             │
│ service, test │  │                │  │                │  │ 提取:       │
│               │  │ 提取路由       │  │ 提取 endpoints │  │ servers[]   │
│               │  │ 提取组件       │  │ 正则匹配       │  │ tools[]     │
└───────────────┘  └────────────────┘  └────────────────┘  └─────────────┘
        │                   │                   │                  │
        └───────────────────┼───────────────────┘                  │
                            ▼                                      │
                   ┌─────────────────┐                             │
                   │ buildFeatureMap  │◄────────────────────────────┘
                   │                 │
                   │ 路由→Feature     │
                   │ 组件→Feature     │
                   │ Endpoint→Feature│
                   │ MCPTool→Feature  │
                   │ Fallback→Feature│
                   └────────┬────────┘
                            │
        ┌───────────────────┼────────────────┐
        ▼                   ▼                ▼
┌───────────────┐  ┌────────────────┐  ┌──────────────┐
│ diff-analyzer │  │ code-insight   │  │ cache        │
│ (增量模式)     │  │ (代码洞察)      │  │ (.ai-test-   │
│               │  │                │  │  cache.json) │
│ git diff      │  │ 提取分支条件   │  │              │
│ git ls-files  │  │ 提取错误路径   │  │ 5分钟 TTL    │
│ → changedSet  │  │ 提取参数校验   │  │              │
│ → 过滤feature │  │ 提取外部依赖   │  │              │
│               │  │ → 复杂度评分   │  │              │
└───────────────┘  └────────────────┘  └──────────────┘
```

## Step 2: Generator 模块详细

```
┌──────────────────────────────────────────────────────────────────┐
│                   generateTestCases() — AsyncGenerator           │
│                   src/core/generator/index.ts                    │
│                                                                  │
│  并发引擎: pLimit(cpuCount, max=10)                              │
│  进度条: cli-progress                                            │
└──────────────────────────────┬───────────────────────────────────┘
                               │
              for each (Feature × Category)
                               │
        ┌──────────────────────▼──────────────────────┐
        │              buildPrompt()                   │
        │         prompt-builder.ts                    │
        │                                              │
        │  1. readSourceSnippets() — 读源码 (≤200K)    │
        │     ├─ 单文件限制 ≤20K                       │
        │     ├─ 路径遍历校验                          │
        │     └─ analyzeCodeInsight() — 代码洞察       │
        │        ├─ 导出函数列表                       │
        │        ├─ 分支条件 (if/switch/ternary/??/?.) │
        │        ├─ 错误路径 (throw/catch/reject)      │
        │        ├─ 参数校验 (null/undefined/typeof)   │
        │        └─ 外部依赖 (fs/网络/进程)            │
        │                                              │
        │  2. getTemplate(category) — 选择 prompt 模板 │
        │     ├─ frontendTemplate                      │
        │     ├─ backendTemplate                       │
        │     ├─ webuiTemplate                         │
        │     ├─ mcpTemplate                           │
        │     ├─ integrationTemplate                   │
        │     ├─ compatibilityTemplate                 │
        │     └─ performanceTemplate                   │
        │                                              │
        │  3. PLACEHOLDERS 替换                         │
        │     {{FEATURE_NAME}}, {{SOURCE_CODE}},       │
        │     {{TEST_RUNNER}}, {{ENDPOINTS}}, ...      │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │           AI Client (Stream Mode)            │
        │                                              │
        │  ┌─────────┐  ┌──────────┐  ┌────────────┐  │
        │  │ Gemini  │  │ Claude   │  │ OpenAI ❌  │  │
        │  │ Client  │  │ Client   │  │ (未实现)   │  │
        │  └─────────┘  └──────────┘  └────────────┘  │
        │                                              │
        │  流式输出 → 拼接完整响应 → 返回 token usage   │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
        ┌──────────────────────────────────────────────┐
        │              parseCases()                     │
        │          case-parser.ts                       │
        │                                              │
        │  1. extractJsonFromMarkdown()                │
        │     └─ 尝试 code block → 裸 JSON 数组        │
        │                                              │
        │  2. sanitizeJsonString()                     │
        │     ├─ 策略1: 修复字符串内裸换行              │
        │     ├─ 策略2: 逐字符修复非法转义              │
        │     └─ 策略3: 包裹成数组重试                  │
        │                                              │
        │  3. Zod Schema 校验 (TestCaseArraySchema)    │
        │                                              │
        │  4. postProcessTestCode()                    │
        │     ├─ 替换 {{TEST_RUNNER}} 占位符           │
        │     ├─ 修复 \\n 双重转义                     │
        │     ├─ 修复字符串中裸换行/CRLF               │
        │     ├─ vitest: mocked() → vi.mocked()       │
        │     └─ jest: vi.* → jest.* 适配              │
        └──────────────────────┬──────────────────────┘
                               │
                               ▼
                         GeneratedBatch
                        { cases, usage }
```

## Step 3: Executor 模块详细

```
┌─────────────────────────────────────────────────────────────────────┐
│                     executeTestCases()                               │
│                  src/core/executor/index.ts                         │
│                                                                     │
│  并发策略:                                                          │
│  ├─ 阶段1: 并行执行 (Frontend/Backend/Compat/Perf) — cpuCount 并发  │
│  └─ 阶段2: 串行执行 (WebUI/MCP) — 共享资源                         │
└──────────────────────────────┬──────────────────────────────────────┘
                               │
           ┌───────────────────┼───────────────────┐
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│  Unit Executor   │  │ WebUI Executor  │  │  MCP Executor   │
│  unit-executor   │  │ webui-executor  │  │  mcp-executor   │
│                 │  │                 │  │                 │
│ ┌─────────────┐ │  │ 生成完整的      │  │ JSON 步骤解析:  │
│ │ vitest run  │ │  │ Playwright 脚本  │  │                 │
│ │ jest        │ │  │                 │  │ ┌─────────────┐ │
│ │ mocha       │ │  │ ┌─────────────┐ │  │ │ list_tools  │ │
│ │ node --test │ │  │ │ chromium    │ │  │ │ → 验证工具名 │ │
│ └──────┬──────┘ │  │ │ launch()   │ │  │ └─────────────┘ │
│        │        │  │ │            │ │  │ ┌─────────────┐ │
│  ┌─────▼──────┐ │  │ │ navigate  │ │  │ │ call_tool   │ │
│  │ pass/fail  │ │  │ │ interact  │ │  │ │ → 验证结果   │ │
│  │ + coverage │ │  │ │ assert    │ │  │ │ → isError?  │ │
│  └─────┬──────┘ │  │ │ screenshot│ │  │ │ → hasContent│ │
│        │        │  │ └─────────────┘ │  │ └─────────────┘ │
│  ┌─────▼──────┐ │  │                 │  │                 │
│  │Self-Healing│ │  │ 超时: 120s      │  │ 超时: 30s/操作  │
│  │            │ │  │ 截图: 失败时     │  │ 传输: stdio only│
│  │ 分类错误:  │ │  │                 │  │ 日志: JSON 文件 │
│  │ syntax     │ │  │ ❌ 无多浏览器   │  │                 │
│  │ assertion  │ │  │ ❌ 无视频录制   │  │ ❌ 无 SSE       │
│  │ timeout    │ │  │ ❌ 无网络拦截   │  │ ❌ 无 HTTP      │
│  │ unknown    │ │  │ ❌ 无响应式     │  │ ❌ 无并发测试   │
│  │            │ │  │ ❌ 无 Trace     │  │ ❌ 无大 payload │
│  │ AI 修复    │ │  └─────────────────┘  └─────────────────┘
│  │ (max N次)  │ │
│  │ esbuild    │ │
│  │ 语法预检   │ │
│  └────────────┘ │
│                 │
│ ⚠ 所有非WebUI/ │         ┌─────────────────────────────────┐
│   MCP 类型都走  │         │     Integration Executor         │
│   这条路径     ├────────▶│  integration-executor.ts         │
│   (含 Frontend │         │                                 │
│    Backend     │         │  return executeUnitTest(...)     │
│    Compat      │         │  ← 直接委托给 UnitExecutor 空壳  │
│    Perf)       │         │                                 │
└─────────────────┘         │  ❌ 无跨模块编排                │
                            │  ❌ 无前后端联动                │
                            │  ❌ 无 session/token 管理       │
                            └─────────────────────────────────┘
```

## Step 4: Reporter 模块

```
┌────────────────────────────────────────────────────────┐
│                  generateReport()                       │
│              src/core/reporter/index.ts                 │
│                                                        │
│  输入:                                                  │
│  ├─ TestResult[]                                       │
│  ├─ ProjectInfo                                        │
│  ├─ TokenUsage                                         │
│  └─ CoverageSummary (可选)                              │
│                                                        │
│  MarkdownBuilder 生成:                                  │
│  ├─ # Summary (总数/通过/失败/耗时/Token)               │
│  ├─ ## Code Coverage (行/分支/函数/语句)                │
│  ├─ ## Results by Category (表格)                      │
│  ├─ ## Feature: xxx (每个 feature 详细)                │
│  │   ├─ 测试用例列表                                   │
│  │   └─ 失败详情                                       │
│  ├─ ## Self-Healing Summary                            │
│  └─ ## Project Info                                    │
│                                                        │
│  输出:                                                  │
│  ├─ test-report.md (Markdown)                          │
│  └─ test-results/report.json (CI 模式)                 │
│                                                        │
│  ❌ 无 report.html 可视化报告                           │
│  ❌ 无历史对比/趋势图                                   │
│  ❌ 无性能指标报告                                      │
│  ❌ 无 MCP 请求/响应详细日志报告                        │
└────────────────────────────────────────────────────────┘
```

## 数据流全景

```
                    ┌─────────┐
                    │ .env    │  API Keys
                    └────┬────┘
                         │
┌──────────┐        ┌────▼────────────┐
│ ai-test  │        │  Config Loader  │
│ .config  ├───────▶│  defaults.ts    │
│ .json    │        │  + deepMerge    │
└──────────┘        └────┬────────────┘
                         │ Config
                         ▼
┌──────────┐        ┌─────────────┐        ┌──────────────┐
│ Project  │        │             │        │ AI Provider  │
│ Source   ├───────▶│  ANALYZER   ├───────▶│              │
│ Code     │        │             │        │ Gemini ✅    │
└──────────┘        └──────┬──────┘        │ Claude ✅    │
                           │               │ OpenAI ❌    │
                    ProjectInfo            └──────┬───────┘
                           │                      │
                    ┌──────▼──────┐               │
                    │  GENERATOR  │◄──────────────┘
                    │             │  AI 流式生成
                    └──────┬──────┘
                           │
                     TestCase[]
                           │
                    ┌──────▼──────┐
                    │  EXECUTOR   │
                    │             │◄──── AI (自愈修复)
                    └──────┬──────┘
                           │
                    TestResult[]
                           │
         ┌─────────────────┼─────────────────┐
         ▼                 ▼                 ▼
┌─────────────┐   ┌──────────────┐   ┌────────────┐
│ test-report │   │ report.json  │   │ coverage/  │
│ .md         │   │ (CI mode)    │   │ (optional) │
└─────────────┘   └──────────────┘   └────────────┘
```

## 各测试类型的实际执行路径

```
用户视角的 7 种测试类型:

  Frontend ──────┐
  Backend  ──────┤
  Compatibility ─┤───▶ 全部走 executeUnitTestWithRetry() ───▶ vitest/jest/mocha
  Performance  ──┤       (唯一区别是 AI prompt 模板不同)
  Integration  ──┘

  WebUI ─────────────▶ wrapPlaywrightScript() ───▶ tsx 执行 Playwright 脚本
                         (独立执行路径)

  MCP ───────────────▶ executeMcpTest() ───▶ MCP SDK Client (stdio only)
                         (独立执行路径)


实际独立执行器只有 3 个:
  ┌────────────────────────────────────────────────────┐
  │  1. Unit Executor     — 5 种测试类型共用           │
  │  2. WebUI Executor    — Playwright 包裹            │
  │  3. MCP Executor      — MCP SDK stdio              │
  └────────────────────────────────────────────────────┘

  需要但不存在的执行器:
  ┌────────────────────────────────────────────────────┐
  │  ❌ HTTP Executor     — 真实 API 请求测试          │
  │  ❌ Load Executor     — 并发压力测试               │
  │  ❌ Integration Orchestrator — 多服务编排           │
  │  ❌ Multi-Browser Executor — Firefox/WebKit        │
  │  ❌ SSE/HTTP MCP Executor — 非 stdio 传输          │
  └────────────────────────────────────────────────────┘
```
