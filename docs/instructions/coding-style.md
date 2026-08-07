# Coding Style Guide

> 本文档定义 EvaQueue.js 项目的编码规范。AI 代理在生成代码时必须遵守。

## TypeScript 配置

- **模块系统**: `NodeNext` (Pure ESM)
- **目标**: `ES2022`
- **严格模式**: 启用 `strict: true`
- **声明文件**: 生成 `.d.ts` + `.d.ts.map`

## 导入规范

### ESM 扩展名
所有相对导入必须包含 `.js` 扩展名（TypeScript 在 NodeNext 模式下要求）：

```typescript
// ✅ 正确
import { MessageInterface } from './interfaces.js';
import { toCamelCase } from './utils/case_converter.js';

// ❌ 错误
import { MessageInterface } from './interfaces';
```

### 类型导入
仅类型导入使用 `import type`：

```typescript
// ✅ 正确
import type { Constructor, LoggerInterface } from './interfaces.js';

// ✅ 运行时 + 类型混合
import Message, { CommandMessage } from './message.js';
import type { CommandMessageInterface } from './interfaces.js';
```

### Node.js 内置模块
使用 `node:` 协议前缀：

```typescript
// ✅ 正确
import assert from 'node:assert';
import os from 'node:os';
import { createRequire } from 'node:module';

// ❌ 错误
import assert from 'assert';
import os from 'os';
```

### lodash
使用默认导入：

```typescript
// ✅ 正确
import _ from 'lodash';
_.camelCase('foo_bar');

// ❌ 错误
import camelCase from 'lodash/camelCase';
```

## 类型规范

### 避免包装类型
使用原始类型而非包装对象：

```typescript
// ✅ 正确
let connected: boolean = false;
let maxProcessing: number = 3;

// ❌ 错误
let connected: Boolean = false;
let maxProcessing: Number = 3;
```

### any 的使用
`any` 类型允许在以下场景使用：
- 与 `ali-mns` 交互时（该库无类型定义）
- 与 `@confluentinc/kafka-javascript` 交互时（类型不兼容）
- 泛型适配器接口 (`ProducerInterface<any>`)

### 未初始化属性
使用 `!` 断言标记构造函数后初始化的属性：

```typescript
export class KafkaMessage extends Message {
  offset!: number;
  partition!: number;
}
```

## 异步模式

### 工厂方法
由于 Pure ESM 要求动态 `import()`，工厂方法必须为 `async`：

```typescript
async factoryKafka(configKey = 'default') {
  const { default: kafkaAdapter } = await import('./kafka_adapter.js');
  // ...
}
```

### getProducer / getConsumer
这两个方法现在是 `async`：

```typescript
// ✅ 正确
const producer = await manager.getProducer();
const consumer = await manager.getConsumer();
```

### 回调签名
Consumer 回调接收 `Error | null`：

```typescript
type ConsumerCallback = (err: Error | null, msg: MessageInterface) => void;
```

## 命名约定

- **类**: PascalCase (`MessageQueue`, `KafkaProducer`)
- **接口**: PascalCase with `Interface` suffix (`MessageInterface`, `ProducerInterface`)
- **方法**: camelCase (`getProducer`, `enableGracefulExit`)
- **文件**: snake_case (`kafka_adapter.ts`, `case_converter.ts`)
- **类型参数**: 单个大写字母 (`C`, `T`)

## ESLint 规则

关键规则（详见 `eslint.config.js`）：
- `no-console`: warn（库代码中允许，但应优先使用注入的 `logger`）
- `@typescript-eslint/no-require-imports`: error（仅 `ali-mns` 例外）
- `@typescript-eslint/no-unused-vars`: error（`^_` 前缀参数除外）
- `@typescript-eslint/no-explicit-any`: off（项目允许）

## Prettier

- 单引号
- 尾逗号 (all)
- 行宽 100
- 箭头函数括号 (always)