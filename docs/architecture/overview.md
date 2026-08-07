# Architecture Overview

## 系统架构

EvaQueue.js 是一个统一消息队列 API 抽象层，采用适配器模式设计。

### 核心抽象层

```
┌─────────────────────────────────────────────────────────────┐
│                     Application Code                        │
├─────────────────────────────────────────────────────────────┤
│                    MessageQueue / MessageTopic               │
│                     (src/index.ts)                          │
├──────────────────────────┬──────────────────────────────────┤
│     Queue Mode           │        Topic Mode                │
│  ┌──────────────────┐   │  ┌──────────────────────────┐    │
│  │ ProducerInterface │   │  │ PublisherInterface       │    │
│  │ ConsumerInterface │   │  │ SubscriberInterface      │    │
│  └──────────────────┘   │  └──────────────────────────┘    │
├──────────────────────────┴──────────────────────────────────┤
│                    Adapter Layer                             │
│  ┌─────────────────────┐  ┌─────────────────────┐          │
│  │ KafkaMessageQueue   │  │ MnsMessageQueue     │          │
│  │ KafkaMessageTopic   │  │ MnsMessageTopic     │          │
│  └─────────────────────┘  └─────────────────────┘          │
├──────────────────────────┬──────────────────────────────────┤
│  node-rdkafka (peer)     │  ali-mns (peer)                  │
│  src/rdkafka/            │  (external)                      │
└──────────────────────────┴──────────────────────────────────┘
```

### 数据流

```
Producer → MessageQueue.getProducer() → Adapter.produce() → Backend
Consumer → MessageQueue.getConsumer() → Adapter.consuming() → Callback
```

## 关键设计决策

### 1. Pure ESM
- **决策**: 迁移到 Pure ESM (`"type": "module"`)
- **理由**: Node.js 生态已全面转向 ESM，2026 年 ESM 是唯一合理选择
- **影响**: 所有 `import` 需要 `.js` 扩展名，工厂方法变为 `async`

### 2. 异步工厂
- **决策**: `getProducer()` / `getConsumer()` 改为 `async`
- **理由**: Pure ESM 要求动态 `import()` 返回 Promise
- **影响**: 用户代码需要 `await manager.getProducer()`

### 3. Peer Dependencies
- **决策**: `ali-mns` 和 `node-rdkafka` 保持 peer 依赖
- **理由**: 用户只需安装自己需要的队列后端
- **影响**: 适配器在首次使用时通过动态 `import()` 加载

### 4. 延迟加载
- **决策**: 适配器在首次调用工厂方法时加载
- **理由**: 避免加载未使用的后端依赖
- **影响**: 构造函数不再自动初始化默认实例

## 类型系统

- 核心接口定义在 `src/interfaces.ts`
- 泛型参数 `C` 表示底层客户端类型
- 适配器实现使用 `any` 作为类型参数（因外部库类型不兼容）
- 自定义类型 `Signals` 和 `Timer` 定义在 `src/types.ts`

## 错误处理层次

```
Error
└── KfkError (code)
    ├── ConnectingError
    ├── DisconnectError
    ├── ConnectionNotReadyError
    ├── ConnectionDeadError
    ├── ProducerRuntimeError
    ├── ProducerFlushError
    ├── MetadataError
    ├── SeekError
    └── ConsumerRuntimeError
```