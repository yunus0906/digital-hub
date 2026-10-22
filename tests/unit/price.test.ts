import { describe, it, expect } from 'vitest'
import { monthlyEquivalent, normalizePrice, toNumber, round } from '../../server/utils/price'

describe('价格折算（方案第 7.1 节）', () => {
  it('月付原价不变', () => {
    expect(monthlyEquivalent(25, 'month')).toBe(25)
  })

  it('季付折算 = 总价 / 3', () => {
    expect(monthlyEquivalent(90, 'quarter')).toBe(30)
  })

  it('半年付折算 = 总价 / 6', () => {
    expect(monthlyEquivalent(180, 'half_year')).toBe(30)
  })

  it('年付折算 = 总价 / 12', () => {
    expect(monthlyEquivalent(240, 'year')).toBe(20)
  })

  it('一次性/按量/按小时不可折算为月均价', () => {
    expect(monthlyEquivalent(100, 'one_time')).toBeNull()
    expect(monthlyEquivalent(100, 'usage')).toBeNull()
    expect(monthlyEquivalent(100, 'hour')).toBeNull()
  })

  it('normalizePrice 正确归一化', () => {
    const r = normalizePrice({
      amount: { toString: () => '240' },
      currency: 'CNY',
      billingPeriod: 'year',
      isPromotional: true,
      renewalAmount: { toString: () => '288' },
    })
    expect(r.amount).toBe(240)
    expect(r.monthlyEquivalent).toBe(20)
    expect(r.renewalAmount).toBe(288)
    expect(r.isPromotional).toBe(true)
  })

  it('toNumber 处理 null 与非法值', () => {
    expect(toNumber(null)).toBeNull()
    expect(toNumber({ toString: () => '12.34' })).toBe(12.34)
  })

  it('round 保留两位小数', () => {
    expect(round(20.0 / 3)).toBe(6.67)
  })
})
