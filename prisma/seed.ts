// DigitalHub 种子数据
// 重要：以下所有数据均为【示例数据】，非真实厂商/价格/评分。
// 仅用于本地开发与测试，禁止将示例数据伪装成真实商家数据上线。
import { PrismaClient } from '@prisma/generated-client'

const prisma = new PrismaClient()

async function main() {
  console.log('开始写入示例数据（均为虚构，仅用于开发测试）...')

  // 清空（按外键依赖顺序）
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "product_tags", "product_data_sources", "price_records", "price_history_events", "airport_plans", "airport_network_tests", "airport_details", "client_application_platforms", "client_core_compatibility", "client_releases", "vps_network_tests", "vps_plans", "vps_locations", "client_applications", "client_platforms", "proxy_cores", "product_links", "data_sources", "products", "vendors", "tags" RESTART IDENTITY CASCADE')

  // ------------------------------------------------------------------
  // 数据来源（示例）
  // ------------------------------------------------------------------
  const srcOfficial = await prisma.dataSource.create({
    data: { name: '官方页面（示例）', sourceType: 'official', reliabilityLevel: 3 },
  })
  const srcManual = await prisma.dataSource.create({
    data: { name: '人工录入（示例）', sourceType: 'manual', reliabilityLevel: 2 },
  })
  const srcGithub = await prisma.dataSource.create({
    data: { name: 'GitHub API（示例）', sourceType: 'github', reliabilityLevel: 3 },
  })

  // ------------------------------------------------------------------
  // 标签
  // ------------------------------------------------------------------
  const tags = await Promise.all(
    [
      { name: '高性价比', slug: 'cost-effective', category: 'general' },
      { name: '老牌稳定', slug: 'established', category: 'general' },
      { name: '不限流量', slug: 'unlimited-traffic', category: 'airport' },
      { name: '支持多设备', slug: 'multi-device', category: 'airport' },
      { name: '开源', slug: 'open-source', category: 'client' },
      { name: '跨平台', slug: 'cross-platform', category: 'client' },
      { name: 'KVM 虚拟化', slug: 'kvm', category: 'vps' },
      { name: '国内优化线路', slug: 'cn-optimized', category: 'vps' },
    ].map(t => prisma.tag.create({ data: t })),
  )

  // ------------------------------------------------------------------
  // 厂商（示例）
  // ------------------------------------------------------------------
  const vendorA = await prisma.vendor.create({
    data: { name: '示例机场科技', slug: 'demo-airport-tech', vendorType: 'provider', websiteUrl: 'https://example.com', description: '示例机场服务商（虚构）' },
  })
  const vendorB = await prisma.vendor.create({
    data: { name: '示例客户端工作室', slug: 'demo-app-studio', vendorType: 'developer', websiteUrl: 'https://example.com', description: '示例客户端开发者（虚构）' },
  })
  const vendorC = await prisma.vendor.create({
    data: { name: '示例云厂商', slug: 'demo-cloud-provider', vendorType: 'provider', websiteUrl: 'https://example.com', description: '示例云服务器厂商（虚构）' },
  })

  // ------------------------------------------------------------------
  // 机场 1
  // ------------------------------------------------------------------
  const airport1 = await prisma.product.create({
    data: {
      category: 'airport',
      name: '示例机场 Alpha',
      slug: 'demo-airport-alpha',
      summary: '提供多地区节点的示例订阅服务（虚构数据）',
      description: '这是一个用于开发测试的示例机场。所有价格、流量与评价均为虚构，不代表任何真实服务。',
      vendorId: vendorA.id,
      status: 'published',
      dataStatus: 'verified',
      lastVerifiedAt: new Date(),
      publishedAt: new Date(),
      airportDetail: {
        create: { trafficType: 'unlimited', deviceLimit: 5, serviceStatus: 'active', refundPolicy: '24 小时内可退款（示例）' },
      },
      tags: { create: [{ tagId: tags[2]!.id }, { tagId: tags[3]!.id }] },
      dataSources: {
        create: [{ dataSourceId: srcManual.id, fieldKey: 'price', confidence: 80, verifiedAt: new Date() }],
      },
    },
  })

  const airport1Plans = await Promise.all([
    prisma.airportPlan.create({
      data: { productId: airport1.id, name: '月付不限量', billingPeriod: 'month', trafficType: 'unlimited', deviceLimit: 5, status: 'published' },
    }),
    prisma.airportPlan.create({
      data: { productId: airport1.id, name: '年付不限量', billingPeriod: 'year', trafficType: 'unlimited', deviceLimit: 8, status: 'published' },
    }),
  ])

  await prisma.priceRecord.createMany({
    data: [
      { productId: airport1.id, planId: airport1Plans[0].id, amount: 25, currency: 'CNY', billingPeriod: 'month', validFrom: new Date() },
      { productId: airport1.id, planId: airport1Plans[1].id, amount: 240, currency: 'CNY', billingPeriod: 'year', isPromotional: true, renewalAmount: 288, validFrom: new Date() },
    ],
  })

  // ------------------------------------------------------------------
  // 机场 2（固定流量）
  // ------------------------------------------------------------------
  const airport2 = await prisma.product.create({
    data: {
      category: 'airport',
      name: '示例机场 Beta',
      slug: 'demo-airport-beta',
      summary: '按流量计费的示例订阅服务（虚构数据）',
      description: '用于测试固定流量筛选功能的示例机场。数据均为虚构。',
      vendorId: vendorA.id,
      status: 'published',
      dataStatus: 'community_submitted',
      lastVerifiedAt: new Date(Date.now() - 60 * 86400000), // 60 天前，用于测试「可能过期」
      publishedAt: new Date(),
      airportDetail: {
        create: { trafficType: 'fixed', monthlyTrafficGb: 200, deviceLimit: 3, serviceStatus: 'active' },
      },
      tags: { create: [{ tagId: tags[0]!.id }] },
      dataSources: {
        create: [{ dataSourceId: srcManual.id, fieldKey: 'price', confidence: 60 }],
      },
    },
  })

  const airport2Plan = await prisma.airportPlan.create({
    data: { productId: airport2.id, name: '200GB 月付', billingPeriod: 'month', trafficType: 'fixed', trafficGb: 200, deviceLimit: 3, status: 'published' },
  })

  await prisma.priceRecord.create({
    data: { productId: airport2.id, planId: airport2Plan.id, amount: 15, currency: 'CNY', billingPeriod: 'month', validFrom: new Date() },
  })

  // ------------------------------------------------------------------
  // 机场 3（草稿，不应出现在公共列表）
  // ------------------------------------------------------------------
  await prisma.product.create({
    data: {
      category: 'airport',
      name: '示例机场 Draft',
      slug: 'demo-airport-draft',
      summary: '草稿状态的示例机场（不应公开）',
      status: 'draft',
      dataStatus: 'unknown',
      airportDetail: { create: { trafficType: 'unknown', serviceStatus: 'unknown' } },
    },
  })

  // ------------------------------------------------------------------
  // 客户端 1（开源内核）
  // ------------------------------------------------------------------
  const core1 = await prisma.proxyCore.create({
    data: { name: '示例内核 CoreX', slug: 'demo-core-x', officialUrl: 'https://example.com', repositoryUrl: 'https://github.com/example/core-x', licenseName: 'MIT', status: 'published' },
  })

  const client1 = await prisma.product.create({
    data: {
      category: 'client_app',
      name: '示例客户端 ClashPro',
      slug: 'demo-client-clashpro',
      summary: '跨平台示例客户端（虚构数据）',
      description: '用于测试客户端列表与详情页的示例客户端。Stars、Release 等指标均为虚构。',
      vendorId: vendorB.id,
      status: 'published',
      dataStatus: 'verified',
      lastVerifiedAt: new Date(),
      publishedAt: new Date(),
      clientApp: {
        create: {
          applicationType: 'client',
          codeStatus: 'open_source',
          licenseName: 'GPL-3.0',
          priceStatus: 'free',
          maintenanceStatus: 'active',
          repositoryUrl: 'https://github.com/example/clashpro',
          latestReleaseAt: new Date(Date.now() - 10 * 86400000),
          lastCommitAt: new Date(Date.now() - 2 * 86400000),
          starsCount: 12345,
          forksCount: 2345,
          metricsObservedAt: new Date(),
        },
      },
      tags: { create: [{ tagId: tags[4]!.id }, { tagId: tags[5]!.id }] },
      dataSources: { create: [{ dataSourceId: srcGithub.id, fieldKey: 'stars', confidence: 90, verifiedAt: new Date() }] },
    },
  })

  // 平台
  const platforms = await Promise.all(
    ['windows', 'macos', 'linux', 'android', 'ios'].map(code =>
      prisma.clientPlatform.upsert({ where: { code }, update: {}, create: { code, name: code.charAt(0).toUpperCase() + code.slice(1) } }),
    ),
  )
  await prisma.clientAppPlatform.createMany({
    data: platforms.slice(0, 4).map(p => ({ productId: client1.id, platformId: p.id, supportStatus: 'full' })),
  })
  await prisma.clientCoreCompat.create({
    data: { clientProductId: client1.id, coreId: core1.id, compatibilityStatus: 'full', supportedVersionRange: '>=1.0.0', verifiedAt: new Date() },
  })
  await prisma.clientRelease.createMany({
    data: [
      { productId: client1.id, version: '1.3.0', releasedAt: new Date(Date.now() - 10 * 86400000), downloadUrl: 'https://github.com/example/clashpro/releases/v1.3.0', changelog: '示例更新说明' },
      { productId: client1.id, version: '1.2.0', releasedAt: new Date(Date.now() - 30 * 86400000), downloadUrl: 'https://github.com/example/clashpro/releases/v1.2.0', changelog: '示例更新说明' },
    ],
  })

  // ------------------------------------------------------------------
  // 客户端 2（许可证未确认，用于测试该状态）
  // ------------------------------------------------------------------
  await prisma.product.create({
    data: {
      category: 'client_app',
      name: '示例工具 SubHelper',
      slug: 'demo-client-subhelper',
      summary: '订阅辅助工具（许可证未确认，虚构）',
      status: 'published',
      dataStatus: 'unknown',
      publishedAt: new Date(),
      clientApp: {
        create: {
          applicationType: 'helper',
          codeStatus: 'license_unconfirmed',
          priceStatus: 'freemium',
          maintenanceStatus: 'low_activity',
          repositoryUrl: 'https://github.com/example/subhelper',
          lastCommitAt: new Date(Date.now() - 180 * 86400000),
        },
      },
    },
  })

  // ------------------------------------------------------------------
  // VPS
  // ------------------------------------------------------------------
  const locUS = await prisma.vpsLocation.create({
    data: { vendorId: vendorC.id, countryCode: 'US', countryName: '美国', city: '洛杉矶', datacenterName: '示例机房 LAX', regionCode: 'us-west' },
  })
  const locHK = await prisma.vpsLocation.create({
    data: { vendorId: vendorC.id, countryCode: 'HK', countryName: '中国香港', city: '香港', datacenterName: '示例机房 HKG', regionCode: 'ap-east' },
  })

  const vps1 = await prisma.product.create({
    data: {
      category: 'vps_plan',
      name: '示例云厂商 CloudPlus',
      slug: 'demo-cloud-plus',
      summary: '提供多地区示例 VPS（虚构数据）',
      description: '用于测试 VPS 列表与详情页的示例云厂商。所有规格与价格均为虚构。',
      vendorId: vendorC.id,
      status: 'published',
      dataStatus: 'verified',
      lastVerifiedAt: new Date(),
      publishedAt: new Date(),
      tags: { create: [{ tagId: tags[6]!.id }, { tagId: tags[7]!.id }] },
      dataSources: { create: [{ dataSourceId: srcOfficial.id, fieldKey: 'price', confidence: 85, verifiedAt: new Date() }] },
    },
  })

  await prisma.vpsPlan.create({
    data: {
      productId: vps1.id,
      locationId: locUS.id,
      planName: '入门型 VPS',
      productType: 'vps',
      virtualizationType: 'KVM',
      cpuModel: 'AMD EPYC',
      cpuArchitecture: 'x86_64',
      vcpuCount: 1,
      cpuSharing: 'shared',
      memoryMb: 1024,
      storageGb: 25,
      storageType: 'NVMe SSD',
      bandwidthMbps: 100,
      trafficGb: 1000,
      trafficDirection: 'both',
      ipv4Count: 1,
      ipv6Supported: true,
      availabilityStatus: 'in_stock',
      purchaseUrl: 'https://example.com/buy/basic',
    },
  })

  await prisma.vpsPlan.create({
    data: {
      productId: vps1.id,
      locationId: locHK.id,
      planName: '进阶型 VPS',
      productType: 'vps',
      virtualizationType: 'KVM',
      cpuModel: 'AMD EPYC',
      cpuArchitecture: 'x86_64',
      vcpuCount: 2,
      cpuSharing: 'shared',
      memoryMb: 2048,
      storageGb: 50,
      storageType: 'NVMe SSD',
      bandwidthMbps: 200,
      trafficGb: 2000,
      trafficDirection: 'both',
      ipv4Count: 1,
      ipv6Supported: true,
      availabilityStatus: 'in_stock',
      purchaseUrl: 'https://example.com/buy/pro',
    },
  })

  await prisma.priceRecord.createMany({
    data: [
      { productId: vps1.id, amount: 5, currency: 'USD', billingPeriod: 'month', validFrom: new Date() },
      { productId: vps1.id, amount: 50, currency: 'USD', billingPeriod: 'year', isPromotional: true, validFrom: new Date() },
    ],
  })

  console.log('示例数据写入完成 ✅')
  console.log('提醒：以上全部为虚构示例数据，禁止作为真实商家数据使用。')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
