<template>
  <div>
    <!-- 路由切换时的顶部进度条：点击即出现反馈，避免「点了没反应」 -->
    <NuxtLoadingIndicator
      color="#2563eb"
      :height="3"
      :throttle="80"
    />
    <NuxtLayout>
      <NuxtPage />
    </NuxtLayout>
  </div>
</template>
