<!-- agent.protocol: https://github.com/AlloVince/agent.protocol @ 0f98a089a5f3b176171a9059cc9968cbb5c1dd0f (clean v0.3.0 worktree; release tag not verified). -->

# AGENTS.md

## 项目与入口

- 名称与目标：EvaQueue.js（npm 包 `evamq`）是 Pure ESM TypeScript 消息队列 API 抽象层，通过适配器支持 Kafka、AliMNS 与 NATS JetStream。
- 边界：本库负责统一 Queue/Topic API、消息模型、适配器、rdkafka 封装、构建/测试/发布配置和一致的文档；不负责 MQ 集群运维、业务消费语义、服务部署或把 peer 客户端捆绑进发布包。完整边界见 `docs/architecture/boundaries.md`。
- 按任务阅读：先读 `docs/index.md`，再读相关组件、架构或开发文档以及对应源码与测试；不要无目的扫描整个仓库。
- 正式命令：以 `package.json` 的 pnpm scripts 为准，常用 `pnpm build`、`pnpm test`、`pnpm lint`、`pnpm format:check` 和 `pnpm release` 的用途见 `docs/development/commands.md`。
- 已有基础设施：入口和工厂在 `src/index.ts`，适配器在 `src/*_adapter.ts`，Kafka 底层封装在 `src/rdkafka/`，消息模型在 `src/message.ts`，case 工具在 `src/utils/case_converter.ts`，测试在 `test/`。
- 所属系统：本库是 `/Users/allovince/Developer/yinxing.super` 声明的子项目；跨仓职责和共享能力入口见该仓的 `../yinxing.super/docs/architecture/repositories.md`、`../yinxing.super/docs/architecture/subprojects.md` 与 `docs/index.md`。除获授权的本库工作外，不修改总仓或 sibling 仓库。

## 权威与事实

当前人类指令优先，其次是相关 `owner/` 长期意图和适用的 `AGENTS.md`（更近目录规则更具体）。`owner/` 默认只读，只有当前人类明确指定具体文件时才可创建、改写或删除。

实际行为以代码、测试、schema、原生配置、lockfile 和运行结果验证。README、ADR 和维护文档必须与代码一致，但不能替代验证；冲突时区分文档过期、未完成实现或架构偏离，不把现有行为自动当成正确目标。

## 复用与正式操作入口

- 新增 CLI、logger、config、storage、queue、HTTP client、validation、部署能力前，先检查当前库、`src/` 现有实现、正式 pnpm scripts 和总仓已声明的共享能力。
- 优先扩展现有 API、适配器或封装。只有能力不足或复用会破坏明确的依赖、部署或数据边界时才新增，并说明缺口；不得为图快留下第二套永久实现。
- 开发、构建、测试、发布和维护使用人类也可执行的 package scripts 或项目标准入口。一次性调查可用临时代码；重复或正式流程必须收敛到这些入口。

## 人类可读与改动纪律

- 用清晰命名、直接控制流和显式数据/副作用，遵循既有模块模式；注释解释非显然的原因和约束。
- 保持 Pure ESM：相对导入带 `.js`，类型使用 `import type`，Node 内置模块使用 `node:` 前缀。peer 客户端延迟 `import()`；仅 `ali-mns` 沿用局部 `createRequire`，不改为顶层静态导入。
- `getProducer`/`getConsumer` 是异步 API；构造函数不做异步初始化。库代码不调用 `process.exit`，日志使用注入的 `LoggerInterface`，不以 `console` 替代。
- 避免过度抽象、复杂类型、元编程、隐式魔法、万能 utils 与层层 helper。只有真实重复且职责清晰、维护收益明确时才抽象；case 转换复用现有工具，不引入 lodash。
- 不混入无关重构、依赖大升级或格式化，不为假想需求增加服务或依赖，不静默改变公共接口、数据语义或系统边界。公共行为变更必须有相应测试和 README/维护文档更新。
- 架构、核心模型、技术栈或库边界等大改动前，简要说明问题、现有能力缺口、最简方案、影响和验收方式。只有高返工、存在真实替代方案且决策理由长期有用时才新增 ADR；持续指导实现但难从代码恢复的设计写普通 docs。

## 工程与发布约束

- 默认使用 fnm + pnpm；新项目或明确的运行时升级采用最新 Node LTS，无业务要求不维护历史 Node 兼容。Python 默认 pyenv + uv，按需使用 venv；新项目或明确升级采用最新稳定版。
- 本库沿用 `package.json`、lockfile 与 CI 的各自安装、构建和发布入口；已有项目约束优先。运行时、包管理器和构建事实仍以原生配置与 lockfile 为准，不重复记录版本事实；本次不切换工具链、主分支或 Git 历史。
- 主干为 `main`，采用 SemVer、Conventional Commits 与 semantic-release。一次聚焦一个功能，除非人类要求，不自动 commit、push 或 release。
- 对库的服务、部署或连接行为变更，检查适用的低成本生产基线：配置校验、生产模式、可重复构建、错误处理和超时、密钥管理、合理缓存及静态/文本压缩。库不部署 HTTP 服务；若消费方或 CDN/反代承担压缩，不重复注入策略。
- CLI、批处理和长任务复用已有日志设施，并提供阶段/进度、失败原因、最终摘要和退出状态，避免长时间静默。

## 文档准入

- README 面向使用者；`docs/` 保存维护者所需的架构、组件和开发知识，保持中文、紧凑，并与行为一致。
- 只在 `docs/` 保存代码、测试、schema、配置或 CLI help 无法准确表达、且能持续减少误判、重复探索或重建成本的稳定知识。按任务更新现有 `architecture/`、`components/` 或 `development/` 文档。
- 不新增 memory、workflow、迁移报告或进度文档，也不把当前焦点、下一步、一次性调试过程或 Git 已表达的变化写入 docs。过期文档应修正或删除。

## 长任务与交付

- 先明确最终用户成果和可观察的验收条件；每轮按当前代码、数据和实际产物复核，旧计划不是权威。已获授权且下一步明确、无真实阻塞时继续。
- 每个可验证阶段结束前检查本任务累积代码，按职责消除混杂、重复和废弃实现，同时保护用户改动并运行相关验证；不要机械拆文件或用抽象遮掩复杂度。当前功能的长任务可做必要重构，不混入无关重构。
- 中间数据、日志、二进制或多阶段结果按规模使用分块、流式读写或已有存储，避免无界整量载入/重写；保留格式强制的单体输入/交付，处理资源仍须有界，并保护不可重建输入。只在重建有价值时保留必要输入来源、生成命令和校验信息。
- 不删测试或忽略失败来制造绿灯；禁止累积超长函数、超大源文件与混杂职责。收尾核对实际 diff、范围、文档和 Git 状态，报告完成内容、验证证据、未验证项和真实阻塞；不以测试绿灯替代应有的消费方或运行时验证。
