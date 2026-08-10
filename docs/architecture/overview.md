# 架构概览

## 何时读
理解系统形态、主路径、关键结构时。

## 内容
EvaQueue.js：统一消息队列 API 抽象层（适配器模式）。用户只依赖本库 API；Kafka / AliMNS / NATS 客户端为 **peer**，按需安装，首次使用时动态加载。

### 结构
```
App → MessageQueue | MessageTopic (src/index.ts)
        → Adapter (kafka_ | mns_ | nats_adapter)
            → peer client / rdkafka 封装
Message / CommandMessage (src/message.ts) 贯穿 produce/consume
```

### 两种模式
| 类 | 模式 | 获取端点 |
|---|---|---|
| `MessageQueue` (default export) | 队列 | async `getProducer` / `getConsumer` |
| `MessageTopic` | 主题 | 同步 `getPublisher` / `getSubscriber`（须已 factory/注册实例） |

### 主数据流
1. `new MessageQueue(config, logger)` — 不初始化后端
2. `await getProducer(instanceKey?)` → `ensureInstance` → `factoryKafka|Mns|Nats`（动态 import）→ 缓存于 `instances`
3. `produce(Message)` / `consuming(cb, maxProcessing)` → 适配器 → 后端
4. 消费侧可 `enableGracefulExit()` 挂信号

实例键：`{adapter}_{configKey}`，如 `kafka_default`；`config.defaultInstance` 为默认键。

### 配置形状（概念）
```js
{
  defaultInstance: 'kafka_default',
  kafka: { default: { connection, defaultQueueName, ... } },
  mns: { default: { ... } },
  nats: { default: { ... } },
}
```

### 发布物
- 入口：`evamq`、`evamq/message`（`package.json` exports → `lib/`）
- 构建：`tsc` → `lib/`；无捆绑 peer

### 关键决策摘要
见 `adr/`：Pure ESM、异步工厂、ESLint flat、GitHub Actions CI。

## 相关
- 代码：`src/index.ts`, `src/interfaces.ts`
- 边界：`boundaries.md`
