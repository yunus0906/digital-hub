// 机场详情 API
import { getAirportBySlug } from '../../../services/airport.service'
import { ok, fail } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) return fail('INVALID_PARAM', '缺少 slug 参数')

  const airport = await getAirportBySlug(slug)
  if (!airport) return fail('NOT_FOUND', '未找到该机场', {}, 404)

  return ok(airport)
})
