# 开发环境

## 何时读
首次 clone 或换机器。

## 要求
- Node.js >= 24（推荐 fnm）
- pnpm >= 10（`packageManager`: pnpm@10.8.0）

## 步骤
```bash
git clone git@github.com:EvaEngine/EvaQueue.js.git
cd EvaQueue.js
pnpm install
pnpm build
pnpm test
pnpm lint
```

## 关键配置文件
| 文件 | 用途 |
|---|---|
| `tsconfig.json` | 编译 src → lib（NodeNext, strict） |
| `tsconfig.test.json` | 测试 TS 辅助 |
| `eslint.config.js` | ESLint 9 flat |
| `.prettierrc.json` | Prettier |
| `.lintstagedrc.json` + husky | pre-commit |
| `.npmrc` / `pnpm-workspace.yaml` | peers、native build 放行 |
| `.github/workflows/ci.yml` | CI + release |

## Kafka native
安装 `@confluentinc/kafka-javascript` 失败时见 README openssl 提示；`onlyBuiltDependencies` 已包含该包。

## 相关
- `commands.md`、`testing.md`
