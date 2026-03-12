# AI Test Tool — 待完成事项

## 一、缺失的执行器

### 1. HTTP Executor（后端接口测试）
- [ ] 创建 `src/core/executor/http-executor.ts`
- [ ] 支持真实 HTTP 请求（GET/POST/PUT/DELETE）
- [ ] 自动启动后端服务（类似 DevServerManager）
- [ ] 请求体构造、Header 注入、Cookie/Token 管理
- [ ] 响应状态码、响应体 JSON Schema 校验
- [ ] 支持链式请求（登录→获取 token→带 token 请求）
- [ ] 支持 supertest 或原生 fetch 两种模式
- [ ] 请求/响应日志记录到 artifacts

### 2. Load Executor（压力测试）
- [ ] 创建 `src/core/executor/load-executor.ts`
- [ ] 并发负载生成（可配置并发数和持续时间）
- [ ] QPS/TPS 吞吐量测量
- [ ] 响应时间分布（P50/P90/P99）
- [ ] 错误率统计
- [ ] 性能基线存储和对比（与历史数据比较）
- [ ] 性能报告输出（performance.json）
- [ ] 支持 autocannon 或自研轻量引擎

### 3. Integration Orchestrator（集成测试编排）
- [ ] 重写 `src/core/executor/integration-executor.ts`（当前是空壳）
- [ ] 多服务启动编排（前端 + 后端 + 数据库 mock）
- [ ] 服务间依赖检测和启动顺序
- [ ] 共享测试上下文（session、token、用户状态）
- [ ] 跨模块数据流验证
- [ ] 前端触发 → 后端处理 → 数据库写入 → 前端展示 全链路
- [ ] MCP 工具在应用上下文中的集成验证
- [ ] 测试数据 fixture 管理和清理

### 4. Multi-Browser Executor（多浏览器测试）
- [ ] 修改 `src/core/executor/webui-executor.ts`
- [ ] 支持 Firefox（firefox）
- [ ] 支持 WebKit（webkit/Safari）
- [ ] 根据 config.webui.browser 动态选择浏览器
- [ ] 支持同一用例跨多浏览器并行执行
- [ ] 每个浏览器独立结果和截图

### 5. SSE/HTTP MCP Executor（MCP 非 stdio 传输）
- [ ] 修改 `src/core/executor/mcp-executor.ts`
- [ ] SSE 传输：HTTP 客户端连接 SSE 事件流
- [ ] Streamable HTTP 传输：HTTP POST + 流式响应
- [ ] 传输层自动检测（根据 server config 选择）
- [ ] 重连测试：断开后自动重连验证
- [ ] 并发调用测试：多个 tool call 同时发送
- [ ] 大 payload 测试：10MB+ 数据传输

---

## 二、WebUI 自动化缺失特性

### 6. 视频录制
- [ ] Playwright `recordVideo` 选项集成
- [ ] 视频文件存储到 `test-results/videos/`
- [ ] 配置开关 `config.output.videos`
- [ ] 仅失败时保留视频 or 全部保留（可配置）

### 7. 网络拦截 / Mock API
- [ ] Playwright `page.route()` 集成
- [ ] AI 生成 API mock 规则
- [ ] 支持拦截指定 URL 模式返回 mock 数据
- [ ] 请求 payload 断言
- [ ] 离线模式测试（拦截所有外部请求）

### 8. 响应式测试
- [ ] 多 viewport 预设（mobile: 375×667, tablet: 768×1024, desktop: 1920×1080）
- [ ] 同一用例自动在多个 viewport 下执行
- [ ] 每个 viewport 独立截图
- [ ] 布局断点断言

### 9. Trace 文件
- [ ] Playwright trace 录制集成
- [ ] 存储到 `test-results/traces/`
- [ ] trace.zip 可用 `npx playwright show-trace` 查看

### 10. 智能等待策略
- [ ] 封装常见等待模式注入 AI 生成的脚本
- [ ] `waitForNetworkIdle` — 等待网络空闲
- [ ] `waitForSelector` — 等待元素出现
- [ ] `waitForLoadState` — 等待页面加载完成
- [ ] 超时重试 + 备选选择器机制

