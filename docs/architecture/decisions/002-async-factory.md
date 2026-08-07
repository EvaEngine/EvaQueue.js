# ADR 002: 异步工厂方法

## 状态
✅ 已实施 (2026-08-07)

## 背景
Pure ESM 要求动态 `import()` 返回 Promise，而原有的工厂方法是同步的。

## 决策
- `factoryMns()` / `factoryKafka()` 改为 `async`
- `getProducer()` / `getConsumer()` 改为 `async`
- 构造函数不再自动初始化默认实例
- 新增 `ensureInstance()` 辅助方法

## 理由
- 动态 `import()` 是 ESM 的必要条件
- 延迟加载避免加载未使用的后端

## 影响
- 用户代码需要 `await manager.getProducer()`
- 原有同步调用模式不再支持