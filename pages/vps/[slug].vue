<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// 客户端不阻塞导航：立即渲染骨架屏；watch slug 保证同路由换参数时重新请求
const { data, pending, error } = await useFetch<{ data: any }>(`/api/v1/vps/${slug.value}`, {
  lazy: import.meta.client,
  watch: [slug],
})
const vps = computed(() => data.value?.data)
const showSkeleton = computed(() => pending.value && !data.value)

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

function fmtMem(mb: number | null) {
  if (mb === null) return '—'
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}

useHead(() => ({
  title: vps.value ? `${vps.value.name} - VPS - DigitalHub` : 'VPS 详情',
  meta: [{ name: 'description', content: vps.value?.summary ?? 'VPS 套餐详情' }],
}))
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <SkeletonDetail v-if="showSkeleton" />
    <div
      v-else-if="error || !vps"
      class="py-16 text-center"
    >
      <p class="text-sm text-red-600">
        未找到该 VPS
      </p>
      <NuxtLink
        to="/vps"
        class="btn-secondary mt-4 inline-block"
      >返回列表</NuxtLink>
    </div>

    <div v-else>
      <div class="card p-6">
        <div class="flex items-start gap-4">
          <span class="logo-fallback h-16 w-16 shrink-0 text-2xl">{{ vps.name[0] }}</span>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ vps.name }}
            </h1>
            <p
              v-if="vps.summary"
              class="mt-2 text-sm text-gray-600"
            >
              {{ vps.summary }}
            </p>
            <div class="mt-3 flex flex-wrap items-center gap-2 text-xs">
              <span
                v-if="vps.dataStatus === 'verified'"
                class="badge-verified"
              >已核验</span>
              <span class="text-gray-500">最后核验：{{ fmtDate(vps.lastVerifiedAt) }}</span>
              <span
                v-if="vps.vendor"
                class="text-gray-500"
              >厂商：{{ vps.vendor.name }}</span>
            </div>
          </div>
          <a
            v-if="vps.officialUrl"
            :href="vps.officialUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="btn-primary external-link shrink-0"
          >访问官网</a>
        </div>

        <div
          v-if="vps.description"
          class="mt-6 border-t border-gray-100 pt-4"
        >
          <h2 class="mb-2 text-base font-semibold text-gray-900">
            产品介绍
          </h2>
          <p class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {{ vps.description }}
          </p>
        </div>
      </div>

      <!-- 套餐规格 -->
      <div class="card mt-6 overflow-hidden">
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="text-base font-semibold text-gray-900">
            套餐规格
          </h2>
        </div>
        <div
          v-if="!vps.plans?.length"
          class="p-6 text-sm text-gray-500"
        >
          暂无套餐数据
        </div>
        <div
          v-else
          class="space-y-4 p-6"
        >
          <div
            v-for="plan in vps.plans"
            :key="plan.id"
            class="rounded-lg border border-gray-200 p-4"
          >
            <div class="flex flex-wrap items-center justify-between gap-2">
              <h3 class="font-semibold text-gray-900">
                {{ plan.planName }}
              </h3>
              <span
                v-if="plan.price"
                class="text-lg font-bold text-blue-600"
              >
                {{ plan.price.monthlyEquivalent !== null ? `¥${plan.price.monthlyEquivalent.toFixed(2)}/月` : `¥${plan.price.amount.toFixed(2)}` }}
              </span>
              <span
                v-else
                class="text-gray-400"
              >价格待核实</span>
            </div>
            <p
              v-if="plan.location"
              class="mt-1 text-xs text-gray-500"
            >
              {{ plan.location.countryName }}<template v-if="plan.location.city">
                · {{ plan.location.city }}
              </template>
              <template v-if="plan.location.datacenterName">
                · {{ plan.location.datacenterName }}
              </template>
            </p>
            <dl class="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
              <div>
                <dt class="text-xs text-gray-500">
                  vCPU
                </dt><dd class="text-gray-900">
                  {{ plan.vcpuCount ?? '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  内存
                </dt><dd class="text-gray-900">
                  {{ fmtMem(plan.memoryMb) }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  存储
                </dt><dd class="text-gray-900">
                  {{ plan.storageGb ? `${plan.storageGb} GB` : '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  带宽
                </dt><dd class="text-gray-900">
                  {{ plan.bandwidthMbps ? `${plan.bandwidthMbps} Mbps` : '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  CPU 型号
                </dt><dd class="text-gray-900">
                  {{ plan.cpuModel ?? '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  虚拟化
                </dt><dd class="text-gray-900">
                  {{ plan.virtualizationType ?? '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  月流量
                </dt><dd class="text-gray-900">
                  {{ plan.trafficGb ? `${plan.trafficGb} GB` : '—' }}
                </dd>
              </div>
              <div>
                <dt class="text-xs text-gray-500">
                  IPv4
                </dt><dd class="text-gray-900">
                  {{ plan.ipv4Count ?? '—' }}
                </dd>
              </div>
            </dl>
            <a
              v-if="plan.purchaseUrl"
              :href="plan.purchaseUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary mt-3 inline-block text-sm external-link"
            >购买链接</a>
          </div>
        </div>
      </div>

      <!-- 数据来源 -->
      <div
        v-if="vps.dataSources?.length"
        class="card mt-6 p-6"
      >
        <h2 class="text-base font-semibold text-gray-900">
          数据来源
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-gray-600">
          <li
            v-for="(ds, i) in vps.dataSources"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="tag-blue">{{ ds.type }}</span>
            <span>{{ ds.name }}</span>
            <span
              v-if="ds.verifiedAt"
              class="text-xs text-gray-400"
            >核验：{{ fmtDate(ds.verifiedAt) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </div>
</template>
