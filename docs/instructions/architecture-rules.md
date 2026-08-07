# Architecture Rules

> 本文档定义 EvaQueue.js 的核心架构约束。任何代码变更不得违反以下规则。

## 架构模式

### 适配器模式 (Adapter Pattern)
EvaQueue.js 使用适配器模式抽象不同消息队列后端：

```
┌──────────────────────────────────────────────────┐
│                   User Code                       │
├──────────────────────────────────────────────────┤
│              MessageQueue / MessageTopic          │
├────────────────────┬─────────────────────────────┤
│  KafkaAdapter      │  MnsAdapter                 │
│  (node-rdkafka)    │  (ali-mns)                  │
├────────────────────┴─────────────────────────────┤
│  RDKafkaProducer / RDKafkaConsumer               │
│  (底层封装)                                       │
└──────────────────────────────────────────────────┘
```

### 核心规则

1. **统一接口**: 所有适配器必须实现 `MessageQueueAdapterInterface` 或 `MessageTopicAdapterInterface`
2. **延迟加载**: 适配器通过 `factoryKafka()` / `factoryMns()` 延迟加载，使用动态 `import()`
3. **实例缓存**: 适配器实例缓存在 `BaseMessageQueue.instances` Map 中，避免重复创建
4. **Peer 依赖**: `ali-mns` 和 `node-rdkafka` 是 peer 依赖，不由 EvaQueue 直接管理

## 模块边界

### src/index.ts — 公共入口
- 导出 `MessageQueue` (default) 和 `MessageTopic`
- `MessageQueue`: 队列模式 (Producer/Consumer)
- `MessageTopic`: 主题模式 (Publisher/Subscriber)
- 工厂方法使用动态 `import()` 实现延迟加载

### src/interfaces.ts — 接口定义
- 定义所有核心接口：`ProducerInterface`, `ConsumerInterface`, `PublisherInterface`, `SubscriberInterface`
- 定义 `MessageInterface`, `ConfigInterface`, `LoggerInterface`
- 适配器必须完整实现对应接口

### src/message.ts — 消息模型
- `Message`: 基础消息类
- `CommandMessage`: 命令消息（扩展 Message，增加 `command` 字段）
- 提供 `downCasting()` 方法用于适配器间消息转换

### src/kafka_adapter.ts — Kafka 适配器
- `KafkaMessageQueue`: 队列模式适配器
- `KafkaMessageTopic`: 主题模式适配器
- `KafkaProducer` / `KafkaConsumer`: 具体实现
- `KafkaMessage` / `KafkaCommandMessage`: Kafka 特定消息

### src/mns_adapter.ts — AliMNS 适配器
- `MnsMessageQueue`: 队列模式适配器
- `MnsMessageTopic`: 主题模式适配器
- `MnsProducer` / `MnsConsumer`: 具体实现
- `MnsMessage` / `MnsCommandMessage`: MNS 特定消息

### src/rdkafka/ — node-rdkafka 封装
- `RDKafkaProducer`: 底层 Kafka Producer 封装
- `RDKafkaConsumer`: 底层 Kafka Consumer 封装
- 提供 Promise 化的回调 API
- 自定义错误类型 (`KfkError` 层次结构)

## 约束

### 不允许
1. ❌ 在库代码中直接调用 `process.exit()`
2. ❌ 在库代码中使用 `console.log` 替代注入的 `logger`
3. ❌ 在构造函数中执行异步操作
4. ❌ 在运行时修改核心接口定义
5. ❌ 引入新的运行时依赖（除非绝对必要）

### 允许但需谨慎
1. ⚠️ 使用 `any` 类型（与外部库交互时）
2. ⚠️ 使用 `as any` 类型断言（处理类型不兼容时）
3. ⚠️ 使用 `require()`（仅用于 `ali-mns` 这种非 ESM 兼容的库）

## 错误处理

- 使用自定义错误类（继承 `Error`）
- Kafka 错误使用 `KfkError` 层次结构（见 `src/rdkafka/errors.ts`）
- 适配器层应捕获底层错误并转换为统一格式
- 优雅退出通过 `enableGracefulExit()` 实现

## 测试策略

- 使用 `ava` 测试框架
- 使用 `c8` 进行覆盖率收集
- 测试文件位于 `test/` 目录，与 `src/` 结构对应
- 测试使用 `tsx` 作为 TypeScript 加载器