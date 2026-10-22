// VPS 服务：套餐列表、筛选（地区/配置/价格）、排序、详情
import type { Prisma } from '@prisma/generated-client'
import prisma from '../utils/prisma'
import { buildMeta, parsePagination } from '../utils/api'
import { normalizePrice, toNumber } from '../utils/price'
import { mapDataSource, mapLink, mapTag } from '../utils/product-dto'

export interface VpsListQuery {
  page?: string
  pageSize?: string
  q?: string
  sort?: string
  order?: string
  countryCode?: string
  productType?: string
  minMemory?: string
  maxMemory?: string
  minVcpu?: string
  minPrice?: string
  maxPrice?: string
  billingPeriod?: string
}

const SORT_WHITELIST: Record<string, string> = {
  recommended: 'recommended',
  monthly_price: 'monthly_price',
  memory: 'memory',
  bandwidth: 'bandwidth',
  recently_updated: 'recently_updated',
}

export async function listVps(query: VpsListQuery) {
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>)

  const where: Prisma.ProductWhereInput = {
    category: 'vps_plan',
    status: 'published',
    deletedAt: null,
  }

  if (query.q) {
    where.OR = [
      { name: { contains: query.q, mode: 'insensitive' } },
      { summary: { contains: query.q, mode: 'insensitive' } },
    ]
  }

  // 注意：VPS 列表是「套餐粒度」。筛选条件在套餐层面应用，
  // 因此这里不通过 where.vpsPlans={some} 做产品级过滤，
  // 而是在下方展开循环中对每个套餐单独判断。

  const minPrice = query.minPrice ? Number(query.minPrice) : null
  const maxPrice = query.maxPrice ? Number(query.maxPrice) : null
  const billingPeriod = query.billingPeriod

  const sortKey = SORT_WHITELIST[query.sort ?? ''] ?? 'recommended'
  const order = query.order === 'asc' ? 'asc' : 'desc'

  // 先取产品（含套餐、地区、价格）
  const products = await prisma.product.findMany({
    where,
    include: {
      vendor: true,
      vpsPlans: {
        include: { location: true, networkTests: { orderBy: { testedAt: 'desc' } } },
      },
      priceRecords: { where: { validTo: null }, orderBy: { validFrom: 'desc' } },
    },
  })

  // 展开为「产品 + 套餐」粒度的列表项，并在套餐层面应用筛选
  let items: any[] = []
  for (const p of products) {
    for (const plan of p.vpsPlans) {
      // 套餐级筛选：产品类型
      if (query.productType && plan.productType !== query.productType) continue
      // 套餐级筛选：内存区间
      if (query.minMemory && (plan.memoryMb === null || plan.memoryMb < Number(query.minMemory))) continue
      if (query.maxMemory && (plan.memoryMb === null || plan.memoryMb > Number(query.maxMemory))) continue
      // 套餐级筛选：vCPU
      if (query.minVcpu && (plan.vcpuCount === null || plan.vcpuCount < Number(query.minVcpu))) continue
      // 套餐级筛选：地区
      if (query.countryCode && plan.location?.countryCode !== query.countryCode) continue

      const priceRecord = p.priceRecords.find(r =>
        r.planId === plan.id && (!billingPeriod || r.billingPeriod === billingPeriod),
      )
      const price = priceRecord ? normalizePrice(priceRecord) : null
      const monthly = price?.monthlyEquivalent ?? null
      if (billingPeriod && price?.billingPeriod !== billingPeriod) continue
      items.push({
        productId: p.id,
        productSlug: p.slug,
        productName: p.name,
        vendorName: p.vendor?.name ?? null,
        vendorSlug: p.vendor?.slug ?? null,
        planId: plan.id,
        planName: plan.planName,
        productType: plan.productType,
        virtualizationType: plan.virtualizationType,
        cpuModel: plan.cpuModel,
        cpuArchitecture: plan.cpuArchitecture,
        vcpuCount: plan.vcpuCount,
        cpuSharing: plan.cpuSharing,
        memoryMb: plan.memoryMb,
        storageGb: plan.storageGb,
        storageType: plan.storageType,
        bandwidthMbps: plan.bandwidthMbps,
        trafficGb: plan.trafficGb,
        trafficDirection: plan.trafficDirection,
        ipv4Count: plan.ipv4Count,
        ipv6Supported: plan.ipv6Supported,
        refundPolicy: plan.refundPolicy,
        availabilityStatus: plan.availabilityStatus,
        purchaseUrl: plan.purchaseUrl,
        location: plan.location
          ? {
              countryCode: plan.location.countryCode,
              countryName: plan.location.countryName,
              city: plan.location.city,
              datacenterName: plan.location.datacenterName,
            }
          : null,
        monthlyPrice: monthly,
        price,
      })
    }
  }

  // 价格区间过滤
  if (minPrice !== null || maxPrice !== null) {
    items = items.filter((it) => {
      const m = it.monthlyPrice
      if (m === null) return false
      if (minPrice !== null && m < minPrice) return false
      if (maxPrice !== null && m > maxPrice) return false
      return true
    })
  }

  // 排序
  const updatedAtByProductId = new Map(products.map(p => [p.id, p.updatedAt.getTime()]))
  items.sort((a, b) => {
    const cmp = (x: number | null, y: number | null) => {
      if (x === null && y === null) return 0
      if (x === null) return 1
      if (y === null) return -1
      return order === 'asc' ? x - y : y - x
    }
    switch (sortKey) {
      case 'monthly_price':
        return cmp(a.monthlyPrice, b.monthlyPrice)
      case 'memory':
        return cmp(a.memoryMb, b.memoryMb)
      case 'bandwidth':
        return cmp(a.bandwidthMbps, b.bandwidthMbps)
      case 'recently_updated': {
        const da = updatedAtByProductId.get(a.productId)!
        const db = updatedAtByProductId.get(b.productId)!
        return order === 'asc' ? da - db : db - da
      }
      case 'recommended':
      default: {
        // 有价格 + 配置信息完整者优先
        const sa = (a.monthlyPrice !== null ? 2 : 0) + (a.memoryMb ? 1 : 0) + (a.cpuModel ? 1 : 0)
        const sb = (b.monthlyPrice !== null ? 2 : 0) + (b.memoryMb ? 1 : 0) + (b.cpuModel ? 1 : 0)
        return sb - sa
      }
    }
  })

  const total = items.length
  const paged = items.slice(skip, skip + take)

  return { data: paged, meta: buildMeta(total, page, pageSize) }
}