### 11. DOM 快照 + Diff
- [ ] 失败时捕获 DOM 快照（page.content()）
- [ ] actual vs expected 对比输出
- [ ] 存储到 artifacts

---

## 三、报告系统缺失

### 12. HTML 可视化报告
- [ ] 创建 `src/core/reporter/html-builder.ts`
- [ ] 交互式 HTML 报告（可折叠/展开用例详情）
- [ ] 嵌入失败截图（base64 内联或相对路径）
- [ ] 覆盖率可视化（柱状图/饼图）
- [ ] 输出到 `test-results/report.html`

### 13. 历史趋势对比
- [ ] 存储历史运行结果（JSON 格式按时间戳归档）
- [ ] 通过率趋势：本次 vs 上次 vs 近 N 次
- [ ] 覆盖率趋势
- [ ] 自愈成功率趋势
- [ ] Token 成本趋势
- [ ] 回归检测：上次通过本次失败的用例高亮

### 14. 性能指标报告
- [ ] 每个用例的执行时间图表
- [ ] P50/P90/P99 延迟分布
- [ ] 类别维度的时间分布
- [ ] 性能回归告警

### 15. MCP 详细日志报告
- [ ] 请求/响应 JSON-RPC 对完整展示
- [ ] 每次 tool call 的响应时间
- [ ] Schema 快照对比（与上次运行对比，检测 API 变更）
- [ ] 存储到 `test-results/mcp/schema-snapshots/`

---

## 四、核心流程缺失

### 16. 迭代覆盖循环（Step 7）
- [ ] 第一轮：生成 → 执行 → 收集覆盖率
- [ ] 分析未覆盖代码行/分支
- [ ] 第二轮：针对未覆盖部分生成补充用例
- [ ] 重复直到覆盖率达标或迭代上限
- [ ] 可配置最大迭代轮数和目标覆盖率

### 17. 失败重测机制
- [ ] 区分 AI 代码 bug vs 项目代码 bug
- [ ] 项目代码修复后自动重跑失败用例
- [ ] watch 模式：文件变更自动触发相关用例重测
- [ ] 支持 `ai-test rerun --failed` 命令

### 18. 测试用例再生成（Regenerate）
- [ ] 实现 run.ts 中的 TODO: regenerate cases
- [ ] 交互模式下对不满意的用例重新生成
- [ ] 保留上次生成的用例作为 negative example
- [ ] 可指定更具体的生成指令

---

## 五、AI 能力缺失

### 19. OpenAI Client
- [ ] 创建 `src/services/openai-client.ts`
- [ ] 支持 GPT-4o / GPT-4-turbo
- [ ] 流式和非流式模式
- [ ] Token 用量追踪
- [ ] 兼容 Azure OpenAI endpoint

### 20. 私有模型支持
- [ ] 支持 Ollama（本地模型）
- [ ] 支持 Azure OpenAI
- [ ] 支持 AWS Bedrock
- [ ] 支持自定义 OpenAI-compatible API endpoint
- [ ] 配置项：`ai.baseUrl`, `ai.apiVersion`

### 21. 源码脱敏
- [ ] 可配置脱敏规则（正则或关键词）
- [ ] 发送给 AI 前自动替换敏感内容（API key、密码、内部 URL）
- [ ] 脱敏日志（记录替换了哪些内容）
- [ ] `.ai-test-ignore` 文件排除不发送的文件

---

## 六、前端测试增强

### 22. 组件渲染环境
- [ ] 自动检测并注入 jsdom / happy-dom 配置
- [ ] React: 支持 `@testing-library/react` 的 render/screen
- [ ] Vue: 支持 `@vue/test-utils` 的 mount/shallowMount
- [ ] 快照测试（toMatchSnapshot）
- [ ] CSS-in-JS / Styled Components 支持

### 23. 状态管理测试
- [ ] Redux/Vuex/Pinia/Zustand store 测试模板
- [ ] Action → Reducer → State 验证
- [ ] 异步 action 测试（thunk/saga）

