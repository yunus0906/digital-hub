<script setup lang="ts">
// 订阅客户端列表页：左侧筛选侧栏 + 右侧高密度卡片流
import type { FilterField } from '~/components/FilterSidebar.vue'

const route = useRoute()

const filters = reactive({
  q: (route.query.q as string) ?? '',
  platform: (route.query.platform as string) ?? '__all__',
  applicationType: (route.query.applicationType as string) ?? '__all__',
  codeStatus: (route.query.codeStatus as string) ?? '__all__',
  priceStatus: (route.query.priceStatus as string) ?? '__all__',
  maintenanceStatus: (route.query.maintenanceStatus as string) ?? '__all__',
  sort: (route.query.sort as string) ?? 'recommended',
  order: (route.query.order as string) ?? 'desc',
  page: Number(route.query.page ?? 1),
})

const filterFields: FilterField[] = [
  { key: 'q', label: '关键词', type: 'text', placeholder: '搜索名称/简介' },
  {
    key: 'platform', label: '平台', type: 'select',
    options: [
      { value: '__all__', label: '全部平台' },
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
      { value: '__all__', label: '全部类型' },
      { value: 'client', label: '客户端' },
      { value: 'core', label: '内核' },
      { value: 'rules_tool', label: '规则工具' },
      { value: 'helper', label: '辅助工具' },
    ],
  },
  {
    key: 'codeStatus', label: '代码状态', type: 'select',
    options: [
      { value: '__all__', label: '全部代码状态' },
      { value: 'open_source', label: '开源' },
      { value: 'closed_source', label: '闭源' },
      { value: 'partial_source', label: '部分开源' },
      { value: 'license_unconfirmed', label: '许可证未确认' },
    ],
  },
  {
    key: 'priceStatus', label: '价格', type: 'select',
    options: [
      { value: '__all__', label: '全部价格' },
      { value: 'free', label: '免费' },
      { value: 'paid', label: '付费' },
      { value: 'freemium', label: '免费增值' },
    ],
  },
  {
    key: 'maintenanceStatus', label: '维护状态', type: 'select',
    options: [
      { value: '__all__', label: '全部维护状态' },
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

const { scheduleApply, applyNow, goPage, resetQuery } = useListingQuery('/apps', filters)

function clearFilters() {
  Object.assign(filters, {
    q: '', platform: '__all__', applicationType: '__all__', codeStatus: '__all__', priceStatus: '__all__',
    maintenanceStatus: '__all__', sort: 'recommended', order: 'desc', page: 1,
  })
  resetQuery()
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
    .filter(k => { const v = (filters as any)[k]; return v && v !== '__all__' }).length,
)

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
              class="text-sm text-neutral-600"
            >排序</label>
            <USelect
              id="a-sort"
              v-model="filters.sort"
              :items="sortOptions"
              size="sm"
              @change="applyNow"
            />
            <USelect
              v-model="filters.order"
              size="sm"
              aria-label="排序方向"
              :items="[{ value: 'desc', label: '降序' }, { value: 'asc', label: '升序' }]"
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
            没有符合条件的客户端
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
            :to="`/apps/${item.slug}`"
            class="block rounded-xl border border-neutral-200 bg-white p-4 transition-shadow hover:shadow-md"
          >
            <div class="flex items-start gap-2.5">
              <span class="logo-fallback h-10 w-10 shrink-0 rounded-lg text-sm">{{ item.name[0] }}</span>
              <div class="min-w-0 flex-1">
                <div class="flex items-center justify-between gap-2">
                  <h3 class="truncate text-sm font-semibold text-neutral-900">{{ item.name }}</h3>
                  <UBadge
                    color="neutral"
                    variant="subtle"
                    size="sm"
                  >{{ codeStatusLabel(item.codeStatus) }}</UBadge>
                </div>
                <p
                  v-if="item.summary"
                  class="mt-0.5 line-clamp-1 text-xs text-neutral-500"
                >{{ item.summary }}</p>
              </div>
            </div>

            <div class="mt-3 grid grid-cols-3 gap-1.5 border-t border-neutral-100 pt-2.5 text-center text-xs">
              <div>
                <p class="text-sm font-semibold text-neutral-900">{{ item.starsCount ?? '—' }}</p>
                <p class="text-neutral-500">Stars</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-neutral-900">{{ item.forksCount ?? '—' }}</p>
                <p class="text-neutral-500">Forks</p>
              </div>
              <div>
                <p class="text-sm font-semibold text-neutral-900">{{ fmtDate(item.latestReleaseAt) }}</p>
                <p class="text-neutral-500">最近 Release</p>
              </div>
            </div>

            <div
              v-if="item.platforms?.length"
              class="mt-2 flex flex-wrap gap-1"
            >
              <UBadge
                v-for="pl in item.platforms"
                :key="pl.code"
                color="neutral"
                variant="subtle"
                size="sm"
              >{{ pl.name }}</UBadge>
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
