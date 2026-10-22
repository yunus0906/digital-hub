import { PrismaClient } from '@prisma/client'

// Prisma 客户端单例（避免开发环境热更新产生多个连接实例）
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

function createPrisma() {
  // 优先从 Nuxt runtimeConfig 读取数据库连接串，回退到环境变量
  // 这样生产构建（.output）运行时无需再显式注入 DATABASE_URL，
  // 只要 nuxt.config 的 runtimeConfig.databaseUrl 已从 .env 读取并编译进产物。
  let databaseUrl = process.env.DATABASE_URL
  try {
    const config = useRuntimeConfig()
    if (config.databaseUrl) databaseUrl = config.databaseUrl
  }
  catch {
    // 在非 Nuxt 环境（如 seed 脚本、单元测试）中 useRuntimeConfig 不可用，忽略
  }

  return new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
    datasources: databaseUrl ? { db: { url: databaseUrl } } : undefined,
  })
}

export const prisma = globalForPrisma.prisma ?? createPrisma()

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma
}

export default prisma
