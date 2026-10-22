<template>
  <!-- UApp：Nuxt UI 全局配置根节点，Toast/Tooltip/overlay 依赖它 -->
  <UApp>
    <!-- 路由切换时的顶部进度条：点击即出现反馈，避免「点了没反应」 -->
    <NuxtLoadingIndicator
      color="#2563eb"
      :height="3"
      :throttle="80"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </UApp>
</template>
