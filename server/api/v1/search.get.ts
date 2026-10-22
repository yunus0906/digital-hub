// 全站搜索 API
import type { Prisma } from '@prisma/client'
import prisma from '../../utils/prisma'
import { ok, buildMeta, parsePagination } from '../../utils/api'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const q = String(query.q ?? '').trim()
  const { page, pageSize, skip, take } = parsePagination(query as Record<string, unknown>)

  if (!q) {
    return ok([], buildMeta(0, page, pageSize))
  }

  const where: Prisma.ProductWhereInput = {
    status: 'published',
    deletedAt: null,
    OR: [
      { name: { contains: q, mode: 'insensitive' } },
      { summary: { contains: q, mode: 'insensitive' } },
      { description: { contains: q, mode: 'insensitive' } },
    ],
  }

  const [products, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
      include: { vendor: true },
    }),
    prisma.product.count({ where }),
  ])

  return ok(
    products.map(p => ({
      slug: p.slug,
      name: p.name,
      category: p.category,
      summary: p.summary,
      logoUrl: p.logoUrl,
      dataStatus: p.dataStatus,
      lastVerifiedAt: p.lastVerifiedAt,
      vendor: p.vendor ? { name: p.vendor.name, slug: p.vendor.slug } : null,
    })),
    buildMeta(total, page, pageSize),
  )
})
