// VPS 详情 API
import { getVpsBySlug } from '../../../services/vps.service'
import { ok, fail } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) return fail('INVALID_PARAM', '缺少 slug 参数')

  const vps = await getVpsBySlug(slug)
  if (!vps) return fail('NOT_FOUND', '未找到该 VPS', {}, 404)

  return ok(vps)
})
