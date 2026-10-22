<script setup lang="ts">
// 机场列表页：左侧筛选侧栏 + 右侧高密度卡片流
// 筛选「即时生效」：字段变化 → 防抖同步 URL → useFetch watch 重新请求
import type { FilterField } from '~/components/FilterSidebar.vue'

const route = useRoute()

// 从 URL 同步筛选状态
const filters = reactive({
  q: (route.query.q as string) ?? '',
  trafficType: (route.query.trafficType as string) ?? '__all__',
  billingPeriod: (route.query.billingPeriod as string) ?? '__all__',
  minPrice: (route.query.minPrice as string) ?? '',
  maxPrice: (route.query.maxPrice as string) ?? '',
  minTraffic: (route.query.minTraffic as string) ?? '',
  serviceStatus: (route.query.serviceStatus as string) ?? '__all__',
  sort: (route.query.sort as string) ?? 'recommended',
  order: (route.query.order as string) ?? 'desc',
  page: Number(route.query.page ?? 1),
})

const filterFields: FilterField[] = [
  { key: 'q', label: '关键词', type: 'text', placeholder: '搜索名称/简介' },
  {
    key: 'trafficType', label: '流量类型', type: 'select',
    options: [
      { value: '__all__', label: '全部流量类型' },
      { value: 'fixed', label: '固定流量' },
      { value: 'unlimited', label: '不限量' },
      { value: 'usage_based', label: '按量计费' },
    ],
  },
  {
    key: 'billingPeriod', label: '套餐周期', type: 'select',
    options: [
      { value: '__all__', label: '全部周期' },
      { value: 'month', label: '月付' },
      { value: 'quarter', label: '季付' },
      { value: 'half_year', label: '半年付' },
      { value: 'year', label: '年付' },
    ],
  },
  {
    key: 'serviceStatus', label: '服务状态', type: 'select',
    options: [
      { value: '__all__', label: '全部状态' },
      { value: 'active', label: '正常' },
      { value: 'maintenance', label: '维护中' },
      { value: 'suspended', label: '暂停' },
      { value: 'discontinued', label: '已停运' },
    ],
  },
  { key: 'minPrice', label: '月均价下限（¥）', type: 'number', min: 0, placeholder: '0' },
  { key: 'maxPrice', label: '月均价上限（¥）', type: 'number', min: 0, placeholder: '不限' },
  { key: 'minTraffic', label: '最小月流量（GB）', type: 'number', min: 0, placeholder: '0' },
]

const sortOptions = [
  { value: 'recommended', label: '综合推荐' },
  { value: 'monthly_price', label: '月均价' },
  { value: 'recently_updated', label: '最近更新' },
]

const { scheduleApply, applyNow, goPage, resetQuery } = useListingQuery('/airports', filters)

function clearFilters() {
  filters.q = ''
  filters.trafficType = '__all__'
  filters.billingPeriod = '__all__'
  filters.minPrice = ''
  filters.maxPrice = ''
  filters.minTraffic = ''
  filters.serviceStatus = '__all__'
  filters.sort = 'recommended'
  filters.order = 'desc'
  filters.page = 1
  resetQuery()
}

// 数据请求（响应式依赖 route.query）
const { data, pending, error, refresh } = await useFetch<{ data: any[], meta: any }>('/api/v1/airports', {
  query: computed(() => route.query),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const showSkeleton = computed(() => pending.value && !data.value)

const list = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 })

// 激活筛选数量（角标）
const activeCount = computed(
  () => ['q', 'trafficType', 'billingPeriod', 'minPrice', 'maxPrice', 'minTraffic', 'serviceStatus']
    .filter(k => { const v = (filters as any)[k]; return v && v !== '__all__' }).length,
)

function formatPrice(v: number | null) {
  return v === null ? '价格待核实' : `¥${v.toFixed(2)}/月`
}

