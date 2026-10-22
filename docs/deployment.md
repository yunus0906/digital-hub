# DigitalHub 部署与上线方案

## 1. 部署架构

```
                     ┌─────────────────────────┐
  用户 ── HTTPS ──▶  │  反向代理 (Nginx/Caddy)  │
                     └───────────┬─────────────┘
                                 │
                     ┌───────────▼─────────────┐
                     │  Nuxt (Nitro) 应用节点   │  SSR + API 同进程
                     └───────────┬─────────────┘
                                 │
                     ┌───────────▼─────────────┐
                     │  PostgreSQL 16          │
                     └─────────────────────────┘
```

- 单体模块化架构，Nuxt Nitro 同时承担 SSR 与 API，无需独立后端进程。
- 首期单节点即可；流量增长后再横向扩展应用节点（无状态，共享 PostgreSQL）。

## 2. 生产环境变量

`.env`（生产，不入库）：

```dotenv
NODE_ENV=production
APP_URL=https://your-domain.com
DATABASE_URL=postgresql://app_user:<强密码>@<db-host>:5432/digital_hub
SESSION_SECRET=<至少 32 字节随机串>
ADMIN_EMAIL=admin@your-domain.com
ADMIN_INITIAL_PASSWORD=<首次初始化用，启动后立即修改>
GITHUB_TOKEN=          # P1 指标同步才需要
```

- `SESSION_SECRET` 用 `openssl rand -hex 32` 生成。
- 数据库密码、Token 走密钥管理（云厂商 Secrets Manager / 环境注入），不写明文进仓库。

## 3. 构建与运行

```bash
# 安装（fnm + pnpm，Node 24.20.0）
fnm use 24.20.0
pnpm install --config.dangerouslyAllowAllBuilds=true

# 生成 Prisma Client
pnpm db:generate

# 应用迁移（幂等，可重复执行到最新）
pnpm db:deploy

# 构建
pnpm build

# 启动（Node 直接跑 Nitro 产物）
node .output/server/index.mjs
```

用 PM2 / systemd / Docker 守护进程常驻。推荐 Docker 镜像方式（见下）。

## 4. Docker 部署

```dockerfile
# Dockerfile（示例）
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile
COPY . .
RUN pnpm db:generate && pnpm build

FROM node:22-alpine
WORKDIR /app
COPY --from=build /app/.output ./.output
ENV NODE_ENV=production
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
```

> 数据库不随应用容器打包，独立部署或使用云托管 PostgreSQL，定期备份。

## 5. 数据库迁移与备份恢复

```bash
# 迁移（幂等）
pnpm db:deploy

# 备份
pg_dump "$DATABASE_URL" -Fc > backup_$(date +%Y%m%d_%H%M%S).dump

# 恢复
pg_restore -d "$DATABASE_URL" --clean --if-exists backup_xxx.dump
```

- 上线前在 staging 验证迁移；生产迁移前先备份。
- 金额字段为 NUMERIC，禁止在迁移中改为浮点。

## 6. 安全清单

- [ ] 修改默认管理员密码（生产禁用 `change_me_before_first_use`）
- [ ] `SESSION_SECRET` 使用强随机值
- [ ] 数据库密码不提交、使用强密码
- [ ] 管理 API 走服务端鉴权（M3 实现后强制）
- [ ] 外部 URL 仅允许 HTTPS（特殊情况白名单）
- [ ] 富文本/Markdown 渲染前消毒（防 XSS）
- [ ] 登录/搜索接口限流
- [ ] 全站启用 HTTPS，Cookie 设 `Secure` + `HttpOnly` + `SameSite`

## 7. 上线后监控指标

- 健康检查：`GET /api/v1/health`（数据库连通性）
- 应用：QPS、P95/P99 延迟、5xx 比例、SSR 错误率
- 数据库：连接数、慢查询、磁盘用量
- 数据质量：待核验产品数、过期数据数（后台「数据质量」页，M3）
- 告警阈值建议：5xx > 1%、P95 > 800ms、数据库连接 > 80%

## 8. 灰度与回滚

- 灰度：新版本先部署到 staging 验证 → 生产单节点滚动发布 → 观察监控 → 全量。
- 回滚：应用无状态，回滚 = 部署上一版本镜像；数据库迁移若需回滚，用备份恢复（迁移尽量向前兼容，避免破坏性变更）。
- 破坏性操作（删除/改字段类型）需单独评审，优先软删除 + 新增字段。

## 9. 已知风险

1. **pnpm 11 严格布局**：本机用 pnpm 装 nuxt 3.15 会因 `@nuxt/cli` 解析失败，已改用 npm；CI/生产建议 `npm ci` 或锁定 pnpm 版本并验证。
2. **多币种**：当前价格按原始币种 + 折算月均价展示，未做汇率换算；启用需记录汇率来源与换算时间。
3. **数据采集合规**：P1 自动采集需遵守来源 robots/速率限制/服务条款，不抓登录后或受控数据。
