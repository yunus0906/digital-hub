<script setup lang="ts">
// VPS 列表页：左侧筛选侧栏 + 右侧高密度卡片流
import type { FilterField } from '~/components/FilterSidebar.vue'

const route = useRoute()

const filters = reactive({
  q: (route.query.q as string) ?? '',
  countryCode: (route.query.countryCode as string) ?? '',
  productType: (route.query.productType as string) ?? '__all__',
  minMemory: (route.query.minMemory as string) ?? '',
  minVcpu: (route.query.minVcpu as string) ?? '',
  minPrice: (route.query.minPrice as string) ?? '',
  maxPrice: (route.query.maxPrice as string) ?? '',
  sort: (route.query.sort as string) ?? 'recommended',
  order: (route.query.order as string) ?? 'desc',
  page: Number(route.query.page ?? 1),
})

const filterFields: FilterField[] = [
  { key: 'q', label: '关键词', type: 'text', placeholder: '搜索厂商/产品' },
  {
    key: 'productType', label: '产品类型', type: 'select',
    options: [
      { value: '__all__', label: '全部类型' },
      { value: 'vps', label: 'VPS' },
      { value: 'cloud_vm', label: '云主机' },
      { value: 'dedicated_server', label: '独立服务器' },
      { value: 'gpu_server', label: 'GPU 服务器' },
    ],
  },
  { key: 'countryCode', label: '国家代码', type: 'text', placeholder: '如 US / HK / SG' },
  { key: 'minMemory', label: '最小内存（MB）', type: 'number', min: 0, placeholder: '0' },
  { key: 'minVcpu', label: '最小 vCPU', type: 'number', min: 0, placeholder: '0' },
  { key: 'minPrice', label: '月均价下限（¥）', type: 'number', min: 0, placeholder: '0' },
  { key: 'maxPrice', label: '月均价上限（¥）', type: 'number', min: 0, placeholder: '不限' },
]

const sortOptions = [
  { value: 'recommended', label: '综合推荐' },
  { value: 'monthly_price', label: '月均价' },
  { value: 'memory', label: '内存' },
  { value: 'bandwidth', label: '带宽' },
]

const { scheduleApply, applyNow, goPage, resetQuery } = useListingQuery('/vps', filters)

function clearFilters() {
  Object.assign(filters, {
    q: '', countryCode: '', productType: '__all__', minMemory: '', minVcpu: '',
    minPrice: '', maxPrice: '', sort: 'recommended', order: 'desc', page: 1,
  })
  resetQuery()
}

const { data, pending, error, refresh } = await useFetch<{ data: any[], meta: any }>('/api/v1/vps', {
  query: computed(() => route.query),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const showSkeleton = computed(() => pending.value && !data.value)

const list = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 })

const activeCount = computed(
  () => ['q', 'countryCode', 'productType', 'minMemory', 'minVcpu', 'minPrice', 'maxPrice']
    .filter(k => { const v = (filters as any)[k]; return v && v !== '__all__' }).length,
)

function fmtPrice(v: number | null) {
  return v === null ? '价格待核实' : `¥${v.toFixed(2)}/月`
}

</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-6 sm:px-6">
    <div class="mb-5">
      <h1 class="text-xl font-bold text-gray-900">
        VPS / 云服务器
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        按厂商、地区与配置比较套餐。价格与规格均标注来源。
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
            >{{ meta.total }}</span> 个套餐
          </p>
          <div class="flex items-center gap-2">
            <label
              for="v-sort"
              class="text-sm text-neutral-600"
            >排序</label>
            <USelect
              id="v-sort"
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
            没有符合条件的套餐
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
            :key="item.planId"
            :to="`/vps/${item.productSlug}`"
            class="block rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div class="flex items-center justify-between">
              <h3 class="truncate text-sm font-semibold text-gray-900">{{ item.planName }}</h3>
              <span
                v-if="item.vendorName"
                class="shrink-0 text-xs text-gray-500"
              >{{ item.vendorName }}</span>
            </div>
            <p
              v-if="item.location"
              class="mt-0.5 truncate text-xs text-gray-500"
            >
              {{ item.location.countryName }}
              <template v-if="item.location.city"> · {{ item.location.city }}</template>
              <template v-if="item.location.datacenterName"> · {{ item.location.datacenterName }}</template>
            </p>

            <div class="mt-2.5 text-base font-bold text-blue-600">{{ fmtPrice(item.monthlyPrice) }}</div>

            <div class="mt-2.5 grid grid-cols-4 gap-1.5 text-center text-xs">
              <div class="rounded bg-slate-50 py-1.5">
                <p class="text-gray-500">vCPU</p>
                <p class="font-medium text-gray-900">{{ item.vcpuCount ?? '—' }}</p>
              </div>
              <div class="rounded bg-slate-50 py-1.5">
                <p class="text-gray-500">内存</p>
                <p class="font-medium text-gray-900">{{ fmtMem(item.memoryMb) }}</p>
              </div>
              <div class="rounded bg-slate-50 py-1.5">
                <p class="text-gray-500">存储</p>
                <p class="font-medium text-gray-900">{{ item.storageGb ? `${item.storageGb} GB` : '—' }}</p>
              </div>
              <div class="rounded bg-slate-50 py-1.5">
                <p class="text-gray-500">带宽</p>
                <p class="font-medium text-gray-900">{{ item.bandwidthMbps ? `${item.bandwidthMbps} Mbps` : '—' }}</p>
              </div>
            </div>
          </NuxtLink>
        </div>

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
