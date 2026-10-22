<script setup lang="ts">
const route = useRoute()
const searchQuery = ref('')

const navItems = [
  { label: '首页', to: '/' },
  { label: '机场订阅', to: '/airports' },
  { label: '订阅客户端', to: '/apps' },
  { label: 'VPS / 云服务器', to: '/vps' },
  { label: 'AI 模型', to: '/ai', disabled: true },
  { label: '关于', to: '/about' },
]

function onSearch() {
  const q = searchQuery.value.trim()
  if (q) {
    navigateTo({ path: '/search', query: { q } })
  }
}

function isActive(to: string) {
  if (to === '/') return route.path === '/'
  return route.path.startsWith(to)
}
</script>

<template>
  <div class="flex min-h-screen flex-col">
    <header class="sticky top-0 z-40 border-b border-gray-200 bg-white/90 backdrop-blur">
      <div class="mx-auto flex h-16 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <NuxtLink
          to="/"
          class="flex items-center gap-2 font-semibold"
        >
          <span class="logo-fallback h-8 w-8 text-base">D</span>
          <span class="hidden text-lg sm:inline">DigitalHub</span>
        </NuxtLink>

        <nav
          class="hidden items-center gap-1 lg:flex"
          aria-label="主导航"
        >
          <NuxtLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.disabled ? '#' : item.to"
            :aria-disabled="item.disabled"
            class="rounded-md px-3 py-2 text-sm font-medium transition-colors"
            :class="
              item.disabled
                ? 'cursor-not-allowed text-gray-400'
                : isActive(item.to)
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
            "
          >
            {{ item.label }}
            <span
              v-if="item.disabled"
              class="ml-1 text-xs text-gray-400"
            >即将推出</span>
          </NuxtLink>
        </nav>

        <form
          class="ml-auto flex flex-1 items-center gap-2 sm:max-w-xs"
          role="search"
          @submit.prevent="onSearch"
        >
          <input
            v-model="searchQuery"
            type="search"
            placeholder="搜索服务、客户端、VPS…"
            aria-label="全站搜索"
            class="input"
          >
          <button
            type="submit"
            class="btn-primary shrink-0"
            aria-label="搜索"
          >
            搜索
          </button>
        </form>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="border-t border-gray-200 bg-white">
      <div class="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div class="grid grid-cols-2 gap-8 md:grid-cols-4">
          <div>
            <h3 class="mb-3 text-sm font-semibold text-gray-900">
              产品
            </h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <NuxtLink
                  to="/airports"
                  class="hover:text-blue-600"
                >机场订阅</NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/apps"
                  class="hover:text-blue-600"
                >订阅客户端</NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/vps"
                  class="hover:text-blue-600"
                >VPS / 云服务器</NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="mb-3 text-sm font-semibold text-gray-900">
              关于
            </h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <NuxtLink
                  to="/about"
                  class="hover:text-blue-600"
                >关于本站</NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/about"
                  class="hover:text-blue-600"
                >数据来源说明</NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="mb-3 text-sm font-semibold text-gray-900">
              帮助
            </h3>
            <ul class="space-y-2 text-sm text-gray-600">
              <li>
                <NuxtLink
                  to="/about"
                  class="hover:text-blue-600"
                >数据纠错</NuxtLink>
              </li>
              <li>
                <NuxtLink
                  to="/about"
                  class="hover:text-blue-600"
                >提交产品</NuxtLink>
              </li>
            </ul>
          </div>
          <div>
            <h3 class="mb-3 text-sm font-semibold text-gray-900">
              声明
            </h3>
            <p class="text-xs leading-relaxed text-gray-500">
              本站仅提供信息聚合与比较，不代售服务。价格、评分等数据均标注来源与核验时间，可能滞后于官方。
            </p>
          </div>
        </div>
        <p class="mt-8 border-t border-gray-100 pt-4 text-xs text-gray-400">
          © {{ new Date().getFullYear() }} DigitalHub · 数字服务价格导航平台 · 数据仅供技术参考
        </p>
      </div>
    </footer>
  </div>
</template>
