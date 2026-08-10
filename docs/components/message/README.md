# message

## 何时读
改消息模型、命令消息、downCasting 时。

## 职责
- `Message`：通用字段（id/hash/content/priority/delay/trace/parent/ack/queueName/enqueueAt）
- `CommandMessage`：content 为 `{name, spec?}`，生成 `command` 字符串
- `downCasting(Class)`：用当前字段构造适配器侧子类

## 边界
不做：各后端 raw 序列化（在 `*Message` 子类 / adapter）

## 入口
- 代码：`src/message.ts`
- 包导出：`evaqueue/message`

## 依赖
→ `interfaces.ts` 类型

## 相关
- 各 adapter 的 `KafkaMessage` / `MnsMessage` / `NatsMessage`
