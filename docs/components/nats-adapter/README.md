# nats-adapter

## 何时读
改 NATS JetStream 适配时。

## 职责
- `NatsMessageQueue` / `NatsMessageTopic`
- Producer/Consumer/Publisher/Subscriber + Nats 消息类型
- 连接：`@nats-io/transport-node`；业务：`@nats-io/jetstream`（动态 import）
- 队列/主题语义映射到 Stream + Consumer

## 边界
不做：NATS 集群运维、Stream 拓扑产品化

## 入口
- `src/nats_adapter.ts`

## 相关
- 测试：`test/nats.ts` + `test/mocks/nats.ts`
