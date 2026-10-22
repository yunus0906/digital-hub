// 客户端列表 API
import { listApps } from '../../../services/app.service'
import { ok } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const result = await listApps(query)
  return ok(result.data, result.meta)
})
