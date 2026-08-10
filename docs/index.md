# docs 索引

任务 → 路径。先读本表再按需打开；勿整仓扫。

| 任务 | 路径 |
|---|---|
| 系统是什么 / 主数据流 | `architecture/overview.md` |
| 负责边界 / 模块边界 | `architecture/boundaries.md` |
| 历史决策（ESM/工厂/CI…） | `architecture/adr/` |
| 入口与工厂 | `components/core/` |
| 消息模型 | `components/message/` |
| Kafka 适配 | `components/kafka-adapter/` |
| AliMNS 适配 | `components/mns-adapter/` |
| NATS 适配 | `components/nats-adapter/` |
| Kafka 底层封装 | `components/rdkafka/` |
| case 工具 | `components/utils/` |
| 环境搭建 | `development/setup.md` |
| 常用命令 | `development/commands.md` |
| 测试方式 | `development/testing.md` |
| v1→v2 迁移 | `development/migration-v1-v2.md` |
| 编码/架构约束（已并入上表与 defaults） | 见 components + architecture；行为偏好见 `.ai/defaults/` |

无 `operations/`：本库不部署服务；发布见 development。
