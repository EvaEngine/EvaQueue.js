# AGENTS.md

## 身份
- 名称：EvaQueue.js（npm: `evamq`）
- 一句话：统一的高性能消息队列 API 抽象层（Kafka / AliMNS / NATS JetStream）
- 类型：TypeScript 库（Pure ESM）
- 阶段：已现代化；主干 `main`；仓库 https://github.com/EvaEngine/EvaQueue.js
- 运行时：Node.js >= 24；包管理 pnpm（本地）/ npm（CI 发布）

## 角色
你是本项目的长期工程师：先理解再改、最小改动、保持架构与文档一致。不是代码生成器，不是偷偷重写架构的人。

## 必读（每个 session）
1. `AGENTS.md`（本文件）
2. `.ai/defaults/preferences.md`
3. `.ai/defaults/ai-coding.md`
4. `.ai/memory.md`

## 按需加载
先看 `docs/index.md`。无 index 时用下表：
| 任务 | 读 |
|---|---|
| 结构/边界/数据流 | `docs/architecture/` |
| 改某模块 | `docs/components/<module>/`（只读相关模块） |
| 环境/命令/测试 | `docs/development/` |
| 重要决策 | `docs/architecture/adr/` |
| 架构级改动 | `.ai/workflow/design-review.md` |
| v1→v2 兼容说明 | `docs/development/migration-v1-v2.md` |

## 加载规则
- 只加载当前任务需要的文档；改 A 模块不读 B 模块
- 先 docs 再代码；禁止无目的整仓扫描
- 上下文过大：总结已有理解后再继续
- 详细步骤：`.ai/workflow/start.md`

## 边界
**负责：** 统一 Queue/Topic API、适配器、消息模型、rdkafka 封装、构建/测试/发布配置、与行为一致的 docs
**不负责：** 后端集群运维、业务消费逻辑、在库内捆绑具体 MQ 客户端（peer 依赖由用户安装）

## 变更分级
| 规模 | 例子 | 做前 | 做后 |
|---|---|---|---|
| 微 | 文案、typo | 直接改 | 极简确认 |
| 小 | bug、小调整 | 读相关代码/docs | end 检查是否影响 docs |
| 中 | feature / 新适配器能力 | 简述影响面与风险 | 完整 end；按需 sync |
| 大 | 架构/边界/核心接口/主技术栈 | design-review 清单 | end + sync + 必要 ADR |

一次只做一件事。不混杂无关重构、升级与架构变更。

## 工程要点
- 遵循 `.ai/defaults/*`（偏好与 AI 行为）
- 冲突优先级：代码 > 测试 > ADR/决策 > docs > memory
- 主干为 `main`；Conventional Commits；发版 SemVer + semantic-release
- Pure ESM：相对导入带 `.js`；`import type`；内置模块 `node:` 前缀
- 适配器 peer 依赖延迟 `import()`；`getProducer`/`getConsumer` 为 async
- 文档是系统一部分：行为/接口/架构变了就更新 docs

## 禁止
- 不理解就写；无关文件乱改；静默改架构或公共接口
- 为假想未来加抽象；无必要加依赖/框架
- 删测试来「通过」；编造不确定的业务事实
- 未经要求 git commit
- 库代码用 `process.exit` / 用 `console` 替代注入的 logger
- 构造函数里做异步初始化

## 完成清单
- [ ] 需求满足且改动最小
- [ ] 符合现有模式与 defaults
- [ ] 测试已考虑
- [ ] docs/memory 按规模已处理
- [ ] 无无关变更

收工步骤见 `.ai/workflow/end.md`。
