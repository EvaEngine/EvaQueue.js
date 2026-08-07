# Migration Guide

## 从 v1.x 迁移到 v2.x

### 重大变更

#### 1. Pure ESM
EvaQueue.js 现在是一个 Pure ESM 包。这意味着：

```javascript
// ❌ 旧方式 (CommonJS)
const MQ = require('evaqueue');
const Message = require('evaqueue/message');

// ✅ 新方式 (ESM)
import MQ from 'evaqueue';
import Message from 'evaqueue/message';
```

如果你的项目仍在使用 CommonJS，你需要：
- 在 `package.json` 中添加 `"type": "module"`
- 或将 `.js` 文件重命名为 `.mjs`
- 或使用动态 `import()`: `const MQ = await import('evaqueue')`

#### 2. 异步工厂方法
`getProducer()` 和 `getConsumer()` 现在是 `async` 方法：

```javascript
// ❌ 旧方式
const producer = manager.getProducer();

// ✅ 新方式
const producer = await manager.getProducer();
const consumer = await manager.getConsumer();
```

#### 3. 构造函数不再自动初始化
构造函数不再自动调用工厂方法。你需要显式调用 `getProducer()` 或 `getConsumer()`：

```javascript
// ❌ 旧方式 — 构造函数自动初始化默认实例
const manager = new MQ(config, console);
const producer = manager.getProducer(); // 同步，使用已初始化的实例

// ✅ 新方式 — 延迟加载
const manager = new MQ(config, console);
const producer = await manager.getProducer(); // 异步，首次调用时初始化
```

#### 4. Node.js 版本要求
- 最低要求从 `>=8.0.0` 提升到 `>=18.0.0`
- 推荐使用 Node.js 24 LTS

### 依赖变更

| 包 | 旧版本 | 新版本 | 说明 |
|----|--------|--------|------|
| TypeScript | ~3.1 | ~5.8 | 重大升级 |
| ava | 1.0.0-beta.8 | ^6.3 | 正式版 |
| semantic-release | ^15 | ^24 | 重大升级 |

### 新增工具

- `pnpm run format` — Prettier 格式化
- `pnpm run lint:fix` — ESLint 自动修复
- `pnpm run clean` — 清理构建输出

### 移除的工具

- `tslint` → 使用 `eslint`
- `nyc` → 使用 `c8`
- `ts-node` → 使用 `tsx`
- `pre-commit` → 使用 `husky` + `lint-staged`
- `travis-deploy-once` → 使用 GitHub Actions