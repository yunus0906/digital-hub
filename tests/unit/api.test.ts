import { describe, it, expect } from 'vitest'
import { parsePagination, buildMeta } from '../../server/utils/api'

describe('分页参数规范化（方案第 8.3 节）', () => {
  it('默认 page=1 pageSize=20', () => {
    const p = parsePagination({})
    expect(p.page).toBe(1)
    expect(p.pageSize).toBe(20)
    expect(p.skip).toBe(0)
    expect(p.take).toBe(20)
  })

  it('非法 page 被规范化为 1', () => {
    expect(parsePagination({ page: '-1' }).page).toBe(1)
    expect(parsePagination({ page: 'abc' }).page).toBe(1)
    expect(parsePagination({ page: '0' }).page).toBe(1)
  })

  it('非法 pageSize 被规范化为 20', () => {
    expect(parsePagination({ pageSize: '-5' }).pageSize).toBe(20)
    expect(parsePagination({ pageSize: 'xyz' }).pageSize).toBe(20)
  })

  it('pageSize 上限 100', () => {
    expect(parsePagination({ pageSize: '1000' }).pageSize).toBe(100)
  })

  it('skip 正确计算', () => {
    const p = parsePagination({ page: '3', pageSize: '20' })
    expect(p.skip).toBe(40)
  })

  it('buildMeta 正确计算 totalPages', () => {
    expect(buildMeta(45, 1, 20).totalPages).toBe(3)
    expect(buildMeta(0, 1, 20).totalPages).toBe(0)
  })
})
