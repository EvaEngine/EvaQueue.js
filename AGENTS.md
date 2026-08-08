# AGENTS.md — EvaQueue.js AI Entry Point

> **⚠️ 任何 AI 代理（Copilot、Cursor、Windsurf 等）在操作此项目前，必须首先读取本文件。**

## 项目身份

- **项目名称**: EvaQueue.js
- **仓库**: https://github.com/bmqb/EvaQueue.js
- **描述**: 统一的高性能消息队列 API 抽象层，支持 Kafka、AliMNS、NATS JetStream 等后端
- **语言**: TypeScript (Pure ESM)
- **包管理器**: pnpm (本地开发) / npm (CI 发布)
- **Node.js**: >= 24.0.0
- **许可证**: MIT

## 启动策略 — 最小上下文加载

每次新 Session 启动时，**只加载本文件**。以下文档按需延迟加载，不预先读取：

| 触发场景 | 延迟加载的文档 |
|----------|---------------|
| 需要修改/创建代码文件 | `docs/instructions/coding-style.md` |
| 涉及架构变更或适配器修改 | `docs/instructions/architecture-rules.md` + `docs/architecture/overview.md` |
| 需要理解系统全景 | `docs/architecture/overview.md` |
| 开始执行一个具体任务 | `docs/tasks/current.md` |
| 搭建开发环境 | `docs/development/setup.md` |
| 涉及架构决策历史 | `docs/architecture/decisions/` (按需) |
| 涉及迁移记录 | `docs/migrations/` (按需) |

## 关键约定（必须遵守）

1. **Pure ESM**: 所有 `import` 必须包含 `.js` 扩展名
2. **异步工厂**: `getProducer()` / `getConsumer()` 现在是 `async` 方法
3. **类型安全**: 使用 `import type` 导入仅类型
4. **Node.js 协议**: 内置模块使用 `node:` 前缀 (`import fs from 'node:fs'`)
5. **lodash**: 使用默认导入 `import _ from 'lodash'`
6. **ali-mns**: 通过 `require('ali-mns')` 加载，类型为 `any`
7. **@confluentinc/kafka-javascript**: 内部封装，通过 `skipLibCheck` 处理类型

## 关键命令速查

```bash
pnpm install          # 安装依赖
pnpm build            # TypeScript 编译
pnpm test             # 运行测试 (node:test + tsx)
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm format           # Prettier 格式化
pnpm clean            # 清理 lib/
pnpm release          # semantic-release 发布
```

## 项目结构速览

```
src/          # 源代码
  index.ts          — MessageQueue / MessageTopic 入口
  interfaces.ts     — 核心接口定义
  message.ts        — Message / CommandMessage
  kafka_adapter.ts  — Kafka 适配器
  mns_adapter.ts    — AliMNS 适配器
  nats_adapter.ts   — NATS JetStream 适配器
  rdkafka/          — @confluentinc/kafka-javascript 封装
  utils/            — 工具函数
test/         # 测试 (node:test + tsx)
  queue.ts, topic.ts, message.ts, nats.ts
  mocks/            — 各适配器的 Mock 实现
docs/         # 文档（按需加载）
  instructions/     — 编码规范 & 架构规则
  architecture/     — 架构全景 & ADRs
  development/      — 开发环境搭建
  tasks/            — 当前任务
  migrations/       — 迁移记录
```