---

## 七、后端测试增强

### 24. 真实接口测试模板
- [ ] 修改 backendTemplate 允许 HTTP 测试（当前禁止了）
- [ ] 根据 endpoint 信息自动生成 request spec
- [ ] 数据库 mock（sqlite in-memory / test containers）
- [ ] 中间件测试（auth、rate-limit、cors）

### 25. 参数 Schema 自动推导
- [ ] 从 NestJS DTO / Zod Schema / Swagger 文件提取参数定义
- [ ] 自动生成有效 / 无效 / 边界值参数组合
- [ ] 注入 prompt 指导 AI 生成精确断言

---

## 八、MCP 测试增强

### 26. 自动参数推导
- [ ] 从 `tools/list` 返回的 inputSchema 自动生成测试参数
- [ ] 有效参数组合（happy path）
- [ ] 边界值参数（空字符串、0、极大值）
- [ ] 类型错误参数（string 传 number 等）
- [ ] 缺少必填参数
- [ ] 多余未知参数

### 27. Schema 快照回归
- [ ] 首次运行保存 tools/list 返回的 schema
- [ ] 后续运行对比 schema 变化
- [ ] 检测：新增工具、删除工具、参数变更
- [ ] 变更报告输出

### 28. 服务生命周期测试
- [ ] 服务启动 → initialize 握手验证
- [ ] 优雅关闭验证（shutdown）
- [ ] 异常断开后重连
- [ ] 多实例并发连接

---

## 九、工程化 / 企业级

### 29. CI/CD 深度集成
- [ ] GitLab CI 模板（`.gitlab-ci.yml`）
- [ ] Jenkins Pipeline 模板
- [ ] PR Comment 自动回复测试结果
- [ ] 覆盖率 Badge 生成
- [ ] 通过率 Gate（低于阈值阻断合并）

### 30. 审计日志
- [ ] 记录每次运行的输入输出
- [ ] 哪些源代码被发送给了 AI
- [ ] Token 消耗按团队/项目分摊
- [ ] 合规审计导出

### 31. 多语言支持
- [ ] Python 项目（pytest）
- [ ] Go 项目（go test）
- [ ] Java 项目（JUnit/Maven）
- [ ] Rust 项目（cargo test）
- [ ] 语言检测 + 对应模板 + 对应执行器

### 32. Web Dashboard
- [ ] 测试运行历史列表
- [ ] 覆盖率趋势图
- [ ] 成本分析仪表盘
- [ ] 团队协作视图
- [ ] 用例管理（标记跳过/优先级）

---

## 优先级建议

| 优先级 | 项目 | 编号 |
|--------|------|------|
| P0 | HTTP Executor（接口测试） | #1 |
| P0 | 重写 Integration Executor | #3 |
| P0 | 迭代覆盖循环 | #16 |
| P1 | Load Executor（压力测试） | #2 |
| P1 | 多浏览器支持 | #4 |
| P1 | 视频录制 + Trace | #6, #9 |
| P1 | OpenAI Client | #19 |
| P1 | 用例再生成 | #18 |
| P1 | HTML 可视化报告 | #12 |
| P2 | 网络拦截 / Mock API | #7 |
| P2 | 响应式测试 | #8 |
| P2 | SSE/HTTP MCP 传输 | #5 |
| P2 | MCP 参数自动推导 | #26 |
| P2 | 历史趋势对比 | #13 |
| P2 | 失败重测 + watch 模式 | #17 |
| P2 | 真实接口测试模板 | #24 |
| P3 | 私有模型支持 | #20 |
| P3 | 源码脱敏 | #21 |
| P3 | 组件渲染环境 | #22 |
| P3 | Schema 快照回归 | #27 |
| P3 | 参数 Schema 自动推导 | #25 |
| P3 | 审计日志 | #30 |
| P4 | 多语言支持 | #31 |
| P4 | Web Dashboard | #32 |
| P4 | GitLab/Jenkins CI 模板 | #29 |
