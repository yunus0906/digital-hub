<script setup lang="ts">
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

const platforms = [
  { value: '', label: '全部平台' },
  { value: 'windows', label: 'Windows' },
  { value: 'macos', label: 'macOS' },
  { value: 'linux', label: 'Linux' },
  { value: 'android', label: 'Android' },
  { value: 'ios', label: 'iOS' },
  { value: 'router', label: '路由器' },
]

const appTypes = [
  { value: '', label: '全部类型' },
  { value: 'client', label: '客户端' },
  { value: 'core', label: '内核' },
  { value: 'rules_tool', label: '规则工具' },
  { value: 'helper', label: '辅助工具' },
]

const codeStatuses = [
  { value: '', label: '全部代码状态' },
  { value: 'open_source', label: '开源' },
  { value: 'closed_source', label: '闭源' },
  { value: 'partial_source', label: '部分开源' },
  { value: 'license_unconfirmed', label: '许可证未确认' },
]

const priceStatuses = [
  { value: '', label: '全部价格' },
  { value: 'free', label: '免费' },
  { value: 'paid', label: '付费' },
  { value: 'freemium', label: '免费增值' },
]

const maintenanceStatuses = [
  { value: '', label: '全部维护状态' },
  { value: 'active', label: '活跃' },
  { value: 'low_activity', label: '低活跃' },
  { value: 'discontinued', label: '停止维护' },
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

function applyFilters() {
  filters.page = 1
  router.replace({ path: '/apps', query: buildQuery() })
}

function clearFilters() {
  Object.assign(filters, {
    q: '', platform: '', applicationType: '', codeStatus: '', priceStatus: '',
    maintenanceStatus: '', sort: 'recommended', order: 'desc', page: 1,
  })
  router.replace({ path: '/apps' })
}

function goPage(p: number) {
  filters.page = p
  router.replace({ path: '/apps', query: buildQuery() })
}

// 客户端不阻塞导航：切换路由立即渲染骨架屏，数据回来再填充
const { data, pending, error, refresh } = await useFetch<{ data: any[], meta: any }>('/api/v1/apps', {
  query: computed(() => route.query),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const showSkeleton = computed(() => pending.value && !data.value)

const list = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 })

const hasActiveFilters = computed(
  () => filters.q || filters.platform || filters.applicationType || filters.codeStatus || filters.priceStatus || filters.maintenanceStatus,
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
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        订阅客户端
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        跨平台客户端、内核与规则工具。开源状态与许可证状态分开标注。
      </p>
    </div>

    <!-- 筛选 -->
    <div class="card mb-6 p-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            for="a-q"
            class="mb-1 block text-xs font-medium text-gray-600"
          >关键词</label>
          <input
            id="a-q"
            v-model="filters.q"
            type="text"
            class="input"
            placeholder="搜索名称/简介"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="a-platform"
            class="mb-1 block text-xs font-medium text-gray-600"
          >平台</label>
          <select
            id="a-platform"
            v-model="filters.platform"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="p in platforms"
              :key="p.value"
              :value="p.value"
            >
              {{ p.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="a-type"
            class="mb-1 block text-xs font-medium text-gray-600"
          >类型</label>
          <select
            id="a-type"
            v-model="filters.applicationType"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="t in appTypes"
              :key="t.value"
              :value="t.value"
            >
              {{ t.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="a-code"
            class="mb-1 block text-xs font-medium text-gray-600"
          >代码状态</label>
          <select
            id="a-code"
            v-model="filters.codeStatus"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="c in codeStatuses"
              :key="c.value"
              :value="c.value"
            >
              {{ c.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="a-price"
            class="mb-1 block text-xs font-medium text-gray-600"
          >价格</label>
          <select
            id="a-price"
            v-model="filters.priceStatus"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="p in priceStatuses"
              :key="p.value"
              :value="p.value"
            >
              {{ p.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="a-maint"
            class="mb-1 block text-xs font-medium text-gray-600"
          >维护状态</label>
          <select
            id="a-maint"
            v-model="filters.maintenanceStatus"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="m in maintenanceStatuses"
              :key="m.value"
              :value="m.value"
            >
              {{ m.label }}
            </option>
          </select>
        </div>
        <div class="flex items-end gap-2">
          <button
            class="btn-primary flex-1"
            @click="applyFilters"
          >
            应用筛选
          </button>
          <button
            class="btn-secondary"
            @click="clearFilters"
          >
            清空
          </button>
        </div>
      </div>
    </div>

    <!-- 排序 + 结果数 -->
    <div class="mb-4 flex flex-wrap items-center justify-between gap-3">
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
          class="select"
          @change="applyFilters"
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
          class="select"
          aria-label="排序方向"
          @change="applyFilters"
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

    <!-- 列表 -->
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
        v-if="hasActiveFilters"
        class="btn-secondary mt-4"
        @click="clearFilters"
      >
        清空筛选
      </button>
    </div>
    <div
      v-else
      class="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3"
    >
      <NuxtLink
        v-for="item in list"
        :key="item.slug"
        :to="`/apps/${item.slug}`"
        class="card block p-5"
      >
        <div class="flex items-start gap-3">
          <span class="logo-fallback h-12 w-12 shrink-0 text-lg">{{ item.name[0] }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <h3 class="truncate font-semibold text-gray-900">{{ item.name }}</h3>
              <span class="tag shrink-0">{{ codeStatusLabel(item.codeStatus) }}</span>
            </div>
            <p
              v-if="item.summary"
              class="mt-1 line-clamp-2 text-xs text-gray-600"
            >{{ item.summary }}</p>
          </div>
        </div>

        <div class="mt-4 grid grid-cols-3 gap-2 border-t border-gray-100 pt-3 text-center text-xs">
          <div>
            <p class="font-semibold text-gray-900">{{ item.starsCount ?? '—' }}</p>
            <p class="text-gray-500">Stars</p>
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ item.forksCount ?? '—' }}</p>
            <p class="text-gray-500">Forks</p>
          </div>
          <div>
            <p class="font-semibold text-gray-900">{{ fmtDate(item.latestReleaseAt) }}</p>
            <p class="text-gray-500">最近 Release</p>
          </div>
        </div>

        <div
          v-if="item.platforms?.length"
          class="mt-3 flex flex-wrap gap-1"
        >
          <span
            v-for="pl in item.platforms"
            :key="pl.code"
            class="tag"
          >{{ pl.name }}</span>
        </div>
      </NuxtLink>
    </div>

    <!-- 分页 -->
    <div
      v-if="meta.totalPages > 1"
      class="mt-8 flex items-center justify-center gap-2"
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
</template>
