<script setup lang="ts">
// 订阅客户端列表页：左侧筛选侧栏 + 右侧高密度卡片流
import type { FilterField } from '~/components/FilterSidebar.vue'

const route = useRoute()
const router = useRouter()

const filters = reactive({
  q: (route.query.q as string) ?? '',
  platform: (route.query.platform as string) ?? '',
  applicationType: (route.query.applicationType as string) ?? '',
  codeStatus: (route.query.codeStatus as string) ?? '',
  priceStatus: (route.query.priceStatus as string) ?? '',
  maintenanceStatus: (route.query.maintenanceStatus as string) ?? '',
  sort: (route.query.sort as string) ?? 'recommended',
  order: (route.query.order as string) ?? 'desc',
  page: Number(route.query.page ?? 1),
})

const filterFields: FilterField[] = [
  { key: 'q', label: '关键词', type: 'text', placeholder: '搜索名称/简介' },
  {
    key: 'platform', label: '平台', type: 'select',
    options: [
      { value: '', label: '全部平台' },
      { value: 'windows', label: 'Windows' },
      { value: 'macos', label: 'macOS' },
      { value: 'linux', label: 'Linux' },
      { value: 'android', label: 'Android' },
      { value: 'ios', label: 'iOS' },
      { value: 'router', label: '路由器' },
    ],
  },
  {
    key: 'applicationType', label: '类型', type: 'select',
    options: [
      { value: '', label: '全部类型' },
      { value: 'client', label: '客户端' },
      { value: 'core', label: '内核' },
      { value: 'rules_tool', label: '规则工具' },
      { value: 'helper', label: '辅助工具' },
    ],
  },
  {
    key: 'codeStatus', label: '代码状态', type: 'select',
    options: [
      { value: '', label: '全部代码状态' },
      { value: 'open_source', label: '开源' },
      { value: 'closed_source', label: '闭源' },
      { value: 'partial_source', label: '部分开源' },
      { value: 'license_unconfirmed', label: '许可证未确认' },
    ],
  },
  {
    key: 'priceStatus', label: '价格', type: 'select',
    options: [
      { value: '', label: '全部价格' },
      { value: 'free', label: '免费' },
      { value: 'paid', label: '付费' },
      { value: 'freemium', label: '免费增值' },
    ],
  },
  {
    key: 'maintenanceStatus', label: '维护状态', type: 'select',
    options: [
      { value: '', label: '全部维护状态' },
      { value: 'active', label: '活跃' },
      { value: 'low_activity', label: '低活跃' },
      { value: 'discontinued', label: '停止维护' },
    ],
  },
]

const sortOptions = [
  { value: 'recommended', label: '综合推荐' },
  { value: 'stars', label: 'Stars' },
  { value: 'latest_release', label: '最近 Release' },
  { value: 'last_commit', label: '最近提交' },
]

function buildQuery() {
  const q: Record<string, string> = {}
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined && !(k === 'page' && v === 1)) {
      q[k] = String(v)
    }
  })
  return q
}

let timer: ReturnType<typeof setTimeout> | null = null
function scheduleApply() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(() => {
    filters.page = 1
    router.replace({ path: '/apps', query: buildQuery() })
  }, 300)
}

function clearFilters() {
  Object.assign(filters, {
    q: '', platform: '', applicationType: '', codeStatus: '', priceStatus: '',
    maintenanceStatus: '', sort: 'recommended', order: 'desc', page: 1,
  })
  router.replace({ path: '/apps' })
}

function applyNow() {
  if (timer) clearTimeout(timer)
  router.replace({ path: '/apps', query: buildQuery() })
}

function goPage(p: number) {
  filters.page = p
  router.replace({ path: '/apps', query: buildQuery() })
}

const { data, pending, error, refresh } = await useFetch<{ data: any[], meta: any }>('/api/v1/apps', {
  query: computed(() => route.query),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const showSkeleton = computed(() => pending.value && !data.value)

const list = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 })

const activeCount = computed(
  () => ['q', 'platform', 'applicationType', 'codeStatus', 'priceStatus', 'maintenanceStatus']
    .filter(k => (filters as any)[k]).length,
)

function codeStatusLabel(s: string) {
  const map: Record<string, string> = {
    open_source: '开源', closed_source: '闭源', partial_source: '部分开源',
    incomplete_source: '源码不完整', undisclosed: '未公布', license_unconfirmed: '许可证未确认',
  }
  return map[s] ?? s
}

