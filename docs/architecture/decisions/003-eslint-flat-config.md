# ADR 003: ESLint Flat Config

## 状态
✅ 已实施 (2026-08-07)

## 背景
项目原使用 TSLint（已废弃）和独立的 ESLint 配置文件。

## 决策
- 移除 TSLint (`tslint.json`, `tslint-config-airbnb`)
- 使用 ESLint 9.x Flat Config (`eslint.config.js`)
- 集成 `typescript-eslint` 进行类型感知检查
- 集成 `eslint-config-prettier` 避免与 Prettier 冲突

## 理由
- TSLint 已于 2019 年废弃
- Flat Config 是 ESLint 9.x 的标准配置方式
- 类型感知规则能捕获更多潜在问题

## 影响
- 所有 lint 规则集中在 `eslint.config.js`
- 类型感知规则仅应用于 `src/` 目录