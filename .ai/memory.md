# Project Memory

限高：全文建议 ≤150 行。超限先删 Assumed/过时/已升格进 docs 的条目。
只记：代码与 docs 都表达不好、且影响未来开发的信息。
不记：架构复述、API 说明、流水账、临时调试、git 能看到的变更列表。
置信：Confirmed（代码/测试/人确认）| Assumed（待验证，用完升格或删）。

更新：2026-08-10

## 当前焦点
- 进行中：agent.protocol standard bootstrap 完成；知识体系已就位
- 下一步：（空）

## 雷区与禁忌
- MessageTopic 的 `getPublisher`/`getSubscriber` 是**同步**且**不**调用 `ensureInstance`；须先 `await factory*` 或预注册实例，否则 assert「MQ Adapter not inited」。Queue 侧 `getProducer`/`getConsumer` 会 ensure。（Confirmed）
- `ensureInstance` 用**最后一个** `_` 拆 `name_configKey`（如 `kafka_default` → kafka + default）。configKey 自身勿含 `_`，否则 name 解析错。（Confirmed）
- `ali-mns` 非 ESM：仅允许 `createRequire(import.meta.url)('ali-mns')` + eslint-disable；不要改成顶层 static import。（Confirmed）
- Kafka 原生依赖：`@confluentinc/kafka-javascript` 需编译；pnpm/npm 的 onlyBuiltDependencies 已放行；mac 上 openssl 链接失败见 README。（Confirmed）
- 无运行时 `lodash` 依赖；case 转换用自研 `src/utils/case_converter.ts`，勿引入 lodash。（Confirmed）
- 主干分支名是 `main`；CI/release 跟 `main`。（Confirmed）
- 对外仓库以 `EvaEngine/EvaQueue.js` 为准（package/git remote）；勿写回 bmqb 除非用户改 remote。（Confirmed）
- npm 包名 `evamq`（2026-08-10 发布 v1.0.0）；CI 通过 semantic-release 自动发布。（Confirmed）

## 调试手册
- 测试只跑 package.json scripts 列出的文件；新增测试文件须同步改 `pnpm test` 脚本参数。
- Kafka 类型刺手：`skipLibCheck: true` + 局部 `any`；改 rdkafka 封装时优先扩封装而非散落断言。

## 待验证
- （无）

## 协作偏好（项目级）
- 文档中文、紧凑；与 agent.protocol 结构对齐
- 不自动 commit；发布靠 CI semantic-release
