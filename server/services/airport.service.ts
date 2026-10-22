// 机场服务：列表查询、筛选、排序、详情
// 遵循方案第 6.2、7 节业务规则
import type { Prisma } from '@prisma/generated-client'
import prisma from '../utils/prisma'
import { buildMeta, parsePagination } from '../utils/api'
import { normalizePrice, toNumber } from '../utils/price'
import { mapDataSource, mapLink, mapTag } from '../utils/product-dto'

export interface AirportListQuery {
  page?: string
  pageSize?: string
  q?: string
  sort?: string
  order?: string
  trafficType?: string
  billingPeriod?: string
  minPrice?: string
  maxPrice?: string
  minTraffic?: string
  maxTraffic?: string
  deviceLimit?: string
  serviceStatus?: string
}

// 白名单排序：禁止将用户输入直接拼入 SQL
const SORT_WHITELIST: Record<string, string> = {
  // 综合推荐（资料完整度 + 在售 + 最近核验，规则可解释）
  recommended: 'recommended',
  monthly_price: 'monthly_price',
  rating: 'rating',
  recently_updated: 'recently_updated',
}

export async function listAirports(query: AirportListQuery) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>)

  const where: Prisma.ProductWhereInput = {
    category: 'airport',
    status: 'published',
    deletedAt: null,
  }

  // 关键词搜索
  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
      { description: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  // 业务子表筛选
  const detailWhere: Prisma.AirportDetailWhereInput = {}
  if (query.trafficType) {
    detailWhere.trafficType = query.trafficType as Prisma.EnumTrafficTypeFilter['equals']
  }
  if (query.serviceStatus) {
    detailWhere.serviceStatus = query.serviceStatus as Prisma.EnumServiceStatusFilter['equals']
  }
  if (query.deviceLimit) {
    detailWhere.deviceLimit = { lte: Number(query.deviceLimit) }
  }
  if (query.minTraffic || query.maxTraffic) {
    detailWhere.monthlyTrafficGb = {
      ...(query.minTraffic ? { gte: Number(query.minTraffic) } : {}),
      ...(query.maxTraffic ? { lte: Number(query.maxTraffic) } : {}),
    }
  }
  if (Object.keys(detailWhere).length > 0) {
    where.airportDetail = { is: detailWhere }
  }
  if (query.billingPeriod) {
    where.airportPlans = {
      some: {
        status: 'published',
        billingPeriod: query.billingPeriod as Prisma.EnumBillingPeriodFilter['equals'],
      },
    }
  }

  // 价格区间筛选（基于折算月均价，需在应用层过滤）
  const minPrice = query.minPrice ? Number(query.minPrice) : null
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : null

  const sortKey = SORT_WHITELIST[query.sort ?? ''] ?? 'recommended'
  const order = query.order === 'asc' ? 'asc' : 'desc'

  // 先取出符合条件的全部已发布机场（含子表与价格），用于价格过滤与排序
  // MVP 数据量级下可行；数据量增长后可改为 SQL 聚合，此处优先正确性
  const products = await prisma.product.findMany({
    where,
    include: {
      vendor: true,
      tags: { include: { tag: true } },
      airportDetail: true,
      airportPlans: {
        where: { status: 'published' },
        orderBy: { createdAt: 'asc' },
      },
      priceRecords: {
        where: { validTo: null },
        orderBy: { validFrom: 'desc' },
      },
    },
  })

  // 计算每条产品的最低折算月均价
  const enriched = products.map((p) => {
    const prices = p.priceRecords.map(r => normalizePrice(r))
    const monthly = prices
      .map(x => x.monthlyEquivalent)
      .filter((x): x is number => x !== null)

    const minMonthly = monthly.length > 0 ? Math.min(...monthly) : null
    // 评分：MVP 无真实评分数据时返回 null，前端显示「暂无评价」
    const rating = null

    return {
      ...p,
      minMonthlyPrice: minMonthly,
      rating,
      reviewCount: 0,
      priceCount: prices.length,
    }
  })

  // 应用价格区间过滤
  let filtered = enriched
  if (minPrice !== null || maxPrice !== null) {
    filtered = filtered.filter((p) => {
      const m = p.minMonthlyPrice
      if (m === null) return false // 价格未知不参与价格区间匹配
      if (minPrice !== null && m < minPrice) return false
      if (maxPrice !== null && m > maxPrice) return false
      return true
    })
  }

  // 排序
  filtered.sort((a, b) => {
    switch (sortKey) {
      case 'monthly_price': {
        // 无价格排最后
        if (a.minMonthlyPrice === null && b.minMonthlyPrice === null) return 0
        if (a.minMonthlyPrice === null) return 1
        if (b.minMonthlyPrice === null) return -1
        return order === 'asc'
          ? a.minMonthlyPrice - b.minMonthlyPrice
          : b.minMonthlyPrice - a.minMonthlyPrice
      }
      case 'recently_updated': {
        const da = new Date(a.updatedAt).getTime()
        const db = new Date(b.updatedAt).getTime()
        return order === 'asc' ? da - db : db - da
      }
      case 'recommended':
      default: {
        // 可解释的综合排序：在售 > 资料完整度 > 最近核验时间 > 价格有效
        const scoreA = recommendScore(a)
        const scoreB = recommendScore(b)
        return scoreB - scoreA
      }
    }
  })

  // 分页
  const total = filtered.length
  const paged = filtered.slice(skip, skip + take)

  return {
    data: paged.map(toAirportCard),
    meta: buildMeta(total, page, pageSize),
  }
}