export async function getVpsBySlug(slug: string) {
  const product = await prisma.product.findFirst({
    where: { slug, category: 'vps_plan', status: 'published', deletedAt: null },
    include: {
      vendor: true,
      tags: { include: { tag: true } },
      links: { where: { isActive: true } },
      vpsPlans: {
        include: { location: true, networkTests: { orderBy: { testedAt: 'desc' } } },
      },
      priceRecords: { orderBy: { validFrom: 'desc' } },
      dataSources: { include: { dataSource: true } },
    },
  })

  if (!product) return null

  const plans = product.vpsPlans.map((plan) => {
    const priceRecord = product.priceRecords.find(r => r.planId === plan.id && r.validTo === null)
    const price = priceRecord ? normalizePrice(priceRecord) : null
    return {
      id: plan.id,
      planName: plan.planName,
      productType: plan.productType,
      virtualizationType: plan.virtualizationType,
      cpuModel: plan.cpuModel,
      cpuArchitecture: plan.cpuArchitecture,
      vcpuCount: plan.vcpuCount,
      cpuSharing: plan.cpuSharing,
      memoryMb: plan.memoryMb,
      storageGb: plan.storageGb,
      storageType: plan.storageType,
      bandwidthMbps: plan.bandwidthMbps,
      bandwidthType: plan.bandwidthType,
      trafficGb: plan.trafficGb,
      trafficDirection: plan.trafficDirection,
      ipv4Count: plan.ipv4Count,
      ipv6Supported: plan.ipv6Supported,
      refundPolicy: plan.refundPolicy,
      availabilityStatus: plan.availabilityStatus,
      purchaseUrl: plan.purchaseUrl,
      location: plan.location
        ? {
            countryCode: plan.location.countryCode,
            countryName: plan.location.countryName,
            city: plan.location.city,
            datacenterName: plan.location.datacenterName,
          }
        : null,
      networkTests: plan.networkTests,
      price,
    }
  })

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
    vendor: product.vendor
      ? { name: product.vendor.name, slug: product.vendor.slug, websiteUrl: product.vendor.websiteUrl }
      : null,
    tags: product.tags.map(mapTag),
    links: product.links.map(mapLink),
    plans,
    priceHistory,
    dataSources: product.dataSources.map(mapDataSource),
  }
}
