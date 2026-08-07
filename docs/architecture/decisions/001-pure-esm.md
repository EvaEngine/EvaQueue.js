# ADR 001: Pure ESM 迁移

## 状态
✅ 已实施 (2026-08-07)

## 背景
项目原使用 CommonJS + SystemJS 双阶段构建，TypeScript 3.1 时代的技术栈。

## 决策
迁移到 Pure ESM：
- `package.json` 设置 `"type": "module"`
- TypeScript 使用 `NodeNext` 模块解析
- 所有相对导入添加 `.js` 扩展名
- 移除 `index.js` / `message.js` shim 文件
- 使用 `package.json` `exports` 字段定义入口

## 理由
- Node.js 生态已全面转向 ESM
- 双阶段构建 (SystemJS + tsc) 过于复杂且无必要
- ESM 提供更好的静态分析和 tree-shaking

## 影响
- 用户必须使用 ESM (`import` 而非 `require`)
- 工厂方法需要 `async`（动态 `import()` 返回 Promise）
- 示例代码需要更新为 ESM 风格