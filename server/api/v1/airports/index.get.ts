// 机场列表 API
import { listAirports } from '../../../services/airport.service'
import { ok } from '../../../utils/api'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const result = await listAirports(query)
  return ok(result.data, result.meta)
})
