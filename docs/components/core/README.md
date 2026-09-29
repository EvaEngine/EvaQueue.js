# core

## 何时读
改入口 API、工厂、实例缓存、注册适配器时。

## 职责
- `MessageQueue`（default）、`MessageTopic`
- `BaseMessageQueue`：config/logger、`instances` Map、`registerAdapter`、`factoryAdapter`、`ensureInstance`
- 按名动态 `import` 三适配器：`factoryKafka` / `factoryMns` / `factoryNats`

## 边界
不做：具体 produce/consume 协议；消息字段语义细节。

## 入口
- 代码：`src/index.ts`, `src/interfaces.ts`, `src/types.ts`
- 导出：`evamq` → MessageQueue；`MessageTopic` 命名导出

## 关键行为
- Queue：`getProducer`/`getConsumer` 为 **async**，内部 `ensureInstance`
- Topic：`getPublisher`/`getSubscriber` 为 **同步**，**不** ensure；实例须已存在
- 实例键：`name_configKey`（最后一个 `_` 分割）；默认 `config.defaultInstance`。`configKey` 本身不得含 `_`，否则适配器名解析错误。
- 适配器类缓存在静态 `adapters` Map（同名不覆盖）

## 依赖
→ 动态依赖 adapters；类型来自 `interfaces.ts`

## 雷区
- `MessageTopic` 的 `getPublisher` / `getSubscriber` 不会 `ensureInstance`；先 `await factory*` 或预注册实例，否则会断言 `MQ Adapter not inited`。

## 相关
- 接口：`src/interfaces.ts`
- 架构：`docs/architecture/overview.md`
