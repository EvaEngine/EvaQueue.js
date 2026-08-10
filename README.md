# EvaQueue.js

[![NPM version](https://img.shields.io/npm/v/evamq.svg?style=flat-square)](http://badge.fury.io/js/evamq)
[![CI](https://github.com/EvaEngine/EvaQueue.js/actions/workflows/ci.yml/badge.svg)](https://github.com/EvaEngine/EvaQueue.js/actions/workflows/ci.yml)
[![npm](https://img.shields.io/npm/dm/evamq.svg?maxAge=2592000)](https://www.npmjs.com/package/evamq)
[![License](https://img.shields.io/npm/l/evamq.svg?maxAge=2592000?style=plastic)](https://github.com/EvaEngine/EvaQueue.js/blob/main/LICENSE)

EvaQueue.js 是一个统一的高性能消息队列 API 抽象层，基于适配器模式设计。通过一套一致的接口操作 [Kafka](https://kafka.apache.org/)、[阿里云 MNS](https://www.alibabacloud.com/product/message-service) 和 [NATS JetStream](https://nats.io/)，切换后端无需改动业务代码。

## 特性

- **统一 API** — Queue（队列）和 Topic（主题）两种模式，接口一致
- **按需安装** — MQ 客户端为 peer 依赖，只用你需要的后端
- **动态加载** — 适配器在首次使用时才 `import()`，无冗余初始化
- **TypeScript 优先** — 完整类型定义，IDE 友好
- **优雅退出** — 内置 `enableGracefulExit()`，安全关闭消费者连接
- **Pure ESM** — 原生 ES Module，适配 Node.js 现代生态

## 安装

```bash
npm install evamq
```

按需安装消息队列客户端（至少一个）：

```bash
# Kafka
npm install @confluentinc/kafka-javascript

# 阿里云 MNS
npm install ali-mns

# NATS JetStream
npm install @nats-io/transport-node @nats-io/jetstream
```

> **注意**：安装 `@confluentinc/kafka-javascript` 如遇 `ld: symbol(s) not found for architecture x86_64`，尝试：
> ```bash
> CPPFLAGS=-I/usr/local/opt/openssl/include LDFLAGS=-L/usr/local/opt/openssl/lib npm install
> ```

## 快速开始

### 队列模式（Queue）

生产消息：

```ts
import MQ from 'evamq';
import Message from 'evamq/message';

const manager = new MQ(config, console);
const producer = await manager.getProducer();

const msg = await producer.produce(new Message({ foo: 'bar' }));
console.log('[%s] produced %s', producer.name, msg.toDebugString());
```

消费消息：

```ts
import MQ from 'evamq';

const manager = new MQ(config, console);
const consumer = await manager.getConsumer();

await consumer.consuming(async (err, message) => {
  console.log('[%s] consuming %j', consumer.name, message);
}, 3);

consumer.enableGracefulExit();
```

### 主题模式（Topic）

```ts
import { MessageTopic } from 'evamq';
import Message from 'evamq/message';

const topic = new MessageTopic(config, console);
await topic.factoryKafka(); // 或 factoryMns() / factoryNats()

const publisher = topic.getPublisher();
await publisher.publish(new Message({ event: 'user.created' }));
```

### 切换后端

通过配置切换默认实例：

```js
// config 文件
{
  defaultInstance: 'kafka_default'
  // 改为
  // defaultInstance: 'mns_default'
}
```

或在运行时手动指定：

```ts
await manager.factoryMns('another');
const producer = await manager.getProducer('mns_another');
```

## 配置

```js
{
  defaultInstance: 'kafka_default',   // 默认实例键名
  kafka: {
    default: {
      connection: { /* Kafka 连接参数 */ },
      defaultQueueName: 'my-queue',
    },
  },
  mns: {
    default: {
      connection: {
        accountId: 'your_account_id',
        region: 'hangzhou',
        keyId: 'your_key_id',
        keySecret: 'your_key_secret',
      },
      defaultQueueName: 'my-queue',
    },
  },
  nats: {
    default: {
      connection: { /* NATS 连接参数 */ },
      defaultQueueName: 'my-queue',
    },
  },
}
```

实例键格式为 `{adapter}_{configKey}`，如 `kafka_default`、`mns_another`。

## 架构

```
App → MessageQueue / MessageTopic
        → Adapter (kafka_adapter | mns_adapter | nats_adapter)
            → peer client（动态加载）
Message / CommandMessage 贯穿 produce / consume
```

- **`MessageQueue`**（默认导出）— 队列模式，`getProducer` / `getConsumer` 为 async，自动初始化适配器
- **`MessageTopic`** — 主题模式，`getPublisher` / `getSubscriber` 为同步，需先调用 `factory*` 注册实例

## 示例

更多完整示例见 [examples/](./examples)：

| 示例 | 说明 |
|---|---|
| `manager_producer.ts` | 队列模式生产消息（默认实例） |
| `manager_consumer.ts` | 队列模式消费消息 |
| `manager_switch_connection.ts` | 运行时切换 MNS 实例 |
| `kafka_producer.ts` / `kafka_consumer.ts` | 直接使用 Kafka 适配器 |
| `mns_producer.ts` / `mns_consumer.ts` | 直接使用 MNS 适配器 |
| `nats_producer.ts` / `nats_consumer.ts` | NATS JetStream 模式 |
| `rdkafka_producer.ts` / `rdkafka_consumer.ts` | 底层 rdkafka 封装 |

## 开发

```bash
git clone git@github.com:EvaEngine/EvaQueue.js.git
cd EvaQueue.js
pnpm install
pnpm build
pnpm test
```

### 要求

- Node.js >= 24.0.0
- pnpm（推荐）或 npm

### 命令

| 命令 | 说明 |
|---|---|
| `pnpm build` | TypeScript 编译到 `lib/` |
| `pnpm test` | 运行测试（node:test + tsx + coverage） |
| `pnpm lint` | ESLint 检查 |
| `pnpm format` | Prettier 格式化 |

## 许可证

[MIT](./LICENSE)