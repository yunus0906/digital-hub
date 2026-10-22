<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// 客户端不阻塞导航：立即渲染骨架屏；watch slug 保证同路由换参数时重新请求
const { data, pending, error } = await useFetch<{ data: any }>(`/api/v1/airports/${slug.value}`, {
  lazy: import.meta.client,
  watch: [slug],
})
const airport = computed(() => data.value?.data)
const showSkeleton = computed(() => pending.value && !data.value)

// 时间格式化
function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

function periodLabel(p: string) {
  const map: Record<string, string> = {
    month: '月付',
    quarter: '季付',
    half_year: '半年付',
    year: '年付',
    one_time: '一次性',
    usage: '按量',
    hour: '按小时',
    custom: '自定义',
  }
  return map[p] ?? p
}

function trafficLabel(t: string) {
  const map: Record<string, string> = {
    fixed: '固定流量',
    unlimited: '不限量',
    usage_based: '按量计费',
    unknown: '待核实',
  }
  return map[t] ?? t
}

useHead(() => ({
  title: airport.value ? `${airport.value.name} - 机场订阅 - DigitalHub` : '机场详情',
  meta: [
    {
      name: 'description',
      content: airport.value?.summary ?? '机场订阅详情',
    },
  ],
}))
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <SkeletonDetail v-if="showSkeleton" />
    <div
      v-else-if="error || !airport"
      class="py-16 text-center"
    >
      <p class="text-sm text-red-600">
        未找到该机场
      </p>
      <UButton
        to="/airports"
        color="neutral"
        variant="outline"
        class="mt-4"
      >返回列表</UButton>
    </div>

    <div v-else>
      <!-- 基本信息 -->
      <div class="rounded-xl border border-neutral-200 bg-white p-6">
        <div class="flex items-start gap-4">
          <span class="logo-fallback h-16 w-16 shrink-0 text-2xl">{{ airport.name[0] }}</span>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-neutral-900">
              {{ airport.name }}
            </h1>
            <p
              v-if="airport.summary"
              class="mt-2 text-sm text-neutral-600"
            >
              {{ airport.summary }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <UBadge
                v-if="airport.dataStatus === 'verified'"
                color="success"
                variant="subtle"
              >已核验</UBadge>
              <UBadge
                v-else-if="airport.dataStatus === 'stale'"
                color="warning"
                variant="subtle"
              >可能过期</UBadge>
              <span class="text-neutral-500">最后核验：{{ fmtDate(airport.lastVerifiedAt) }}</span>
              <span
                v-if="airport.vendor"
                class="text-neutral-500"
              >厂商：{{ airport.vendor.name }}</span>
            </div>
          </div>
          <UButton
            v-if="airport.officialUrl"
            :to="airport.officialUrl"
            target="_blank"
            trailing-icon="i-lucide-arrow-up-right"
          >
            访问官网
          </UButton>
        </div>

        <!-- 详情描述 -->
        <div
          v-if="airport.description"
          class="mt-6 border-t border-neutral-100 pt-4"
        >
          <h2 class="mb-2 text-base font-semibold text-neutral-900">
            详细介绍
          </h2>
          <p class="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {{ airport.description }}
          </p>
        </div>

        <!-- 关键指标 -->
        <div
          v-if="airport.airportDetail"
          class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              流量类型
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ trafficLabel(airport.airportDetail.trafficType) }}
            </p>
          </div>
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              月流量
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ airport.airportDetail.monthlyTrafficGb ? `${airport.airportDetail.monthlyTrafficGb} GB` : '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              设备数限制
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ airport.airportDetail.deviceLimit ?? '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              服务状态
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ airport.airportDetail.serviceStatus }}
            </p>
          </div>
        </div>
      </div>

      <!-- 套餐表 -->
      <div class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white">
        <div class="border-b border-neutral-100 px-6 py-4">
          <h2 class="text-base font-semibold text-neutral-900">
            套餐与价格
          </h2>
        </div>
        <div
          v-if="!airport.plans?.length"
          class="p-6 text-sm text-neutral-500"
        >
          暂无套餐数据
        </div>
        <div
          v-else
          class="overflow-x-auto"
        >
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th class="px-6 py-3 font-medium">
                  套餐
                </th>
                <th class="px-4 py-3 font-medium">
                  周期
                </th>
                <th class="px-4 py-3 font-medium">
                  流量
                </th>
                <th class="px-4 py-3 font-medium">
                  设备
                </th>
                <th class="px-4 py-3 font-medium text-right">
                  价格
                </th>
                <th class="px-6 py-3 font-medium text-right">
                  折算月均价
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                v-for="plan in airport.plans"
                :key="plan.id"
              >
                <td class="px-6 py-4 font-medium text-neutral-900">
                  {{ plan.name }}
                </td>
                <td class="px-4 py-4 text-neutral-600">
                  {{ periodLabel(plan.billingPeriod) }}
                </td>
                <td class="px-4 py-4 text-neutral-600">
                  {{ plan.trafficType === 'unlimited' ? '不限量' : plan.trafficGb ? `${plan.trafficGb} GB` : '—' }}
                </td>
                <td class="px-4 py-4 text-neutral-600">
                  {{ plan.deviceLimit ?? '—' }}
                </td>
                <td class="px-4 py-4 text-right">
                  <span
                    v-if="plan.price"
                    class="text-neutral-900"
                  >
                    ¥{{ plan.price.amount.toFixed(2) }}
                    <span
                      v-if="plan.price.isPromotional"
                      class="ml-1 text-xs text-red-600"
                    >促销</span>
                  </span>
                  <span
                    v-else
                    class="text-neutral-400"
                  >待核实</span>
                </td>
                <td class="px-6 py-4 text-right font-semibold text-blue-600">
                  {{
                    plan.price?.monthlyEquivalent !== null && plan.price?.monthlyEquivalent !== undefined
                      ? `¥${plan.price.monthlyEquivalent.toFixed(2)}`
                      : '—'
                  }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 网络实测 -->
      <div
        v-if="airport.networkTests?.length"
        class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white"
      >
        <div class="border-b border-neutral-100 px-6 py-4">
          <h2 class="text-base font-semibold text-neutral-900">
            网络实测记录
          </h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-neutral-50 text-left text-xs text-neutral-500">
              <tr>
                <th class="px-6 py-3 font-medium">
                  地区
                </th>
                <th class="px-4 py-3 font-medium">
                  延迟
                </th>
                <th class="px-4 py-3 font-medium">
                  下载
                </th>
                <th class="px-4 py-3 font-medium">
                  上传
                </th>
                <th class="px-4 py-3 font-medium">
                  丢包
                </th>
                <th class="px-6 py-3 font-medium">
                  测试时间
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-neutral-100">
              <tr
                v-for="t in airport.networkTests"
                :key="t.id"
              >
                <td class="px-6 py-3 text-neutral-900">
                  {{ t.testRegion }}
                </td>
                <td class="px-4 py-3 text-neutral-600">
                  {{ t.latencyMs ?? '—' }} ms
                </td>
                <td class="px-4 py-3 text-neutral-600">
                  {{ t.downloadMbps ?? '—' }} Mbps
                </td>
                <td class="px-4 py-3 text-neutral-600">
                  {{ t.uploadMbps ?? '—' }} Mbps
                </td>
                <td class="px-4 py-3 text-neutral-600">
                  {{ t.packetLossPercent ?? '—' }}%
                </td>
                <td class="px-6 py-3 text-neutral-600">
                  {{ fmtDate(t.testedAt) }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- 数据来源 -->
      <div
        v-if="airport.dataSources?.length"
        class="mt-6 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 class="text-base font-semibold text-neutral-900">
          数据来源
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-neutral-600">
          <li
            v-for="(ds, i) in airport.dataSources"
            :key="i"
            class="flex items-center gap-2"
          >
            <UBadge
              color="primary"
              variant="subtle"
            >{{ ds.type }}</UBadge>
            <span>{{ ds.name }}</span>
            <span
              v-if="ds.fieldKey"
              class="text-xs text-neutral-400"
            >字段：{{ ds.fieldKey }}</span>
            <span
              v-if="ds.verifiedAt"
              class="text-xs text-neutral-400"
            >核验：{{ fmtDate(ds.verifiedAt) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
