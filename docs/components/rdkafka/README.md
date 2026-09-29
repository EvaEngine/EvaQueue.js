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
- peer：`@confluentinc/kafka-javascript`；类型冲突由 `skipLibCheck` 缓冲。遇到 Kafka 类型缺口时，优先扩展此封装；局部 `any` 只能用于隔离第三方类型问题，不能散落到适配器或业务调用方。

## 相关
- `docs/components/kafka-adapter/`
