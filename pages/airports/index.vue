<script setup lang="ts">
// 机场列表页：筛选、排序、分页、URL 查询参数同步
const route = useRoute()
const router = useRouter()

// 从 URL 同步筛选状态
const filters = reactive({
  q: (route.query.q as string) ?? '',
  trafficType: (route.query.trafficType as string) ?? '',
  billingPeriod: (route.query.billingPeriod as string) ?? '',
  minPrice: (route.query.minPrice as string) ?? '',
  maxPrice: (route.query.maxPrice as string) ?? '',
  minTraffic: (route.query.minTraffic as string) ?? '',
  serviceStatus: (route.query.serviceStatus as string) ?? '',
  sort: (route.query.sort as string) ?? 'recommended',
  order: (route.query.order as string) ?? 'desc',
  page: Number(route.query.page ?? 1),
})

const trafficTypes = [
  { value: '', label: '全部流量类型' },
  { value: 'fixed', label: '固定流量' },
  { value: 'unlimited', label: '不限量' },
  { value: 'usage_based', label: '按量计费' },
]

const billingPeriods = [
  { value: '', label: '全部周期' },
  { value: 'month', label: '月付' },
  { value: 'quarter', label: '季付' },
  { value: 'half_year', label: '半年付' },
  { value: 'year', label: '年付' },
]

const sortOptions = [
  { value: 'recommended', label: '综合推荐' },
  { value: 'monthly_price', label: '月均价' },
  { value: 'recently_updated', label: '最近更新' },
]

const serviceStatuses = [
  { value: '', label: '全部状态' },
  { value: 'active', label: '正常' },
  { value: 'maintenance', label: '维护中' },
  { value: 'suspended', label: '暂停' },
  { value: 'discontinued', label: '已停运' },
]

// 构建查询参数
function buildQuery() {
  const q: Record<string, string> = {}
  Object.entries(filters).forEach(([k, v]) => {
    if (v !== '' && v !== null && v !== undefined && v !== 1) {
      q[k] = String(v)
    }
    if (k === 'page' && v !== 1 && v) q[k] = String(v)
  })
  return q
}

// 筛选变化时同步 URL 并重新请求
async function applyFilters() {
  filters.page = 1
  await router.replace({ path: '/airports', query: buildQuery() })
}

function clearFilters() {
  filters.q = ''
  filters.trafficType = ''
  filters.billingPeriod = ''
  filters.minPrice = ''
  filters.maxPrice = ''
  filters.minTraffic = ''
  filters.serviceStatus = ''
  filters.sort = 'recommended'
  filters.order = 'desc'
  filters.page = 1
  router.replace({ path: '/airports' })
}

// 分页
function goPage(p: number) {
  filters.page = p
  router.replace({ path: '/airports', query: buildQuery() })
}

// 数据请求（响应式依赖 route.query）
// 客户端不阻塞导航：切换路由立即渲染骨架屏，数据回来再填充
const { data, pending, error, refresh } = await useFetch<{ data: any[], meta: any }>('/api/v1/airports', {
  query: computed(() => route.query),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const showSkeleton = computed(() => pending.value && !data.value)

const list = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 })

// 折价显示
function formatPrice(v: number | null) {
  return v === null ? '价格待核实' : `¥${v.toFixed(2)}/月`
}

