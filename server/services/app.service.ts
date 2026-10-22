// 客户端服务：列表、筛选（平台/类型/内核/代码状态/价格/维护）、排序、详情
import type { Prisma } from '@prisma/generated-client'
import prisma from '../utils/prisma'
import { buildMeta, parsePagination } from '../utils/api'

export interface AppListQuery {
  page?: string
  pageSize?: string
  q?: string
  sort?: string
  order?: string
  platform?: string
  applicationType?: string
  codeStatus?: string
  priceStatus?: string
  maintenanceStatus?: string
}

const SORT_WHITELIST: Record<string, string> = {
  recommended: 'recommended',
  stars: 'stars',
  latest_release: 'latest_release',
  last_commit: 'last_commit',
  rating: 'rating',
}

export async function listApps(query: AppListQuery) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>)

  const where: Prisma.ProductWhereInput = {
    category: { in: ['client_app', 'proxy_core'] },
    status: 'published',
    deletedAt: null,
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  const appWhere: Prisma.ClientApplicationWhereInput = {}
  if (query.applicationType) {
    appWhere.applicationType = query.applicationType as any
  }
  if (query.codeStatus) {
    appWhere.codeStatus = query.codeStatus as any
  }
  if (query.priceStatus) {
    appWhere.priceStatus = query.priceStatus as any
  }
  if (query.maintenanceStatus) {
    appWhere.maintenanceStatus = query.maintenanceStatus as any
  }
  // 平台筛选：通过关联表
  if (query.platform) {
    appWhere.platforms = { some: { platform: { code: query.platform } } }
  }
  if (Object.keys(appWhere).length > 0) {
    where.clientApp = { is: appWhere }
  }

  const sortKey = SORT_WHITELIST[query.sort ?? ''] ?? 'recommended'
  const order = query.order === 'asc' ? 'asc' : 'desc'

  // 排序字段直接映射（白名单）
  let orderBy: Prisma.ProductOrderByWithRelationInput
  switch (sortKey) {
    case 'stars':
      orderBy = { clientApp: { starsCount: order } }
      break
    case 'latest_release':
      orderBy = { clientApp: { latestReleaseAt: order } }
      break
    case 'last_commit':
      orderBy = { clientApp: { lastCommitAt: order } }
      break
    case 'recently_updated':
      orderBy = { updatedAt: order }
      break
    case 'recommended':
    default:
      orderBy = { updatedAt: 'desc' }
      break
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        vendor: true,
        tags: { include: { tag: true } },
        clientApp: {
          include: {
            platforms: { include: { platform: true } },
            coreCompat: { include: { core: true } },
          },
        },
      },
    }),
    prisma.product.count({ where }),
  ])

  return {
    data: products.map(toAppCard),
    meta: buildMeta(total, page, pageSize),
  }
}

function toAppCard(p: any) {
  const app = p.clientApp
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    summary: p.summary,
    logoUrl: p.logoUrl,
    officialUrl: p.officialUrl,
    category: p.category,
    dataStatus: p.dataStatus,
    lastVerifiedAt: p.lastVerifiedAt,
    applicationType: app?.applicationType ?? null,
    codeStatus: app?.codeStatus ?? 'license_unconfirmed',
    licenseName: app?.licenseName ?? null,
    priceStatus: app?.priceStatus ?? 'unknown',
    maintenanceStatus: app?.maintenanceStatus ?? 'unknown',
    repositoryUrl: app?.repositoryUrl ?? null,
    latestReleaseAt: app?.latestReleaseAt ?? null,
    lastCommitAt: app?.lastCommitAt ?? null,
    starsCount: app?.starsCount ?? null,
    forksCount: app?.forksCount ?? null,
    metricsObservedAt: app?.metricsObservedAt ?? null,
    platforms: app?.platforms?.map((pl: any) => ({
      code: pl.platform.code,
      name: pl.platform.name,
      supportStatus: pl.supportStatus,
    })) ?? [],
    cores: app?.coreCompat?.map((c: any) => ({
      name: c.core.name,
      slug: c.core.slug,
      compatibilityStatus: c.compatibilityStatus,
      supportedVersionRange: c.supportedVersionRange,
    })) ?? [],
    tags: p.tags.map((t: any) => ({ name: t.tag.name, slug: t.tag.slug })),
    vendor: p.vendor ? { name: p.vendor.name, slug: p.vendor.slug } : null,
  }
}

export async function getAppBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: {
      slug,
      category: { in: ['client_app', 'proxy_core'] },
      status: 'published',
      deletedAt: null,
    },
    include: {
      vendor: true,
      tags: { include: { tag: true } },
      links: { where: { isActive: true } },
      clientApp: {
        include: {
          platforms: { include: { platform: true } },
          coreCompat: { include: { core: true } },
        },
      },
      releases: { orderBy: { releasedAt: 'desc' } },
      dataSources: { include: { dataSource: true } },
    },
  })

  if (!product) return null

  return {
    id: product.id,
    slug: product.slug,
    name: product.name,
    summary: product.summary,
    description: product.description,
    logoUrl: product.logoUrl,
    officialUrl: product.officialUrl,
    status: product.status,
    dataStatus: product.dataStatus,
    lastVerifiedAt: product.lastVerifiedAt,
    vendor: product.vendor
      ? { name: product.vendor.name, slug: product.vendor.slug }
      : null,
    tags: product.tags.map(t => ({ name: t.tag.name, slug: t.tag.slug })),
    links: product.links.map(l => ({
      type: l.linkType,
      url: l.url,
      label: l.label,
      isOfficial: l.isOfficial,
    })),
    clientApp: product.clientApp,
    releases: product.releases,
    dataSources: product.dataSources.map(ds => ({
      name: ds.dataSource.name,
      type: ds.dataSource.sourceType,
      sourceUrl: ds.sourceUrl,
      fieldKey: ds.fieldKey,
      verifiedAt: ds.verifiedAt,
    })),
  }
}
