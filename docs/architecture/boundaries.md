# 边界

## 何时读
改接口、加适配器、划模块职责前。

## 库负责
- 统一 Queue/Topic API 与消息模型
- 各后端适配器与 rdkafka 封装
- 延迟加载、实例缓存、优雅退出钩子
- 类型声明与构建/测试/发布配置
- 与行为一致的 docs

## 库不负责
- MQ 集群安装/运维/容量
- 业务 handler 语义与重试策略产品化
- 把 peer 客户端打进包或替用户选后端
- 服务进程部署（无 operations 服务面）

## 模块边界
| 模块 | 做 | 不做 |
|---|---|---|
| core | 工厂、缓存、对外 API | 具体协议编解码 |
| message | 通用消息/命令消息 | 后端 raw 字段细节（由各 *Message 子类） |
| *-adapter | 实现 Adapter 接口、对接 peer | 改 core 接口形状（需 ADR） |
| rdkafka | Promise 化 kafka-javascript | 业务队列语义（在 kafka-adapter） |
| utils | case 转换 | 通用杂物堆 |

## 依赖方向
`index` → adapters → (rdkafka | peer)  
`message` / `interfaces` 被适配器依赖；适配器互不依赖。

## 硬约束（代码已体现）
- 无 `process.exit`；日志用注入 `LoggerInterface`
- 构造函数不做异步 init
- peer：`@confluentinc/kafka-javascript`, `ali-mns`, `@nats-io/transport-node`, `@nats-io/jetstream`
- 不新增运行时 dependencies（当前 runtime deps 为空），除非有明确理由 + 讨论

## 相关
- overview.md；各 `components/*/README.md`
