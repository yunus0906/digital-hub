<script setup lang="ts">
const route = useRoute()
const slug = computed(() => route.params.slug as string)

// 客户端不阻塞导航：立即渲染骨架屏；watch slug 保证同路由换参数时重新请求
const { data, pending, error } = await useFetch<{ data: any }>(`/api/v1/apps/${slug.value}`, {
  lazy: import.meta.client,
  watch: [slug],
})
const app = computed(() => data.value?.data)
const showSkeleton = computed(() => pending.value && !data.value)

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}

function codeStatusLabel(s: string) {
  const map: Record<string, string> = {
    open_source: '开源', closed_source: '闭源', partial_source: '部分开源',
    incomplete_source: '源码不完整', undisclosed: '未公布', license_unconfirmed: '许可证未确认',
  }
  return map[s] ?? s
}

function priceStatusLabel(s: string) {
  const map: Record<string, string> = { free: '免费', paid: '付费', freemium: '免费增值', unknown: '待核实' }
  return map[s] ?? s
}

function maintenanceLabel(s: string) {
  const map: Record<string, string> = { active: '活跃', low_activity: '低活跃', discontinued: '停止维护', unknown: '未知' }
  return map[s] ?? s
}

function compatLabel(s: string) {
  const map: Record<string, string> = { full: '完整支持', partial: '部分支持', planned: '规划中', unknown: '未知' }
  return map[s] ?? s
}

useHead(() => ({
  title: app.value ? `${app.value.name} - 订阅客户端 - DigitalHub` : '客户端详情',
  meta: [{ name: 'description', content: app.value?.summary ?? '订阅客户端详情' }],
}))
</script>

<template>
  <div class="mx-auto max-w-5xl px-4 py-8 sm:px-6">
    <SkeletonDetail v-if="showSkeleton" />
    <div
      v-else-if="error || !app"
      class="py-16 text-center"
    >
      <p class="text-sm text-red-600">
        未找到该客户端
      </p>
      <NuxtLink
        to="/apps"
        class="btn-secondary mt-4 inline-block"
      >返回列表</NuxtLink>
    </div>

    <div v-else>
      <div class="card p-6">
        <div class="flex items-start gap-4">
          <span class="logo-fallback h-16 w-16 shrink-0 text-2xl">{{ app.name[0] }}</span>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-gray-900">
              {{ app.name }}
            </h1>
            <p
              v-if="app.summary"
              class="mt-2 text-sm text-gray-600"
            >
              {{ app.summary }}
            </p>
            <div
              v-if="app.clientApp"
              class="mt-3 flex flex-wrap gap-2 text-xs"
            >
              <span class="tag-blue">{{ codeStatusLabel(app.clientApp.codeStatus) }}</span>
              <span class="tag-green">{{ priceStatusLabel(app.clientApp.priceStatus) }}</span>
              <span class="tag-amber">{{ maintenanceLabel(app.clientApp.maintenanceStatus) }}</span>
              <span
                v-if="app.clientApp.licenseName"
                class="tag"
              >{{ app.clientApp.licenseName }}</span>
            </div>
          </div>
          <div class="flex shrink-0 flex-col gap-2">
            <a
              v-if="app.officialUrl"
              :href="app.officialUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-primary external-link"
            >官网</a>
            <a
              v-if="app.clientApp?.repositoryUrl"
              :href="app.clientApp.repositoryUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="btn-secondary external-link"
            >仓库</a>
          </div>
        </div>

        <div
          v-if="app.description"
          class="mt-6 border-t border-gray-100 pt-4"
        >
          <h2 class="mb-2 text-base font-semibold text-gray-900">
            详细介绍
          </h2>
          <p class="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
            {{ app.description }}
          </p>
        </div>

        <!-- 指标 -->
        <div
          v-if="app.clientApp"
          class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs text-gray-500">
              Stars
            </p>
            <p class="mt-1 font-medium text-gray-900">
              {{ app.clientApp.starsCount ?? '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs text-gray-500">
              Forks
            </p>
            <p class="mt-1 font-medium text-gray-900">
              {{ app.clientApp.forksCount ?? '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs text-gray-500">
              最近 Release
            </p>
            <p class="mt-1 font-medium text-gray-900">
              {{ fmtDate(app.clientApp.latestReleaseAt) }}
            </p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <p class="text-xs text-gray-500">
              最近提交
            </p>
            <p class="mt-1 font-medium text-gray-900">
              {{ fmtDate(app.clientApp.lastCommitAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 平台支持 -->
      <div
        v-if="app.clientApp?.platforms?.length"
        class="card mt-6 p-6"
      >
        <h2 class="text-base font-semibold text-gray-900">
          支持平台
        </h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <span
            v-for="pl in app.clientApp.platforms"
            :key="pl.code"
            class="tag"
          >
            {{ pl.name }}
            <span
              v-if="pl.supportStatus !== 'full'"
              class="ml-1 text-gray-400"
            >（{{ compatLabel(pl.supportStatus) }}）</span>
          </span>
        </div>
      </div>

      <!-- 内核兼容 -->
      <div
        v-if="app.clientApp?.coreCompat?.length"
        class="card mt-6 p-6"
      >
        <h2 class="text-base font-semibold text-gray-900">
          内核兼容性
        </h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li
            v-for="(c, i) in app.clientApp.coreCompat"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="font-medium text-gray-900">{{ c.name }}</span>
            <span class="tag-blue">{{ compatLabel(c.compatibilityStatus) }}</span>
            <span
              v-if="c.supportedVersionRange"
              class="text-xs text-gray-500"
            >{{ c.supportedVersionRange }}</span>
          </li>
        </ul>
      </div>

      <!-- 版本历史 -->
      <div
        v-if="app.releases?.length"
        class="card mt-6 overflow-hidden"
      >
        <div class="border-b border-gray-100 px-6 py-4">
          <h2 class="text-base font-semibold text-gray-900">
            版本历史
          </h2>
        </div>
        <ul class="divide-y divide-gray-100">
          <li
            v-for="r in app.releases.slice(0, 10)"
            :key="r.id"
            class="flex items-center justify-between px-6 py-3"
          >
            <div>
              <span class="font-medium text-gray-900">v{{ r.version }}</span>
              <span class="ml-2 text-xs text-gray-500">{{ fmtDate(r.releasedAt) }}</span>
            </div>
            <a
              v-if="r.downloadUrl"
              :href="r.downloadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-600 external-link"
            >下载</a>
          </li>
        </ul>
      </div>

      <!-- 数据来源 -->
      <div
        v-if="app.dataSources?.length"
        class="card mt-6 p-6"
      >
        <h2 class="text-base font-semibold text-gray-900">
          数据来源
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-gray-600">
          <li
            v-for="(ds, i) in app.dataSources"
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