function trafficText(item: any) {
  if (item.trafficType === 'unlimited') return '不限流量'
  if (item.trafficType === 'usage_based') return '按量计费'
  return item.monthlyTrafficGb ? `${item.monthlyTrafficGb} GB/月` : '流量待核实'
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div class="mb-5">
      <h1 class="text-xl font-bold text-gray-900">
        机场订阅
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        比较订阅套餐、月流量、设备数与价格。数据均标注来源与核验时间。
      </p>
    </div>

    <div class="flex gap-6">
      <!-- 左侧筛选栏 -->
      <FilterSidebar
        :fields="filterFields"
        :model-value="filters"
        :active-count="activeCount"
        title="筛选条件"
        @update:model-value="Object.assign(filters, $event)"
        @apply="scheduleApply"
        @clear="clearFilters"
      />

      <!-- 右侧内容区 -->
      <div class="min-w-0 flex-1">
        <!-- 排序 + 结果数 -->
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
              for="sort"
              class="text-sm text-neutral-600"
            >排序</label>
            <USelect
              id="sort"
              v-model="filters.sort"
              :items="sortOptions"
              size="sm"
              @change="applyNow"
            />
            <USelect
              v-model="filters.order"
              size="sm"
              aria-label="排序方向"
              :items="[{ value: 'asc', label: '升序' }, { value: 'desc', label: '降序' }]"
              @change="applyNow"
            />
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
          <UButton
            color="neutral"
            variant="outline"
            class="mt-4"
            @click="() => refresh()"
          >
            重试
          </UButton>
        </div>
        <div
          v-else-if="list.length === 0"
          class="rounded-xl border border-dashed border-neutral-300 p-12 text-center"
        >
          <p class="text-sm text-neutral-500">
            没有符合条件的机场
          </p>
          <UButton
            v-if="activeCount > 0"
            color="neutral"
            variant="outline"
            class="mt-4"
            @click="clearFilters"
          >
            清空筛选
          </UButton>
        </div>
        <div
          v-else
          class="grid grid-cols-1 gap-3 md:grid-cols-2 2xl:grid-cols-3"
        >
          <NuxtLink
            v-for="item in list"
            :key="item.slug"
            :to="`/airports/${item.slug}`"
            class="block rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div class="flex items-start gap-2.5">
              <span class="logo-fallback h-10 w-10 shrink-0 rounded-lg text-sm">{{ item.name[0] }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="truncate text-sm font-semibold text-neutral-900">{{ item.name }}</h3>
                  <UBadge
                    v-if="item.dataStatus === 'verified'"
                    color="success"
                    variant="subtle"
                    size="sm"
                  >已核验</UBadge>
                  <UBadge
                    v-else-if="item.dataStatus === 'stale'"
                    color="warning"
                    variant="subtle"
                    size="sm"
                  >可能过期</UBadge>
                </div>
                <p
                  v-if="item.summary"
                  class="mt-0.5 line-clamp-1 text-xs text-neutral-500"
                >{{ item.summary }}</p>
              </div>
            </div>

            <div class="mt-3 flex items-end justify-between border-t border-neutral-100 pt-2.5">
              <div class="min-w-0">
                <p class="text-base font-bold text-blue-600">{{ formatPrice(item.minMonthlyPrice) }}</p>
                <p class="mt-0.5 truncate text-xs text-neutral-500">
                  {{ trafficText(item) }}<template v-if="item.deviceLimit"> · {{ item.deviceLimit }} 设备</template>
                </p>
              </div>
              <div class="shrink-0 text-right text-xs text-neutral-500">
                <p v-if="item.rating !== null">★ {{ item.rating }}（{{ item.reviewCount }}）</p>
                <p v-else>暂无评价</p>
              </div>
            </div>

            <div
              v-if="item.tags?.length"
              class="mt-2 flex flex-wrap gap-1"
            >
              <UBadge
                v-for="t in item.tags.slice(0, 3)"
                :key="t.slug"
                color="neutral"
                variant="subtle"
                size="sm"
              >{{ t.name }}</UBadge>
            </div>
          </NuxtLink>
        </div>

        <!-- 分页 -->
        <div
          v-if="meta.totalPages > 1"
          class="mt-6 flex items-center justify-center gap-2"
        >
          <UButton
            color="neutral"
            variant="outline"
            :disabled="meta.page <= 1"
            @click="goPage(meta.page - 1)"
          >
            上一页
          </UButton>
          <span class="text-sm text-neutral-600">第 {{ meta.page }} / {{ meta.totalPages }} 页</span>
          <UButton
            color="neutral"
            variant="outline"
            :disabled="meta.page >= meta.totalPages"
            @click="goPage(meta.page + 1)"
          >
            下一页
          </UButton>
        </div>
      </div>
    </div>
  </div>
</template>
