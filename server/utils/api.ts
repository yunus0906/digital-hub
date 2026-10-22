// 统一 API 响应格式与错误处理，遵循方案第 8 节

export interface Meta {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export function ok<T>(data: T, meta?: Meta) {
  return meta ? { data, meta } : { data }
}

export function fail(
  code: string,
  message: string,
  details: Record<string, unknown> = {},
  status?: number,
) {
  const err = createError({
    statusCode: status ?? 400,
    statusMessage: code,
    data: { error: { code, message, details } },
  })
  return err
}

/**
 * 标准化分页参数：page 从 1 开始，pageSize 默认 20 最大 100
 * 非法值被规范化，不抛错
 */
export function parsePagination(query: Record<string, unknown>) {
  let page = Number(query.page)
  let pageSize = Number(query.pageSize)

  if (!Number.isInteger(page) || page < 1) page = 1
  if (!Number.isInteger(pageSize) || pageSize < 1) pageSize = 20
  if (pageSize > 100) pageSize = 100

  return { page, pageSize, skip: (page - 1) * pageSize, take: pageSize }
}

export function buildMeta(total: number, page: number, pageSize: number): Meta {
  return {
    page,
    pageSize,
    total,
    totalPages: Math.ceil(total / pageSize),
  }
}
