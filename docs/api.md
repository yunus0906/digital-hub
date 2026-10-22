# API 说明

统一前缀 `/api/v1`。

## 响应格式

成功（列表）：
```json
{
  "data": [],
  "meta": { "page": 1, "pageSize": 20, "total": 0, "totalPages": 0 }
}
```

成功（单条）：
```json
{ "data": { "slug": "...", "name": "..." } }
```

错误：
```json
{ "error": { "code": "NOT_FOUND", "message": "未找到", "details": {} } }
```

## 公共 API

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/v1/home` | 首页聚合（分类计数、最新收录、最近更新、近期降价） |
| GET | `/api/v1/search?q=` | 全站搜索 |
| GET | `/api/v1/airports` | 机场列表 |
| GET | `/api/v1/airports/:slug` | 机场详情（含套餐、价格历史、实测、来源） |
| GET | `/api/v1/apps` | 客户端列表 |
| GET | `/api/v1/apps/:slug` | 客户端详情（含平台、内核兼容、版本历史） |
| GET | `/api/v1/vps` | VPS 套餐列表 |
| GET | `/api/v1/vps/:slug` | VPS 详情（含套餐规格、来源） |
| GET | `/api/v1/health` | 健康检查 |

## 列表参数

通用：`page`（≥1）、`pageSize`（≤100）、`q`、`sort`（白名单）、`order`（asc/desc）。

### 机场 `/api/v1/airports`
- `trafficType`: fixed / unlimited / usage_based
- `billingPeriod`: month / quarter / half_year / year
- `minPrice` / `maxPrice`: 折算月均价区间
- `minTraffic` / `maxTraffic`: 月流量区间（GB）
- `deviceLimit`: 设备数上限
- `serviceStatus`: active / maintenance / suspended / discontinued
- `sort`: recommended / monthly_price / recently_updated

### 客户端 `/api/v1/apps`
- `platform`: windows / macos / linux / android / ios / router
- `applicationType`: client / core / rules_tool / helper
- `codeStatus`: open_source / closed_source / partial_source / license_unconfirmed 等
- `priceStatus`: free / paid / freemium / unknown
- `maintenanceStatus`: active / low_activity / discontinued / unknown
- `sort`: recommended / stars / latest_release / last_commit

### VPS `/api/v1/vps`
- `countryCode`: US / HK / SG 等
- `productType`: vps / cloud_vm / dedicated_server / gpu_server
- `minMemory` / `maxMemory`: 内存区间（MB）
- `minVcpu`: 最小 vCPU
- `minPrice` / `maxPrice`: 折算月均价区间
- `sort`: recommended / monthly_price / memory / bandwidth

## 安全约束

- `sort` 使用白名单，禁止拼接用户输入到 SQL。
- 所有列表分页，`pageSize` 上限 100。
- 公共 API 只返回 `status = published` 且未软删除的数据。
- 错误统一 400/401/403/404/409/422/429/500，不返回内部堆栈与连接信息。

## 管理 API（M3，未实现）

预留 `/api/v1/admin/*` 前缀，需管理员鉴权。当前版本未实现，调用返回 404。
