# kafka-adapter

## 何时读
改 Kafka 队列/主题适配或 Kafka 消息类型时。

## 职责
- `KafkaMessageQueue` / `KafkaMessageTopic`
- `KafkaProducer` / `KafkaConsumer`；Topic 侧 `KafkaPublisher`/`KafkaSubscriber`（继承）
- `KafkaMessage` / `KafkaCommandMessage`
- 配置：`KafkaConfigInterface`

## 边界
不做：librdkafka 连接细节的底层 Promise 封装（在 `rdkafka`）

## 入口
- `src/kafka_adapter.ts`
- peer：`@confluentinc/kafka-javascript`（经 rdkafka）

## 依赖
→ `rdkafka`、`message`、`interfaces`

## 相关
- `docs/components/rdkafka/`
