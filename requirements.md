# AI Test Tool — 需求文档

## 需求文档解析 [P0]

系统能够解析 Markdown 和 JSON 格式的需求文档，从中提取功能点、验收标准、UI 规格和 API 接口定义。

### 验收标准
- 支持解析 Markdown 格式需求文档，提取二级标题作为功能点
- 支持解析三级标题下的验收标准、UI 规格、API 接口子段落
- 支持解析 JSON 格式需求文档（items 或 features 数组）
- 自动识别优先级标记（P0/P1/P2/P3）
- 将解析后的功能点转换为 FeatureEntry，自动推断测试类别（Frontend/Backend/WebUI）
- 有 UI 描述的功能点自动包含 WebUI 类别
- 有 API 描述的功能点自动包含 Backend 类别

### API 接口
- parseRequirementDoc(filePath) — 读取并解析需求文档
- requirementToFeatures(spec) — 将需求转换为 FeatureEntry 数组

## AI 测试用例生成 [P0]

系统使用 AI（Gemini/Claude）根据项目信息和功能特征自动生成可执行的测试代码。

### 验收标准
- 支持为 Frontend、Backend、WebUI、MCP、Integration 等类别生成测试
- 生成的测试用例包含 caseId、feature、category、description、testCode 等字段
- AI 返回的 JSON 能被正确解析，即使格式不完美也能容错处理
- 支持 vitest 和 jest 两种测试运行器的代码适配
- jest 模式下自动将 vi.mock → jest.mock、vi.fn → jest.fn
- testCode 中的原始换行符被正确转义
- 支持流式生成并显示进度条
- 支持并发生成（基于 CPU 核心数动态调整）
- 支持预算控制，超过 token 限制时停止生成

### API 接口
- generateTestCases(projectInfo, config, aiClient) — 代码驱动生成
- generateFromRequirement(spec, projectInfo, config, aiClient) — 需求驱动生成
- parseCases(text, feature, category, testRunner) — 解析 AI 返回的测试用例

## 项目分析器 [P0]

系统自动扫描项目源码，识别前端框架、后端框架、API 端点、路由、组件等信息。

### 验收标准
- 自动检测前端框架（React/Vue/Next/Nuxt/Svelte/Angular）
- 自动检测后端框架（Express/Fastify/NestJS/Koa）
- 从源码中提取 API 端点（GET/POST/PUT/DELETE）
- 从源码中提取前端路由和组件
- 自动检测测试运行器（vitest/jest/mocha）
- 支持增量模式，基于 git diff 只分析变更文件
- 分析结果缓存 5 分钟，避免重复扫描
- 代码洞察：提取分支条件、错误路径、参数校验

### API 接口
- analyzeProject(projectPath, config) — 分析项目
- analyzeCodeInsight(content, filePath) — 代码洞察分析

## 测试执行器 [P0]

系统执行 AI 生成的测试代码，支持单元测试和 E2E 浏览器测试两种模式。

### 验收标准
- 单元测试通过 vitest/jest/mocha 执行，支持并行
- WebUI 测试通过 Playwright 执行，支持 chromium/firefox/webkit
- WebUI 测试失败时自动截图保存
- 测试失败后 AI 自愈：分析错误信息，自动修复测试代码并重试
- 自愈支持语法错误、断言错误的分类重试
- 自愈修复后通过 esbuild 校验语法正确性
- 支持覆盖率收集（v8/istanbul provider）
- 执行结果包含 caseId、status、duration、errorDetail

### API 接口
- executeTestCases(cases, context, fileService, mcpServers) — 批量执行
- executeUnitTestWithRetry(testCase, context, fileService) — 单元测试 + 自愈
- executeWebUITestWithRetry(testCase, context, fileService) — E2E 测试 + 自愈

## Prompt 模板系统 [P1]

为不同测试类别提供专业的 AI Prompt 模板，指导 AI 生成高质量测试代码。

### 验收标准
- 前端模板支持组件测试、函数测试指导
- 后端模板支持纯单元测试，禁止生成 HTTP 请求测试
- WebUI 模板生成 Playwright 脚本，包含选择器优先级指导
- 需求驱动模板根据验收标准生成测试，支持 TDD 模式
- 模板支持占位符替换（FEATURE_NAME、SOURCE_CODE 等）
- 源码注入时限制总量 200K 字符、单文件 20K 字符
- 路径遍历防护：源码读取不超出项目目录

### API 接口
- buildPrompt(feature, category, projectInfo, config) — 代码驱动 prompt
- buildRequirementPrompt(feature, category, projectInfo, config) — 需求驱动 prompt

## 配置与 CLI [P1]

提供命令行工具和灵活的配置系统。

### 验收标准
- 支持 ai-test run 命令执行完整测试流程
- 支持 --spec 参数启用需求驱动模式
- 支持 --coverage 启用覆盖率收集
- 支持 --ci 模式输出 JSON 报告并根据通过率设置退出码
- 支持 --budget 设置 token 预算上限
- 支持 --no-interactive 跳过交互确认
- 配置优先级：CLI 参数 > 配置文件 > 环境变量 > 默认值
- 支持 ai-test init 初始化配置

### API 接口
- loadConfig(projectPath, cliOverrides) — 加载合并配置