function fmtDate(d: string | null) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('zh-CN')
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div class="mb-5">
      <h1 class="text-xl font-bold text-gray-900">
        订阅客户端
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        跨平台客户端、内核与规则工具。开源状态与许可证状态分开标注。
      </p>
    </div>

    <div class="flex gap-6">
      <FilterSidebar
        :fields="filterFields"
        :model-value="filters"
        :active-count="activeCount"
        title="筛选条件"
        @update:model-value="Object.assign(filters, $event)"
        @apply="scheduleApply"
        @clear="clearFilters"
      />

      <div class="min-w-0 flex-1">
        <div class="mb-3 flex flex-wrap items-center justify-between gap-3">
          <p class="text-sm text-gray-600">
            共 <span
              v-if="showSkeleton"
              class="skeleton inline-block h-3.5 w-8 align-middle"
            /><span
              v-else
              class="font-medium text-gray-900"
            >{{ meta.total }}</span> 个结果
          </p>
          <div class="flex items-center gap-2">
            <label
              for="a-sort"
              class="text-sm text-gray-600"
            >排序</label>
            <select
              id="a-sort"
              v-model="filters.sort"
              class="select !py-1.5 !text-[13px]"
              @change="applyNow"
            >
              <option
                v-for="s in sortOptions"
                :key="s.value"
                :value="s.value"
              >
                {{ s.label }}
              </option>
            </select>
            <select
              v-model="filters.order"
              class="select !py-1.5 !text-[13px]"
              aria-label="排序方向"
              @change="applyNow"
            >
              <option value="desc">
                降序
              </option>
              <option value="asc">
                升序
              </option>
            </select>
          </div>
        </div>

        <SkeletonList
          v-if="showSkeleton"
          :count="6"
          :columns="3"
        />
        <div
          v-else-if="error"
          class="rounded-xl border border-red-200 bg-red-50 p-12 text-center"
        >
          <p class="text-sm text-red-600">
            加载失败，请稍后重试
          </p>
          <button
            class="btn-secondary mt-4"
            @click="() => refresh()"
          >
            重试
          </button>
        </div>
        <div
          v-else-if="list.length === 0"
          class="rounded-xl border border-dashed border-gray-300 p-12 text-center"
        >
          <p class="text-sm text-gray-500">
            没有符合条件的客户端
          </p>
          <button
            v-if="activeCount > 0"
            class="btn-secondary mt-4"
            @click="clearFilters"
          >
            清空筛选
          </button>
        </div>
        <div
          v-else
          class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
        >
          <NuxtLink
            v-for="item in list"
            :key="item.slug"
            :to="`/apps/${item.slug}`"
            class="card block p-4"
          >
            <div class="flex items-start gap-2.5">
              <span class="logo-fallback h-10 w-10 shrink-0 rounded-lg text-sm">{{ item.name[0] }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="truncate text-sm font-semibold text-gray-900">{{ item.name }}</h3>
                  <span class="tag shrink-0 !px-1.5 !py-0.5 !text-[11px]">{{ codeStatusLabel(item.codeStatus) }}</span>
                </div>
                <p
                  v-if="item.summary"
                  class="mt-0.5 line-clamp-1 text-xs text-gray-500"
                >{{ item.summary }}</p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-1.5 border-t border-gray-100 pt-2.5 text-center text-xs">
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ item.starsCount ?? '—' }}</p>
                <p class="text-gray-500">Stars</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ item.forksCount ?? '—' }}</p>
                <p class="text-gray-500">Forks</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-gray-900">{{ fmtDate(item.latestReleaseAt) }}</p>
                <p class="text-gray-500">最近 Release</p>
              </div>
            </div>

            <div
              v-if="item.platforms?.length"
              class="mt-2 flex flex-wrap gap-1"
            >
              <span
                v-for="pl in item.platforms"
                :key="pl.code"
                class="tag !px-1.5 !py-0.5 !text-[11px]"
              >{{ pl.name }}</span>
            </div>
          </NuxtLink>
        </div>

        <div
          v-if="meta.totalPages > 1"
          class="mt-6 flex items-center justify-center gap-2"
        >
          <button
            class="btn-secondary"
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
          >
            上一页
          </button>
          <span class="text-sm text-gray-600">第 {{ meta.page }} / {{ meta.totalPages }} 页</span>
          <button
            class="btn-secondary"
            :disabled="meta.page >= meta.totalPages"
            @click="goPage(meta.page + 1)"
          >
            下一页
          </button>
        </div>
      </div>
    </div>
  </div>
</template>
