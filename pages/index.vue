<script setup lang="ts">
import { categoryPath, categoryLabel } from '~/composables/useCategory'

interface HomeData {
  counts: { airport: number, app: number, vps: number }
  recent: Array<{ slug: string, name: string, category: string, summary: string | null }>
  recentlyUpdated: Array<{ slug: string, name: string, category: string, summary: string | null }>
  recentPriceDrops: Array<any>
}

// 客户端导航不阻塞：服务端仍 await 取数据（首屏/SEO 不受影响），
// 客户端切换路由时立即返回，先渲染骨架屏，数据回来再填充
const { data, error, pending } = await useFetch<{ data: HomeData }>('/api/v1/home', {
  lazy: import.meta.client,
})

const homeData = computed(() => data.value?.data)
// 首次加载（无任何数据）才显示骨架屏；已有数据时刷新不闪骨架
const showSkeleton = computed(() => pending.value && !data.value)

const categories = computed(() => [
  {
    label: '机场订阅',
    desc: '比较套餐、流量与价格',
    to: '/airports',
    count: homeData.value?.counts.airport ?? 0,
  },
  {
    label: '订阅客户端',
    desc: '跨平台客户端与内核',
    to: '/apps',
    count: homeData.value?.counts.app ?? 0,
  },
  {
    label: 'VPS / 云服务器',
    desc: '厂商、地区与套餐对比',
    to: '/vps',
    count: homeData.value?.counts.vps ?? 0,
  },
  {
    label: 'AI 模型与 API',
    desc: '即将推出',
    to: '/ai',
    count: 0,
    disabled: true,
  },
])
</script>

<template>
  <div>
    <!-- 首屏 -->
    <section class="bg-gradient-to-b from-blue-50 to-slate-50">
      <div class="mx-auto max-w-7xl px-4 py-16 text-center sm:px-6 sm:py-24">
        <h1 class="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
          数字基础设施与 AI 服务
          <span class="text-blue-600">发现、比较、选型</span>
        </h1>
        <p class="mx-auto mt-4 max-w-2xl text-base text-gray-600 sm:text-lg">
          面向中文技术用户的价格比较与选型平台，覆盖机场订阅、订阅客户端、VPS / 云服务器。
          数据标注来源与核验时间，客观排序与商业合作分离。
        </p>
        <form
          class="mx-auto mt-8 flex max-w-xl gap-2"
          role="search"
          @submit.prevent="
            ($event.target as HTMLFormElement).query
              && navigateTo({ path: '/search', query: { q: ($event.target as HTMLFormElement).q.value } })
          "
        >
          <UInput
            name="q"
            type="search"
            placeholder="搜索服务、客户端、VPS…"
            aria-label="全站搜索"
            size="xl"
            class="flex-1"
          />
          <UButton
            type="submit"
            size="xl"
          >
            搜索
          </UButton>
        </form>
      </div>
    </section>

    <!-- 分类入口 -->
    <section class="mx-auto max-w-7xl px-4 py-12 sm:px-6">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <UCard
          v-for="c in categories"
          :key="c.to"
          :to="c.disabled ? undefined : c.to"
          :class="c.disabled ? 'cursor-not-allowed opacity-60' : 'hover:border-blue-300'"
        >
          <div class="flex items-center justify-between">
            <h2 class="text-lg font-semibold text-neutral-900">{{ c.label }}</h2>
            <span class="text-sm text-neutral-400">{{ c.count }} 个</span>
          </div>
          <p class="mt-2 text-sm text-neutral-600">{{ c.desc }}</p>
          <span
            v-if="c.disabled"
            class="mt-3 inline-block text-xs text-amber-600"
          >即将推出</span>
        </UCard>
      </div>
    </section>

    <!-- 最新收录 -->
    <section class="mx-auto max-w-7xl px-4 pb-12 sm:px-6">
      <div class="mb-4 flex items-center justify-between">
        <h2 class="text-xl font-semibold text-gray-900">
          最新收录
        </h2>
      </div>
      <SkeletonList
        v-if="showSkeleton"
        :count="4"
        :columns="4"
      />
      <div
        v-else-if="error"
        class="text-sm text-red-600"
      >
        加载失败，请刷新重试
      </div>
      <div
        v-else-if="!homeData?.recent?.length"
        class="rounded-xl border border-dashed border-gray-300 p-8 text-center text-sm text-gray-500"
      >
        暂无收录数据
      </div>
      <div
        v-else
        class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <UCard
          v-for="item in homeData.recent"
          :key="item.slug"
          :to="`${categoryPath(item.category)}/${item.slug}`"
        >
          <div class="flex items-center gap-3">
            <span class="logo-fallback h-10 w-10 text-sm">{{ item.name[0] }}</span>
            <div class="min-w-0">
              <p class="truncate font-medium text-neutral-900">{{ item.name }}</p>
              <p class="text-xs text-neutral-500">{{ categoryLabel(item.category) }}</p>
            </div>
          </div>
          <p
            v-if="item.summary"
            class="mt-2 line-clamp-2 text-xs text-neutral-600"
          >
            {{ item.summary }}
          </p>
        </UCard>
      </div>
    </section>

    <!-- 数据可信度说明 -->
    <section class="border-t border-gray-100 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <h2 class="text-lg font-semibold text-gray-900">
          数据可信度说明
        </h2>
        <div class="mt-4 grid gap-4 text-sm text-gray-600 sm:grid-cols-3">
          <div class="rounded-lg bg-slate-50 p-4">
            <h3 class="font-medium text-gray-900">
              来源可追溯
            </h3>
            <p class="mt-1 text-xs">
              价格、评分、Stars 等动态数据均记录来源 URL 与核验时间。
            </p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <h3 class="font-medium text-gray-900">
              客观与商业分离
            </h3>
            <p class="mt-1 text-xs">
              赞助与广告明确标识，不改变客观价格排序。
            </p>
          </div>
          <div class="rounded-lg bg-slate-50 p-4">
            <h3 class="font-medium text-gray-900">
              过期不等于错误
            </h3>
            <p class="mt-1 text-xs">
              数据超期会标注「可能过期」，但不自动删除。
            </p>
          </div>
        </div>
      </div>
    </section>
  </div>
</template>
