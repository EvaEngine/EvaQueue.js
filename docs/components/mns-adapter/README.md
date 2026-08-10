# mns-adapter

## 何时读
改阿里云 MNS 适配时。

## 职责
- `MnsMessageQueue` / `MnsMessageTopic`
- `MnsProducer` / `MnsConsumer` / Publisher / Subscriber
- `MnsMessage` / `MnsCommandMessage`；`MnsConfigInterface`

## 边界
不做：MNS 账号与队列运维

## 入口
- `src/mns_adapter.ts`
- peer：`ali-mns`（`createRequire` 加载，非 ESM）

## 雷区
仅此处允许 require 风格加载 ali-mns；保持 eslint-disable 局部化。

## 相关
- core 工厂 `factoryMns`
