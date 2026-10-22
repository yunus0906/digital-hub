// https://nuxt.com/docs/guide/directory-structure/nuxt-config
// 注意：本文件使用 .mjs（纯 JS）而非 .ts，规避 jiti 在 Windows 上的 TS 解析 bug
export default defineNuxtConfig({

  // 开发服务器强制绑定 IPv4 回环地址，规避 Windows 下 localhost 解析为
  // IPv6 [::1] 导致 Vite host 校验对 /__nuxt_vite_node__ 返回 403 的问题。
  // 改完后请通过 http://127.0.0.1:3000 访问，不要再走 localhost。
  devServer: {
    host: '127.0.0.1',
  },

  modules: ['@nuxtjs/tailwindcss'],
  devtools: { enabled: false },

  // Windows + pnpm 组合下 SSR 渲染会 403（详见下方 vite 段注释）
  vite: {
    server: {
      fs: {
        // 关闭 Vite 的 fs 服务白名单校验，仅影响 dev server，不影响 build。
        // 原因：pnpm 的 node_modules/.pnpm 真实路径经 Vite SSR transform 后会变成
        // 「根相对」的 id（/node_modules/.pnpm/...），而 Nuxt 的 __nuxt_vite_node__
        // 中间件用 path.isAbsolute 判定为绝对路径后交给 Vite 的
        // isFileServingAllowed 校验；该路径没有盘符，永远匹配不上 fs.allow 里的
        // D:/... 项目根，于是抛 403，导致整页 SSR 渲染失败。
        // 该中间件只作用于 http://127.0.0.1 本机开发环境，关闭严格模式风险可控。
        strict: false,
      },
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'zh-CN' },
      title: '数字服务价格导航平台',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        {
          name: 'description',
          content:
            '面向中文技术用户的数字基础设施与 AI 服务发现、价格比较、技术选型与社区数据平台',
        },
      ],
      link: [{ rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    },
  },

  css: ['~/assets/css/main.css'],

  runtimeConfig: {
    // 服务端可用
    databaseUrl: process.env.DATABASE_URL,
    sessionSecret: process.env.SESSION_SECRET,
    // 客户端可用（public 前缀）
    public: {
      appUrl: process.env.APP_URL || 'http://localhost:3000',
    },
  },
  compatibilityDate: '2024-11-01',

  nitro: {
    routeRules: {
      // 公共列表/详情页 SSR，利于 SEO
      '/': { ssr: true },
      '/airports/**': { ssr: true },
      '/apps/**': { ssr: true },
      '/vps/**': { ssr: true },
      '/search/**': { ssr: true },
      // 管理后台仅客户端渲染
      '/admin/**': { ssr: false },
    },
  },

  typescript: {
    strict: true,
    typeCheck: true,
  },

  eslint: {
    config: {
      stylistic: true,
    },
  },
})
