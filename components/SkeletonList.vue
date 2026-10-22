<script setup lang="ts">
// 列表类页面的通用骨架屏（卡片网格）
// 尺寸全部用字面量 class，保证 Tailwind JIT 能扫描到
const props = withDefaults(
  defineProps<{
    count?: number
    columns?: 1 | 2 | 3 | 4
  }>(),
  {
    count: 6,
    columns: 3,
  },
)

const gridClass = computed(() => {
  switch (props.columns) {
    case 1:
      return 'grid-cols-1'
    case 2:
      return 'grid-cols-1 md:grid-cols-2'
    case 4:
      return 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
    case 3:
    default:
      return 'grid-cols-1 md:grid-cols-2 xl:grid-cols-3'
  }
})
</script>

<template>
  <div
    class="grid gap-4"
    :class="gridClass"
    aria-busy="true"
    aria-live="polite"
  >
    <div
      v-for="i in count"
      :key="i"
      class="rounded-xl border border-neutral-200 bg-white p-5"
    >
      <div class="flex items-start gap-3">
        <div class="skeleton h-12 w-12 shrink-0 rounded-xl" />
        <div class="min-w-0 flex-1 space-y-2">
          <div class="skeleton h-4 w-2/3" />
          <div class="skeleton h-3 w-full" />
          <div class="skeleton h-3 w-4/5" />
        </div>
      </div>

      <div class="mt-4 flex items-end justify-between border-t border-gray-100 pt-3">
        <div class="space-y-2">
          <div class="skeleton h-5 w-24" />
          <div class="skeleton h-3 w-20" />
        </div>
        <div class="skeleton h-3 w-16" />
      </div>

      <div class="mt-3 flex gap-1">
        <div class="skeleton h-5 w-12" />
        <div class="skeleton h-5 w-16" />
      </div>
    </div>
  </div>
</template>
