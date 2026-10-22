// 健康检查 API（M0 验收）
import prisma from '../../utils/prisma'
import { ok, fail } from '../../utils/api'

export default defineEventHandler(async () => {
  try {
    await prisma.$queryRaw`SELECT 1`
    return ok({ status: 'ok', database: 'connected', time: new Date().toISOString() })
  }
  catch {
    return fail('DB_UNAVAILABLE', '数据库连接失败', {}, 503)
  }
})
