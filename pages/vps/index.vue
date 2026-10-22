<script setup lang="ts">
const route = useRoute()
const router = useRouter()

const filters = reactive({
  q: (route.query.q as string) ?? '',
  countryCode: (route.query.countryCode as string) ?? '',
  productType: (route.query.productType as string) ?? '',
  minMemory: (route.query.minMemory as string) ?? '',
  minVcpu: (route.query.minVcpu as string) ?? '',
  minPrice: (route.query.minPrice as string) ?? '',
  maxPrice: (route.query.maxPrice as string) ?? '',
  sort: (route.query.sort as string) ?? 'recommended',
  order: (route.query.order as string) ?? 'desc',
  page: Number(route.query.page ?? 1),
})

const productTypes = [
  { value: '', label: '全部类型' },
  { value: 'vps', label: 'VPS' },
  { value: 'cloud_vm', label: '云主机' },
  { value: 'dedicated_server', label: '独立服务器' },
  { value: 'gpu_server', label: 'GPU 服务器' },
]

const sortOptions = [
  { value: 'recommended', label: '综合推荐' },
  { value: 'monthly_price', label: '月均价' },
  { value: 'memory', label: '内存' },
  { value: 'bandwidth', label: '带宽' },
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
  router.replace({ path: '/vps', query: buildQuery() })
}

function clearFilters() {
  Object.assign(filters, {
    q: '', countryCode: '', productType: '', minMemory: '', minVcpu: '',
    minPrice: '', maxPrice: '', sort: 'recommended', order: 'desc', page: 1,
  })
  router.replace({ path: '/vps' })
}

function goPage(p: number) {
  filters.page = p
  router.replace({ path: '/vps', query: buildQuery() })
}

// 客户端不阻塞导航：切换路由立即渲染骨架屏，数据回来再填充
const { data, pending, error, refresh } = await useFetch<{ data: any[], meta: any }>('/api/v1/vps', {
  query: computed(() => route.query),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const showSkeleton = computed(() => pending.value && !data.value)

const list = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { page: 1, pageSize: 20, total: 0, totalPages: 0 })

const hasActiveFilters = computed(
  () => filters.q || filters.countryCode || filters.productType || filters.minMemory || filters.minVcpu || filters.minPrice || filters.maxPrice,
)

function fmtPrice(v: number | null) {
  return v === null ? '价格待核实' : `¥${v.toFixed(2)}/月`
}

function fmtMem(mb: number | null) {
  if (mb === null) return '—'
  return mb >= 1024 ? `${(mb / 1024).toFixed(1)} GB` : `${mb} MB`
}
</script>

<template>
  <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
    <div class="mb-6">
      <h1 class="text-2xl font-bold text-gray-900">
        VPS / 云服务器
      </h1>
      <p class="mt-1 text-sm text-gray-600">
        按厂商、地区与配置比较套餐。价格与规格均标注来源。
      </p>
    </div>

    <!-- 筛选 -->
    <div class="card mb-6 p-4">
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <label
            for="v-q"
            class="mb-1 block text-xs font-medium text-gray-600"
          >关键词</label>
          <input
            id="v-q"
            v-model="filters.q"
            type="text"
            class="input"
            placeholder="搜索厂商/产品"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="v-type"
            class="mb-1 block text-xs font-medium text-gray-600"
          >产品类型</label>
          <select
            id="v-type"
            v-model="filters.productType"
            class="select w-full"
            @change="applyFilters"
          >
            <option
              v-for="t in productTypes"
              :key="t.value"
              :value="t.value"
            >
              {{ t.label }}
            </option>
          </select>
        </div>
        <div>
          <label
            for="v-country"
            class="mb-1 block text-xs font-medium text-gray-600"
          >国家代码</label>
          <input
            id="v-country"
            v-model="filters.countryCode"
            type="text"
            class="input"
            placeholder="如 US / HK / SG"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="v-minmem"
            class="mb-1 block text-xs font-medium text-gray-600"
          >最小内存（MB）</label>
          <input
            id="v-minmem"
            v-model="filters.minMemory"
            type="number"
            min="0"
            class="input"
            placeholder="0"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="v-minvcpu"
            class="mb-1 block text-xs font-medium text-gray-600"
          >最小 vCPU</label>
          <input
            id="v-minvcpu"
            v-model="filters.minVcpu"
            type="number"
            min="0"
            class="input"
            placeholder="0"
            @keyup.enter="applyFilters"
          >
        </div>
        <div>
          <label
            for="v-minprice"
            class="mb-1 block text-xs font-medium text-gray-600"
          >月均价下限（¥）</label>
          <input
            id="v-minprice"
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
            for="v-maxprice"
            class="mb-1 block text-xs font-medium text-gray-600"
          >月均价上限（¥）</label>
          <input
            id="v-maxprice"
            v-model="filters.maxPrice"
            type="number"
            min="0"
            class="input"
            placeholder="不限"
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
        >{{ meta.total }}</span> 个套餐
      </p>
      <div class="flex items-center gap-2">
        <label
          for="v-sort"
          class="text-sm text-gray-600"
        >排序</label>
        <select
          id="v-sort"
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
        没有符合条件的套餐
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
        :key="item.planId"
        :to="`/vps/${item.productSlug}`"
        class="card block p-5"
      >
        <div class="flex items-center justify-between">
          <h3 class="font-semibold text-gray-900">{{ item.planName }}</h3>
          <span
            v-if="item.vendorName"
            class="text-xs text-gray-500"
          >{{ item.vendorName }}</span>
        </div>
        <p
          v-if="item.location"
          class="mt-1 text-xs text-gray-500"
        >
          {{ item.location.countryName }}
          <template v-if="item.location.city"> · {{ item.location.city }}</template>
          <template v-if="item.location.datacenterName"> · {{ item.location.datacenterName }}</template>
        </p>

        <div class="mt-3 text-lg font-bold text-blue-600">{{ fmtPrice(item.monthlyPrice) }}</div>

        <div class="mt-3 grid grid-cols-2 gap-2 text-xs">
          <div class="rounded bg-slate-50 p-2">
            <span class="text-gray-500">vCPU</span>
            <span class="float-right font-medium text-gray-900">{{ item.vcpuCount ?? '—' }}</span>
          </div>
          <div class="rounded bg-slate-50 p-2">
            <span class="text-gray-500">内存</span>
            <span class="float-right font-medium text-gray-900">{{ fmtMem(item.memoryMb) }}</span>
          </div>
          <div class="rounded bg-slate-50 p-2">
            <span class="text-gray-500">存储</span>
            <span class="float-right font-medium text-gray-900">{{ item.storageGb ? `${item.storageGb} GB` : '—' }}</span>
          </div>
          <div class="rounded bg-slate-50 p-2">
            <span class="text-gray-500">带宽</span>
            <span class="float-right font-medium text-gray-900">{{ item.bandwidthMbps ? `${item.bandwidthMbps} Mbps` : '—' }}</span>
          </div>
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
