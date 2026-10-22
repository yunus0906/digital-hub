// VPS 列表 API
import { listVps } from '../../../services/vps.service'
import { ok } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const result = await listVps(query)
  return ok(result.data, result.meta)
})