// 综合推荐评分（规则显式、可解释）
function recommendScore(p: { minMonthlyPrice: number | null, lastVerifiedAt: Date | null, summary: string | null, description: string | null }) {
  let score = 0
  if (p.minMonthlyPrice !== null) score += 2 // 价格有效
  if (p.summary) score += 1 // 有简介
  if (p.description) score += 1 // 有详细说明
  if (p.lastVerifiedAt) {
    const ageDays = (Date.now() - new Date(p.lastVerifiedAt).getTime()) / 86400000
    if (ageDays < 30) score += 2 // 30 天内核验
    else if (ageDays < 90) score += 1 // 90 天内核验
  }
  return score
}

function toAirportCard(p: any) {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    summary: p.summary,
    logoUrl: p.logoUrl,
    officialUrl: p.officialUrl,
    status: p.status,
    dataStatus: p.dataStatus,
    lastVerifiedAt: p.lastVerifiedAt,
    minMonthlyPrice: p.minMonthlyPrice,
    rating: p.rating,
    reviewCount: p.reviewCount,
    trafficType: p.airportDetail?.trafficType ?? 'unknown',
    monthlyTrafficGb: p.airportDetail?.monthlyTrafficGb ?? null,
    deviceLimit: p.airportDetail?.deviceLimit ?? null,
    serviceStatus: p.airportDetail?.serviceStatus ?? 'unknown',
    groupMemberCount: p.airportDetail?.groupMemberCount ?? null,
    groupMemberCountObservedAt: p.airportDetail?.groupMemberCountObservedAt ?? null,
    billingPeriods: p.airportPlans.map((pl: any) => pl.billingPeriod),
    tags: p.tags.map(mapTag),
    vendor: p.vendor ? { name: p.vendor.name, slug: p.vendor.slug } : null,
  }
}

export async function getAirportBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, category: 'airport', status: 'published', deletedAt: null },
    include: {
      vendor: true,
      tags: { include: { tag: true } },
      links: { where: { isActive: true } },
      airportDetail: true,
      airportPlans: {
        where: { status: 'published' },
        orderBy: { createdAt: 'asc' },
      },
      priceRecords: { orderBy: { validFrom: 'desc' } },
      networkTests: { orderBy: { testedAt: 'desc' } },
      dataSources: { include: { dataSource: true } },
    },
  })

  if (!product) return null

  // 组装套餐表：套餐 + 对应价格 + 折算月均价
  const plans = product.airportPlans.map((plan) => {
    // 价格通过 priceRecords.planId 关联套餐（或 priceRecordId 双向关联）
    const priceRecord = product.priceRecords.find(
      r => r.id === plan.priceRecordId || r.planId === plan.id,
    )
    const normalized = priceRecord ? normalizePrice(priceRecord) : null
    return {
      id: plan.id,
      name: plan.name,
      billingPeriod: plan.billingPeriod,
      trafficType: plan.trafficType,
      trafficGb: plan.trafficGb,
      deviceLimit: plan.deviceLimit,
      resetPolicy: plan.resetPolicy,
      renewalTerms: plan.renewalTerms,
      purchaseUrl: plan.purchaseUrl,
      price: normalized,
    }
  })

  // 价格历史（供价格历史 UI 使用）
  const priceHistory = product.priceRecords.map(r => ({
    amount: toNumber(r.amount),
    currency: r.currency,
    billingPeriod: r.billingPeriod,
    observedAt: r.observedAt,
    isPromotional: r.isPromotional,
  }))

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
    publishedAt: product.publishedAt,
    vendor: product.vendor
      ? { name: product.vendor.name, slug: product.vendor.slug, websiteUrl: product.vendor.websiteUrl }
      : null,
    tags: product.tags.map(mapTag),
    links: product.links.map(mapLink),
    airportDetail: product.airportDetail,
    plans,
    priceHistory,
    networkTests: product.networkTests,
    dataSources: product.dataSources.map(ds => ({
      ...mapDataSource(ds),
      confidence: ds.confidence,
    })),
  }
}
