# 测试

## 何时读
加测、改测、查覆盖率时。

## 栈（以 package.json 为准）
- 运行器：Node 内置 `node:test`
- 加载：`tsx/esm`
- 覆盖率：`--experimental-test-coverage`（非独立 c8/ava）

## 布局
```
test/
  message.ts queue.ts topic.ts nats.ts
  utils/case_converter.ts
  mocks/   # kafka / mns / nats mock 适配器
```

## 惯例
- 适配器逻辑多用 mock，避免强依赖真实集群
- **新增测试文件必须写入 `package.json` 的 `test` script 参数列表**，否则 CI 不会跑
- 不删测试装绿；失败先修实现或标已知问题

## 相关
- mocks：`test/mocks/*.ts`
