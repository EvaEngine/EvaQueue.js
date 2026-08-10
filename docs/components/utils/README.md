# utils

## 何时读
改对象键名风格转换时。

## 职责
- `toCamelCase` / `toSnakeCase`（`case_converter.ts`）
- 无第三方 case 库

## 边界
不做：通用工具垃圾桶

## 入口
- `src/utils/case_converter.ts`
- 测试：`test/utils/case_converter.ts`
