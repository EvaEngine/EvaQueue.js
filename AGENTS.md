# AGENTS.md — EvaQueue.js AI Entry Point

> **⚠️ 任何 AI 代理（Copilot、Cursor、Windsurf 等）在操作此项目前，必须首先读取本文件。**

## 项目身份

- **项目名称**: EvaQueue.js
- **仓库**: https://github.com/bmqb/EvaQueue.js
- **描述**: 统一的高性能消息队列 API 抽象层，支持 Kafka、AliMNS 等后端
- **语言**: TypeScript (Pure ESM)
- **包管理器**: pnpm (本地开发) / npm (CI 发布)
- **Node.js**: >= 18.0.0 (推荐 24 LTS)
- **许可证**: MIT

## AI 工作流程

1. **首先读取本文件** (`AGENTS.md`) — 获取项目全景
2. **读取 `docs/instructions/`** — 编码规范与架构规则
3. **读取 `docs/architecture/`** — 架构决策记录
4. **读取 `docs/tasks/current.md`** — 当前任务上下文
5. **读取 `docs/development/setup.md`** — 开发环境配置
6. **开始工作**

## 文档索引

| 路径 | 用途 | 必须读取 |
|------|------|----------|
| `AGENTS.md` | AI 入口文档 | ✅ |
| `docs/instructions/coding-style.md` | 编码风格与约定 | ✅ |
| `docs/instructions/architecture-rules.md` | 架构约束与规则 | ✅ |
| `docs/architecture/overview.md` | 架构全景图 | ✅ |
| `docs/architecture/decisions/` | 架构决策记录 (ADRs) | 按需 |
| `docs/development/setup.md` | 开发环境搭建 | ✅ |
| `docs/migrations/` | 迁移记录 | 按需 |
| `docs/tasks/current.md` | 当前任务上下文 | ✅ |

## 关键命令速查

```bash
pnpm install          # 安装依赖
pnpm build            # TypeScript 编译
pnpm test             # 运行测试 (c8 + ava)
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm format           # Prettier 格式化
pnpm clean            # 清理 lib/
pnpm release          # semantic-release 发布
```

## 项目结构

```
├── AGENTS.md                     # ← 你在这里
├── src/
│   ├── index.ts                  # 入口: MessageQueue, MessageTopic
│   ├── interfaces.ts             # 核心接口定义
│   ├── message.ts                # Message / CommandMessage
│   ├── kafka_adapter.ts          # Kafka 适配器
│   ├── mns_adapter.ts            # AliMNS 适配器
│   ├── types.ts                  # 共享类型
│   ├── rdkafka/                  # node-rdkafka 封装
│   │   ├── producer.ts
│   │   ├── consumer.ts
│   │   ├── interfaces.ts
│   │   └── errors.ts
│   └── utils/
│       └── case_converter.ts     # 驼峰/蛇形互转
├── test/
│   ├── message.ts
│   └── utils/
│       └── case_converter.ts
├── examples/                     # 使用示例
├── lib/                          # 编译输出 (gitignored)
├── docs/
│   ├── instructions/
│   ├── architecture/
│   ├── development/
│   ├── migrations/
│   └── tasks/
└── package.json
```

## 重要约定

1. **Pure ESM**: 所有 `import` 必须包含 `.js` 扩展名
2. **异步工厂**: `getProducer()` / `getConsumer()` 现在是 `async` 方法
3. **类型安全**: 使用 `type` 前缀导入仅类型 (`import type`)
4. **Node.js 协议**: 内置模块使用 `node:` 前缀 (`import fs from 'node:fs'`)
5. **lodash**: 使用默认导入 `import _ from 'lodash'`
6. **ali-mns**: 通过 `require('ali-mns')` 加载，类型为 `any`
7. **node-rdkafka**: 通过 `as any` 类型断言处理类型不兼容