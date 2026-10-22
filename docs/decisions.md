# 关键技术决策记录（ADR）

## ADR-001：Nuxt 3 同仓库 API（Nitro）而非独立 Fastify 后端

**决策**：采用 Nuxt 3 + Nitro 同仓库实现 SSR 与 API。

**备选**：Fastify + TypeScript 独立后端。

**理由**：
- MVP 阶段业务 API 规模小，同仓库降低部署复杂度（单进程、单制品）。
- SSR（SEO 需求）+ API 一体化，避免维护两套业务 API（方案明确禁止）。
- Nitro 支持后续拆分为独立服务（`nuxi build` 产物可单独部署 server）。

**代价**：前端与后端耦合在一个仓库，团队扩大后需约定分层边界。

## ADR-002：Prisma 而非 Drizzle

**决策**：Prisma 5。

**理由**：类型安全、迁移工具成熟、`migrate deploy` 幂等、生态成熟。方案二选一，Prisma 的迁移与 seed 工作流更契合「可重复执行到最新版本」的验收要求。

## ADR-003：金额用 NUMERIC，禁止浮点

**决策**：`Decimal(12,2)`。

**理由**：货币不可用浮点（浮点误差），方案第 6.6 节明确要求。

## ADR-004：统一产品主表 + 业务子表

**决策**：`products` 主表 + `airport_details` / `client_applications` / `vps_plans` 等子表，通过 `product_id` 关联。

**理由**：方案第 6 节要求。统一 `slug`、状态、来源、核验时间；业务专属字段独立，便于扩展 AI 模型等新目录。

## ADR-005：可解释的综合排序，非黑箱分数

**决策**：`recommended` 排序 = 在售(隐式) + 资料完整度 + 最近核验时间 + 价格有效，规则写死在 `recommendScore()`。

**理由**：方案第 7.2 节明确「优先使用可解释的规则排序」。广告/赞助不得改变自然排序。

## ADR-006：价格折算统一规则

**决策**：季付 /3、半年付 /6、年付 /12；一次性/按量/按小时不折算（返回 null）。

**理由**：方案第 7.1 节。折算月均价用 `monthlyEquivalent()` 归一化，排序用规范化数值而非字符串。

## ADR-007：依赖管理遇到的两个坑（记录）

1. **npm arborist bug**：`nuxt@^3.15.0` 范围漂移到 3.21 引发 `Cannot read properties of null (reading 'edgesOut')`。→ 锁定精确版本 `nuxt@3.15.4`。
2. **pnpm 11 严格布局 bug**：nuxt 3.15 的 `bin/nuxt.mjs` 无法解析 `@nuxt/cli`（pnpm 隔离布局导致）。→ 改用 npm。
3. **远程 PG 无 shadow database 权限**：`migrate dev` 报 P3014。→ 用 `migrate diff --from-empty` 生成 SQL + `migrate deploy` 应用。

## ADR-008：数据库部署形态

**决策**：本机无 PG，用户提供远程 PostgreSQL。生产环境用云托管 PG 或 Docker 自托管，定期备份。
