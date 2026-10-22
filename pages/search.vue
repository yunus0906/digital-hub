<script setup lang="ts">
import { categoryLabel, categoryPath } from '~/composables/useCategory'

const route = useRoute()
const q = computed(() => (route.query.q as string) ?? '')

// 客户端不阻塞导航：立即渲染骨架屏，数据回来再填充
const { data, pending, error } = await useFetch<{ data: any[], meta: any }>('/api/v1/search', {
  query: computed(() => ({ q: q.value, page: route.query.page ?? 1 })),
  watch: [() => route.query],
  lazy: import.meta.client,
})

const results = computed(() => data.value?.data ?? [])
const meta = computed(() => data.value?.meta ?? { total: 0 })
const showSkeleton = computed(() => pending.value && !data.value)

useHead(() => ({ title: `搜索 ${q.value} - DigitalHub` }))
</script>

<template>
  <div class="mx-auto max-w-4xl px-4 py-8 sm:px-6">
    <h1 class="text-2xl font-bold text-gray-900">
      搜索结果
    </h1>
    <p class="mt-1 text-sm text-gray-600">
      <template v-if="q">
        「{{ q }}」共 <span
          v-if="showSkeleton"
          class="skeleton inline-block h-3.5 w-8 align-middle"
        /><span v-else>{{ meta.total }}</span> 个结果
      </template>
      <template v-else>
        请输入搜索词
      </template>
    </p>

    <div
      v-if="!q"
      class="mt-8 rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500"
    >
      在上方搜索框输入关键词
    </div>
    <div
      v-else-if="showSkeleton"
      class="mt-6"
    >
      <SkeletonList
        :count="4"
        :columns="1"
      />
    </div>
    <div
      v-else-if="error"
      class="mt-8 text-sm text-red-600"
    >
      搜索失败，请重试
    </div>
    <div
      v-else-if="results.length === 0"
      class="mt-8 rounded-xl border border-dashed border-gray-300 p-12 text-center text-sm text-gray-500"
    >
      没有找到匹配的结果
    </div>
    <div
      v-else
      class="mt-6 space-y-3"
    >
      <NuxtLink
        v-for="item in results"
        :key="item.slug"
        :to="`${categoryPath(item.category)}/${item.slug}`"
        class="card block p-4"
      >
        <div class="flex items-center gap-3">
          <span class="logo-fallback h-10 w-10 shrink-0 text-sm">{{ item.name[0] }}</span>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <p class="truncate font-medium text-gray-900">{{ item.name }}</p>
              <span class="tag shrink-0">{{ categoryLabel(item.category) }}</span>
            </div>
            <p
              v-if="item.summary"
              class="mt-1 line-clamp-1 text-xs text-gray-600"
            >{{ item.summary }}</p>
          </div>
        </div>
      </NuxtLink>
    </div>
  </div>
</template>
