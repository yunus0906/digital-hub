# 本地开发文档

## 环境准备

- Node.js：fnm 管理，项目锁定 `24.20.0`（`.node-version`），`fnm use` 自动切换。
- 包管理：**npm**（不要用 pnpm，见 ADR-007 关于 pnpm 11 严格布局导致 nuxt 无法解析 `@nuxt/cli` 的坑）。
- 数据库：远程 PostgreSQL，连接串在 `.env` 的 `DATABASE_URL`（不入库）。

## 目录约定

- `server/services/` 业务逻辑（查询、筛选、排序、价格折算），不直接写 SQL 拼接。
- `server/api/v1/` 只做参数解析 + 调 service + 统一返回。
- `server/utils/` 无状态工具函数（Prisma 单例、价格折算、分页）。
- `composables/` 前端可复用逻辑（分类映射、API 封装）。

## 新增一个目录类别的步骤

1. 在 `prisma/schema.prisma` 增加 `ProductCategory` 枚举值 + 业务子表。
2. 写 `server/services/<category>.service.ts`（list + getBySlug）。
3. 写 `server/api/v1/<category>/index.get.ts` 和 `[slug].get.ts`。
4. 写 `pages/<category>/index.vue` 和 `[slug].vue`。
5. seed 补示例数据，测试补价格折算/筛选用例。

## 代码规范

- TypeScript 严格模式，`pnpm typecheck` 必须通过。
- 排序字段必须走白名单（`SORT_WHITELIST`），禁止拼接用户输入到 SQL。
- 金额用 `Decimal` + `toNumber()`，禁止浮点直接参与计算。
- 枚举用 Prisma 生成的枚举类型，不要用魔法字符串。
- 所有时间 UTC 存储，前端 `toLocaleDateString` 显示。

## 常见问题

- `migrate dev` 报 P3014（无 shadow database 权限）→ 用 `migrate diff --from-empty` + `migrate deploy`。
- seed 枚举值报错 → 对照 `prisma/schema.prisma` 的 enum 定义核对值。
