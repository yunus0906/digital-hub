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
      <UButton
        to="/apps"
        color="neutral"
        variant="outline"
        class="mt-4"
      >返回列表</UButton>
    </div>

    <div v-else>
      <div class="rounded-xl border border-neutral-200 bg-white p-6">
        <div class="flex items-start gap-4">
          <span class="logo-fallback h-16 w-16 shrink-0 text-2xl">{{ app.name[0] }}</span>
          <div class="flex-1">
            <h1 class="text-2xl font-bold text-neutral-900">
              {{ app.name }}
            </h1>
            <p
              v-if="app.summary"
              class="mt-2 text-sm text-neutral-600"
            >
              {{ app.summary }}
            </p>
            <div
              v-if="app.clientApp"
              class="mt-3 flex flex-wrap gap-2 text-xs"
            >
              <UBadge
                color="primary"
                variant="subtle"
              >{{ codeStatusLabel(app.clientApp.codeStatus) }}</UBadge>
              <UBadge
                color="success"
                variant="subtle"
              >{{ priceStatusLabel(app.clientApp.priceStatus) }}</UBadge>
              <UBadge
                color="warning"
                variant="subtle"
              >{{ maintenanceLabel(app.clientApp.maintenanceStatus) }}</UBadge>
              <UBadge
                v-if="app.clientApp.licenseName"
                color="neutral"
                variant="subtle"
              >{{ app.clientApp.licenseName }}</UBadge>
            </div>
          </div>
          <div class="flex shrink-0 flex-col gap-2">
            <UButton
              v-if="app.officialUrl"
              :to="app.officialUrl"
              target="_blank"
              trailing-icon="i-lucide-arrow-up-right"
            >官网</UButton>
            <UButton
              v-if="app.clientApp?.repositoryUrl"
              :to="app.clientApp.repositoryUrl"
              target="_blank"
              color="neutral"
              variant="outline"
              trailing-icon="i-lucide-arrow-up-right"
            >仓库</UButton>
          </div>
        </div>

        <div
          v-if="app.description"
          class="mt-6 border-t border-neutral-100 pt-4"
        >
          <h2 class="mb-2 text-base font-semibold text-neutral-900">
            详细介绍
          </h2>
          <p class="whitespace-pre-wrap text-sm leading-relaxed text-neutral-700">
            {{ app.description }}
          </p>
        </div>

        <!-- 指标 -->
        <div
          v-if="app.clientApp"
          class="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              Stars
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ app.clientApp.starsCount ?? '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              Forks
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ app.clientApp.forksCount ?? '—' }}
            </p>
          </div>
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              最近 Release
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ fmtDate(app.clientApp.latestReleaseAt) }}
            </p>
          </div>
          <div class="rounded-lg bg-neutral-50 p-4">
            <p class="text-xs text-neutral-500">
              最近提交
            </p>
            <p class="mt-1 font-medium text-neutral-900">
              {{ fmtDate(app.clientApp.lastCommitAt) }}
            </p>
          </div>
        </div>
      </div>

      <!-- 平台支持 -->
      <div
        v-if="app.clientApp?.platforms?.length"
        class="mt-6 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 class="text-base font-semibold text-neutral-900">
          支持平台
        </h2>
        <div class="mt-3 flex flex-wrap gap-2">
          <UBadge
            v-for="pl in app.clientApp.platforms"
            :key="pl.code"
            color="neutral"
            variant="subtle"
          >
            {{ pl.name }}
            <span
              v-if="pl.supportStatus !== 'full'"
              class="ml-1 opacity-70"
            >（{{ compatLabel(pl.supportStatus) }}）</span>
          </UBadge>
        </div>
      </div>

      <!-- 内核兼容 -->
      <div
        v-if="app.clientApp?.coreCompat?.length"
        class="mt-6 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 class="text-base font-semibold text-neutral-900">
          内核兼容性
        </h2>
        <ul class="mt-3 space-y-2 text-sm">
          <li
            v-for="(c, i) in app.clientApp.coreCompat"
            :key="i"
            class="flex items-center gap-2"
          >
            <span class="font-medium text-neutral-900">{{ c.name }}</span>
            <UBadge
              color="primary"
              variant="subtle"
            >{{ compatLabel(c.compatibilityStatus) }}</UBadge>
            <span
              v-if="c.supportedVersionRange"
              class="text-xs text-neutral-500"
            >{{ c.supportedVersionRange }}</span>
          </li>
        </ul>
      </div>

      <!-- 版本历史 -->
      <div
        v-if="app.releases?.length"
        class="mt-6 overflow-hidden rounded-xl border border-neutral-200 bg-white"
      >
        <div class="border-b border-neutral-100 px-6 py-4">
          <h2 class="text-base font-semibold text-neutral-900">
            版本历史
          </h2>
        </div>
        <ul class="divide-y divide-neutral-100">
          <li
            v-for="r in app.releases.slice(0, 10)"
            :key="r.id"
            class="flex items-center justify-between px-6 py-3"
          >
            <div>
              <span class="font-medium text-neutral-900">v{{ r.version }}</span>
              <span class="ml-2 text-xs text-neutral-500">{{ fmtDate(r.releasedAt) }}</span>
            </div>
            <a
              v-if="r.downloadUrl"
              :href="r.downloadUrl"
              target="_blank"
              rel="noopener noreferrer"
              class="text-sm text-blue-600"
            >下载 ↗</a>
          </li>
        </ul>
      </div>

      <!-- 数据来源 -->
      <div
        v-if="app.dataSources?.length"
        class="mt-6 rounded-xl border border-neutral-200 bg-white p-6"
      >
        <h2 class="text-base font-semibold text-neutral-900">
          数据来源
        </h2>
        <ul class="mt-3 space-y-2 text-sm text-neutral-600">
          <li
            v-for="(ds, i) in app.dataSources"
            :key="i"
            class="flex items-center gap-2"
          >
            <UBadge
              color="primary"
              variant="subtle"
            >{{ ds.type }}</UBadge>
            <span>{{ ds.name }}</span>
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
