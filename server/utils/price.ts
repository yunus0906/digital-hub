// 价格折算工具：按方案第 7.1 节规则，将不同计费周期折算为月均价
import type { BillingPeriod, Currency } from '@prisma/generated-client'

export interface NormalizedPrice {
  amount: number
  currency: Currency
  billingPeriod: BillingPeriod
  monthlyEquivalent: number | null // 折算月均价（仅固定周期可折算）
  isPromotional: boolean
  renewalAmount: number | null
}

const PERIOD_MONTHS: Record<BillingPeriod, number | null> = {
  month: 1,
  quarter: 3,
  half_year: 6,
  year: 12,
  one_time: null,
  usage: null,
  hour: null,
  custom: null,
}

/**
 * 计算折算月均价
 * 月付 = 原价；季付 /3；半年付 /6；年付 /12
 * 一次性/按量/按小时返回 null（不可混排）
 */
export function monthlyEquivalent(amount: number, period: BillingPeriod): number | null {
  const months = PERIOD_MONTHS[period]
  if (months === null) return null
  return round(amount / months)
}

export function round(n: number, precision = 2): number {
  const f = 10 ** precision
  return Math.round(n * f) / f
}

/**
 * 将 Prisma Decimal 转为 number，避免精度丢失展示
 */
export function toNumber(v: { toString: () => string } | null | undefined): number | null {
  if (v === null || v === undefined) return null
  const n = Number(v.toString())
  return Number.isFinite(n) ? n : null
}

/**
 * 归一化一条价格记录
 */
export function normalizePrice(record: {
  amount: { toString: () => string }
  currency: Currency
  billingPeriod: BillingPeriod
  isPromotional: boolean
  renewalAmount: { toString: () => string } | null
}): NormalizedPrice {
  const amount = toNumber(record.amount) ?? 0
  return {
    amount,
    currency: record.currency,
    billingPeriod: record.billingPeriod,
    monthlyEquivalent: monthlyEquivalent(amount, record.billingPeriod),
    isPromotional: record.isPromotional,
    renewalAmount: toNumber(record.renewalAmount),
  }
}
