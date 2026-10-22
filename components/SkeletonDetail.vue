<template>
  <!-- 详情页骨架屏：头部信息 + 若干内容区块 -->
  <div
    class="space-y-6"
    aria-busy="true"
    aria-live="polite"
  >
    <div class="rounded-xl border border-neutral-200 bg-white p-6">
      <div class="flex items-start gap-4">
        <div class="skeleton h-16 w-16 shrink-0 rounded-2xl" />
        <div class="flex-1 space-y-3">
          <div class="skeleton h-7 w-1/3" />
          <div class="skeleton h-4 w-2/3" />
          <div class="flex gap-2 pt-1">
            <div class="skeleton h-8 w-28" />
            <div class="skeleton h-8 w-28" />
          </div>
        </div>
      </div>
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white space-y-3 p-6">
      <div class="skeleton h-5 w-28" />
      <div class="skeleton h-4 w-full" />
      <div class="skeleton h-4 w-full" />
      <div class="skeleton h-4 w-2/3" />
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white space-y-4 p-6">
      <div class="skeleton h-5 w-24" />
      <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div class="skeleton h-20 w-full rounded-lg" />
        <div class="skeleton h-20 w-full rounded-lg" />
      </div>
    </div>

    <div class="rounded-xl border border-neutral-200 bg-white space-y-3 p-6">
      <div class="skeleton h-5 w-32" />
      <div class="skeleton h-4 w-full" />
      <div class="skeleton h-4 w-5/6" />
    </div>
  </div>
</template>
