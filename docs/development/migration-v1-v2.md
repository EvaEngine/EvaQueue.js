# v1 → v2 迁移

## 何时读
帮助库的调用方从旧版升级时。

## 重大变更（以当前代码为准）
1. **Pure ESM**：`import`；无 CJS 主路径
2. **async 工厂**：`await manager.getProducer()` / `getConsumer()`
3. **构造函数不自动 init**：首次 get/factory 时加载
4. **Node >= 24**（`package.json` engines）
5. Kafka 客户端：`node-rdkafka` → `@confluentinc/kafka-javascript`
6. 可选 NATS JetStream 适配器

## 调用对照
```js
// 旧
const producer = manager.getProducer();
// 新
const producer = await manager.getProducer();
```

## 工具链变化（开发本库）
TSLint→ESLint flat；测试为 node:test+tsx；Travis→GitHub Actions；husky+lint-staged。

历史文档中的 ava/c8/Node18 描述已过时，勿再引用。
