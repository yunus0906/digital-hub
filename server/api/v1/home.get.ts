// 首页聚合数据 API
import prisma from '../../utils/prisma'
import { ok } from '../../utils/api'

export default defineEventHandler(async () => {
  // 各分类已发布产品数量
  const [airportCount, appCount, vpsCount] = await Promise.all([
    prisma.product.count({ where: { category: 'airport', status: 'published', deletedAt: null } }),
    prisma.product.count({
      where: { category: { in: ['client_app', 'proxy_core'] }, status: 'published', deletedAt: null },
    }),
    prisma.product.count({ where: { category: 'vps_plan', status: 'published', deletedAt: null } }),
  ])

  // 最新收录（最近发布，真实数据排序，无数据则空）
  const recent = await prisma.product.findMany({
    where: { status: 'published', deletedAt: null },
    orderBy: { publishedAt: 'desc' },
    take: 8,
    include: { vendor: true },
  })

  // 最近更新
  const recentlyUpdated = await prisma.product.findMany({
    where: { status: 'published', deletedAt: null },
    orderBy: { updatedAt: 'desc' },
    take: 8,
    include: { vendor: true },
  })

  // 近期降价：仅在有真实价格历史时展示（MVP 无历史则空）
  const recentPriceDrops = await prisma.priceHistoryEvent.findMany({
    where: { eventType: 'price_changed' },
    orderBy: { observedAt: 'desc' },
    take: 8,
    include: { product: true },
  })

  return ok({
    counts: { airport: airportCount, app: appCount, vps: vpsCount },
    recent: recent.map(p => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      summary: p.summary,
      logoUrl: p.logoUrl,
      publishedAt: p.publishedAt,
    })),
    recentlyUpdated: recentlyUpdated.map(p => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      summary: p.summary,
      logoUrl: p.logoUrl,
      updatedAt: p.updatedAt,
    })),
    recentPriceDrops: recentPriceDrops.map(e => ({
      productSlug: e.product.slug,
      productName: e.product.name,
      eventType: e.eventType,
      oldValue: e.oldValue,
      newValue: e.newValue,
      observedAt: e.observedAt,
    })),
  })
})
