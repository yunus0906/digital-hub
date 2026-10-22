# DigitalHub · 数字服务价格导航平台

面向中文技术用户的数字基础设施与 AI 服务发现、价格比较、技术选型与社区数据平台。

首期覆盖三类目录：**机场订阅**、**订阅客户端**、**VPS / 云服务器**。数据标注来源与核验时间，客观排序与商业合作分离。

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | Nuxt 3 (Vue 3 + TypeScript) + Tailwind CSS |
| 后端 | Nuxt server routes / Nitro（同仓库 API） |
| 数据库 | PostgreSQL 16 |
| ORM | Prisma 5 |
| 测试 | Vitest |
| 校验 | Zod（预留） |

> 遵循《数字服务价格导航平台_开发方案.md》。模块化单体，MVP 不引入微服务。

## 环境要求

- Node.js ≥ 18（推荐 20/22，项目锁定 `24.20.0`，见 `.node-version`，配合 fnm 自动切换）
- PostgreSQL 16（本地可用 `docker compose up -d` 启动，或连接已有实例）

## 快速开始

```bash
# 1. 安装依赖（本机用 fnm 管理的 Node 24 + pnpm）
fnm use 24.20.0
pnpm install --config.dangerouslyAllowAllBuilds=true

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，填入 DATABASE_URL、SESSION_SECRET 等

# 3. 启动数据库（如无本地 PG）
docker compose up -d

# 4. 生成 Prisma Client 并执行迁移
pnpm db:generate
pnpm db:migrate          # 开发环境：创建迁移并应用
# 或生产环境：pnpm db:deploy

# 5. 写入示例数据（均为虚构，仅用于开发测试）
pnpm db:seed

# 6. 启动开发服务器
pnpm dev                 # http://localhost:3000
```

## 常用命令

```bash
pnpm dev            # 开发服务器
pnpm build          # 生产构建
pnpm preview        # 预览生产构建
pnpm lint           # ESLint 检查
pnpm typecheck      # TypeScript 类型检查
pnpm test           # 运行单元测试
pnpm db:studio      # Prisma Studio 可视化数据库
```

## 目录结构

```text
app.vue                 # 应用入口
layouts/default.vue     # 公共布局（导航 + 页脚）
pages/                  # 页面（index / airports / apps / vps / search / about / ai）
composables/            # 组合式函数（分类映射、API 封装）
assets/css/main.css     # 全局样式
server/
  api/v1/               # API 路由（airports / apps / vps / search / home / health）
  services/             # 业务服务层（查询、筛选、排序、价格折算）
  utils/                # 工具（Prisma 单例、价格折算、分页、API 响应）
prisma/
  schema.prisma         # 数据模型
  seed.ts               # 示例数据（虚构）
tests/unit/             # 单元测试
```

## 页面与路由

| 路由 | 说明 |
| --- | --- |
| `/` | 首页（分类入口、最新收录、可信度说明） |
| `/airports` | 机场列表（筛选/排序/分页） |
| `/airports/:slug` | 机场详情（套餐表、价格折算、实测、来源） |
| `/apps` | 客户端列表（平台/类型/代码状态筛选） |
| `/apps/:slug` | 客户端详情（平台、内核兼容、版本历史） |
| `/vps` | VPS 套餐列表（地区/配置/价格筛选） |
| `/vps/:slug` | VPS 详情（套餐规格、来源） |
| `/search?q=` | 全站搜索 |
| `/about` | 关于与数据说明 |
| `/ai` | AI 模型（占位，即将推出） |

## API

统一前缀 `/api/v1`，返回格式：

```json
{ "data": [], "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 } }
```

- `GET /api/v1/home` 首页聚合
- `GET /api/v1/search?q=` 全站搜索
- `GET /api/v1/airports` / `GET /api/v1/airports/:slug`
- `GET /api/v1/apps` / `GET /api/v1/apps/:slug`
- `GET /api/v1/vps` / `GET /api/v1/vps/:slug`
- `GET /api/v1/health` 健康检查

列表参数：`page`、`pageSize`（≤100）、`q`、`sort`（白名单）、`order`，及各类别特有筛选字段。

## 数据说明

- **所有 seed 数据均为虚构示例**，仅用于本地开发与测试，禁止作为真实商家数据上线。
- 金额使用 `NUMERIC` 存储，禁止浮点。
- 价格折算规则：季付 /3、半年付 /6、年付 /12；一次性/按量/按小时不折算。
- 综合排序为可解释规则（在售 > 资料完整度 > 最近核验 > 价格有效），非黑箱分数。

## 已知限制（当前 M0+M1+M2）

- 管理后台（`/admin`）CRUD、管理员认证尚未实现（属于 M3）。
- 价格历史 UI、GitHub 指标定时同步、用户提交/纠错、评分审核、收藏对比（属于 M5/P1）。
- AI 模型目录、GPU 租赁等（属于 P2）。
- 多币种汇率换算尚未启用（价格按原始币种 + 折算月均价展示）。

## 部署

参见 `docs/deployment.md`。核心：生产环境需设置 `NODE_ENV=production`、安全的 `SESSION_SECRET`、修改默认管理员密码，并执行 `pnpm db:deploy` 应用迁移。
