// 客户端详情 API
import { getAppBySlug } from '../../../services/app.service'
import { ok, fail } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const slug = getRouterParam(event, 'slug')
  if (!slug) return fail('INVALID_PARAM', '缺少 slug 参数')

  const app = await getAppBySlug(slug)
  if (!app) return fail('NOT_FOUND', '未找到该客户端', {}, 404)

  return ok(app)
})