const hasActiveFilters = computed(
  () =>
    filters.q
    || filters.trafficType
    || filters.billingPeriod
    || filters.minPrice
    || filters.maxPrice
    || filters.minTraffic
    || filters.serviceStatus,
)
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        机场订阅
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        比较订阅套餐、月流量、设备数与价格。数据均标注来源与核验时间。
      </p>
    </div>

    <!-- 筛选栏 -->
    <div class="card mb-6 p-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            for="f-q"
            class="mb-1 block text-xs font-medium text-gray-600"
          >关键词</label>
          <input
            id="f-q"
            v-model="filters.q"
            type="text"
            class="input"
            placeholder="搜索名称/简介"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="f-traffic"
            class="mb-1 block text-xs font-medium text-gray-600"
          >流量类型</label>
          <select
            id="f-traffic"
            v-model="filters.trafficType"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="t in trafficTypes"
              :key="t.value"
              :value="t.value"
            >
              {{ t.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="f-period"
            class="mb-1 block text-xs font-medium text-gray-600"
          >套餐周期</label>
          <select
            id="f-period"
            v-model="filters.billingPeriod"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="p in billingPeriods"
              :key="p.value"
              :value="p.value"
            >
              {{ p.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="f-status"
            class="mb-1 block text-xs font-medium text-gray-600"
          >服务状态</label>
          <select
            id="f-status"
            v-model="filters.serviceStatus"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="s in serviceStatuses"
              :key="s.value"
              :value="s.value"
            >
              {{ s.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="f-minprice"
            class="mb-1 block text-xs font-medium text-gray-600"
          >月均价下限（¥）</label>
          <input
            id="f-minprice"
            v-model="filters.minPrice"
            type="number"
            min="0"
            class="input"
            placeholder="0"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="f-maxprice"
            class="mb-1 block text-xs font-medium text-gray-600"
          >月均价上限（¥）</label>
          <input
            id="f-maxprice"
            v-model="filters.maxPrice"
            type="number"
            min="0"
            class="input"
            placeholder="不限"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="f-mintraffic"
            class="mb-1 block text-xs font-medium text-gray-600"
          >最小月流量（GB）</label>
          <input
            id="f-mintraffic"
            v-model="filters.minTraffic"
            type="number"
            min="0"
            class="input"
            placeholder="0"
            @keyup.enter="applyFilters"
          >
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
        <span
          v-if="hasActiveFilters"
          class="ml-2 text-xs text-blue-600"
        >已应用筛选</span>
      </p>
      <div class="flex items-center gap-2">
        <label
          for="sort"
          class="text-sm text-gray-600"
        >排序</label>
        <select
          id="sort"
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
          <option value="asc">
            升序
          </option>
          <option value="desc">
            降序
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
        没有符合条件的机场
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
        :to="`/airports/${item.slug}`"
        class="card block p-5"
      >
        <div class="flex items-start gap-3">
          <span class="logo-fallback h-12 w-12 shrink-0 text-lg">{{ item.name[0] }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center justify-between gap-2">
              <h3 class="truncate font-semibold text-gray-900">{{ item.name }}</h3>
              <span
                v-if="item.dataStatus === 'verified'"
                class="badge-verified shrink-0"
              >已核验</span>
              <span
                v-else-if="item.dataStatus === 'stale'"
                class="badge-stale shrink-0"
              >可能过期</span>
            </div>
            <p
              v-if="item.summary"
              class="mt-1 line-clamp-2 text-xs text-gray-600"
            >{{ item.summary }}</p>
          </div>
        </div>

        <div class="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
          <div>
            <p class="text-lg font-bold text-blue-600">{{ formatPrice(item.minMonthlyPrice) }}</p>
            <p class="text-xs text-gray-500">
              {{
                item.trafficType === 'unlimited'
                  ? '不限流量'
                  : item.trafficType === 'usage_based'
                    ? '按量计费'
                    : item.monthlyTrafficGb
                      ? `${item.monthlyTrafficGb} GB/月`
                      : '流量待核实'
              }}
              <template v-if="item.deviceLimit"> · {{ item.deviceLimit }} 设备</template>
            </p>
          </div>
          <div class="text-right text-xs text-gray-500">
            <p v-if="item.rating !== null">★ {{ item.rating }}（{{ item.reviewCount }}）</p>
            <p v-else>暂无评价</p>
          </div>
        </div>

        <div
          v-if="item.tags?.length"
          class="mt-3 flex flex-wrap gap-1"
        >
          <span
            v-for="t in item.tags.slice(0, 3)"
            :key="t.slug"
            class="tag"
          >{{ t.name }}</span>
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
