# rdkafka

## 何时读
改 Kafka 底层连接、produce/consume Promise 封装、Kfk 错误类型时。

## 职责
- `RDKafkaProducer` / `RDKafkaConsumer`（及 Basic 基类）
- 配置/消息接口：`rdkafka/interfaces.ts`
- 错误层次：`KfkError` 及子类（`errors.ts`）

## 边界
不做：EvaQueue 队列名/Message 模型（在 kafka-adapter）

## 入口
- `src/rdkafka/{producer,consumer,interfaces,errors}.ts`
- peer：`@confluentinc/kafka-javascript`；`skipLibCheck` 缓冲突

## 相关
- `docs/components/kafka-adapter/`
