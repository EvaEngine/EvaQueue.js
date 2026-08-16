# nats-adapter

## 何时读
改 NATS JetStream 适配时。

## 职责
- `NatsMessageQueue` / `NatsMessageTopic`
- Producer/Consumer/Publisher/Subscriber + Nats 消息类型
- 连接：`@nats-io/transport-node`；业务：`@nats-io/jetstream`（动态 import）
- 队列/主题语义映射到 Stream + Consumer
- Consumer 等待同步或异步业务回调成功完成后才 `ack()`；回调抛错或拒绝时记录错误并保留未确认状态，交由 JetStream 重投
- `processing` 覆盖完整业务回调与 ack 生命周期，优雅退出会等待处理中消息

## 边界
不做：NATS 集群运维、Stream 拓扑产品化

## 入口
- `src/nats_adapter.ts`

## 相关
- 测试：`test/nats.ts` + `test/mocks/nats.ts`
