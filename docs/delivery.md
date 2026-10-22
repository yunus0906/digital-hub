# DigitalHub 交付说明（M0+M1+M2）

## 一、交付范围与结论

按《数字服务价格导航平台_开发方案.md》完成 **M0 + M1 + M2** 里程碑，实现可运行、可验证的数据闭环。

**验收结论（全绿）**：
- ✅ `nuxt typecheck` 通过（0 错误）
- ✅ `eslint .` 通过（0 错误）
- ✅ `vitest run` 通过（14/14）
- ✅ `nuxt build` 成功（产物 21.7 MB，gzip 8.61 MB）
- ✅ 数据库迁移已应用、seed 示例数据已写入
- ✅ API 实测通过：健康检查、价格折算、筛选、排序、分页规范化、搜索、404、SSR 渲染

## 二、技术选型

| 层 | 选型 | 理由 |
| --- | --- | --- |
| 前端 | Nuxt 3.15.4 + Vue 3 + TypeScript | SSR 满足 SEO 需求，同仓库 API 降低复杂度 |
| 样式 | Tailwind CSS | 方案指定 |
| 后端 | Nuxt server routes / Nitro | 方案首选，避免重复维护两套 API |
| ORM | Prisma 5.22 | 类型安全 + 迁移幂等 |
| 数据库 | PostgreSQL 16 | 方案主选型（用户提供远程实例） |
| 测试 | Vitest | 轻量、与 Vite 生态一致 |
| 校验 | Zod | 预留 |

**关键取舍**：
- 未引入 Redis、消息队列、独立 Fastify 后端 —— MVP 不需要。
- 排序用可解释规则（非黑箱分数），符合方案第 7.2 节。

## 三、已实现功能

### 数据库（schema 574 行迁移）
统一产品主表 `products` + 业务子表：
- 机场：`airport_details` / `airport_plans` / `airport_network_tests`
- 客户端：`client_applications` / `client_platforms` / `client_core_compatibility` / `client_releases` / `proxy_cores`
- VPS：`vps_locations` / `vps_plans` / `vps_network_tests`
- 通用：`vendors` / `product_links` / `tags` / `data_sources` / `price_records` / `price_history_events` / `reviews` / `favorites` / `audit_logs`

金额用 `NUMERIC`，枚举用 Prisma enum，外键有明确删除策略，常用筛选字段建索引。

### API（/api/v1）
- `GET /home` 首页聚合
- `GET /search?q=` 全站搜索
- `GET /airports` / `GET /airports/:slug` 机场列表/详情（含套餐、价格历史、实测、来源）
- `GET /apps` / `GET /apps/:slug` 客户端列表/详情（含平台、内核兼容、版本历史）
- `GET /vps` / `GET /vps/:slug` VPS 套餐列表/详情
- `GET /health` 健康检查

统一响应格式 `{ data, meta }`，错误格式 `{ error: { code, message, details } }`，`sort` 白名单，分页参数规范化。

### 页面
| 路由 | 说明 |
| --- | --- |
| `/` | 首页（分类入口、最新收录、可信度说明） |
| `/airports` + `/:slug` | 机场列表/详情（流量/周期/价格/状态筛选，排序，分页） |
| `/apps` + `/:slug` | 客户端列表/详情（平台/类型/代码状态筛选） |
| `/vps` + `/:slug` | VPS 套餐列表/详情（地区/配置/价格筛选） |
| `/search` | 全站搜索 |
| `/about` / `/ai` | 关于 / AI 占位 |

筛选状态写入 URL query，刷新可恢复；加载/空/错误状态齐全；外链标注跳转。

### 价格折算（核心业务规则）
- 月付原价、季付 /3、半年付 /6、年付 /12
- 一次性/按量/按小时不折算（返回 null）
- 促销价与续费价分开展示
- 价格缺失显示「待核实」，不用 0 代替

## 四、未实现 / 已知限制

| 项 | 状态 |
| --- | --- |
| 管理后台 `/admin` CRUD + 管理员认证 | M3，未实现 |
| 价格历史图表 UI | M5/P1 |
| GitHub Stars/Fork 定时同步 | P1 |
| 用户提交/纠错、评分审核 | P1 |
| 收藏、产品对比 | P1 |
| 多币种汇率换算 | P2（当前按原始币种 + 折算月均价展示） |
| AI 模型目录、GPU 租赁等 | P2 |

## 五、关键技术决策记录

详见 `docs/decisions.md`（8 条 ADR），最重要的三条：

1. **ADR-007 依赖坑**：npm arborist bug（锁精确版本）、pnpm 11 布局 bug（改用 npm）、jiti Windows TS 解析 bug（config 改 .mjs）。
2. **ADR-005 可解释排序**：`recommended` = 在售 + 资料完整度 + 最近核验 + 价格有效。
3. **ADR-006 价格折算规则**：统一 `monthlyEquivalent()` 归一化，排序用规范化数值。

## 六、如何运行

```bash
fnm use 24.20.0
npm install
cp .env.example .env   # 填入 DATABASE_URL
npx prisma generate
npx prisma migrate deploy
npx prisma db seed
npm run dev            # http://localhost:3000
```

## 七、上线方案

详见 `docs/deployment.md`：Docker 部署、环境变量、数据库备份/恢复、安全清单、监控指标、灰度与回滚。
