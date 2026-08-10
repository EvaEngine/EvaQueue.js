# 命令

## 何时读
日常开发、CI 对齐本地时。

```bash
pnpm install       # 依赖
pnpm build         # tsc → lib/
pnpm clean         # 删 lib/
pnpm test          # node:test + tsx + coverage flag
pnpm lint          # eslint src/ test/
pnpm lint:fix
pnpm format        # prettier write
pnpm format:check
pnpm release       # semantic-release（通常仅 CI）
```

单测示例：
```bash
node --import tsx/esm --test test/message.ts
```

## 发布
推 `main` → CI build → `semantic-release`（需 secrets）。本地一般不手动 release。
