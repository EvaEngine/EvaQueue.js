# ADR 004: GitHub Actions CI

## 状态
✅ 已实施 (2026-08-07)

## 背景
项目原使用 Travis CI，已过时且免费额度有限。

## 决策
- 移除 `.travis.yml`
- 使用 GitHub Actions (`./github/workflows/ci.yml`)
- 矩阵构建 Node.js 18/20/22/24
- 使用 `pnpm/action-setup` 缓存依赖
- 发布阶段使用 `semantic-release`

## 理由
- GitHub Actions 与 GitHub 仓库深度集成
- 免费额度充足
- 矩阵构建确保多版本兼容性

## 影响
- CI 配置迁移到 `.github/workflows/`
- 移除了 `travis-deploy-once` 依赖