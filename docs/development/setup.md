# Development Setup

## 前置要求

- **Node.js**: >= 18.0.0 (推荐使用 fnm 管理版本)
- **pnpm**: >= 10.x (推荐 `npm install -g pnpm`)

## 快速开始

```bash
# 克隆仓库
git clone git@github.com:bmqb/EvaQueue.js.git
cd EvaQueue.js

# 安装依赖
pnpm install

# 构建
pnpm build

# 运行测试
pnpm test

# 代码检查
pnpm lint
```

## 本地开发

### 使用 fnm 管理 Node.js 版本

```bash
# 安装 fnm (如未安装)
brew install fnm

# 安装并使用 Node.js 24
fnm install 24
fnm use 24

# 验证
node --version  # v24.x
```

### 常用命令

```bash
pnpm build            # TypeScript 编译 → lib/
pnpm test             # 运行测试 + 覆盖率
pnpm lint             # ESLint 检查
pnpm lint:fix         # ESLint 自动修复
pnpm format           # Prettier 格式化
pnpm format:check     # Prettier 检查
pnpm clean            # 清理 lib/
```

### 测试

测试使用 `ava` + `c8`：

```bash
# 运行所有测试
pnpm test

# 仅运行特定测试
pnpm ava test/message.ts
```

### 代码检查

```bash
# ESLint
pnpm lint

# Prettier
pnpm format:check
pnpm format
```

## 发布流程

发布由 GitHub Actions 自动处理：

1. 推送到 `master` 分支触发 CI
2. CI 通过后运行 `semantic-release`
3. 自动发布到 npm

手动发布：

```bash
# 确保构建通过
pnpm build && pnpm test && pnpm lint

# 使用 semantic-release 发布
pnpm release
```

## 项目配置

| 文件 | 用途 |
|------|------|
| `tsconfig.json` | TypeScript 编译配置 |
| `tsconfig.test.json` | 测试专用 TypeScript 配置 |
| `eslint.config.js` | ESLint flat config |
| `.prettierrc.json` | Prettier 配置 |
| `.lintstagedrc.json` | lint-staged 配置 |
| `.github/workflows/ci.yml` | GitHub Actions CI |
| `.npmrc` | npm/pnpm 配置 |