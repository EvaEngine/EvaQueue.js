# ADR 004: GitHub Actions CI

## 状态
✅ 已实施 (2026-08-07)

## 背景
项目原使用 Travis CI，已过时且免费额度有限。

## 决策
- 移除 `.travis.yml`
- 使用 GitHub Actions (`.github/workflows/ci.yml`)
- Node 矩阵以 `package.json` engines 为准（当前 Node 24）
- `pnpm/action-setup` + 缓存；`main` 上 build 通过后 `semantic-release`

## 理由
- 与 GitHub 仓库集成；额度与维护成本合适

## 后果
- CI 在 `.github/workflows/`
- 主干分支名 `main`（原为 `master`，2026-08-10 重命名）
- 发布需 `GITHUB_TOKEN` / `NPM_TOKEN`
