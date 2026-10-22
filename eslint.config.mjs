import { createConfigForNuxt } from '@nuxt/eslint-config/flat'

export default createConfigForNuxt({
  features: {
    stylistic: true,
  },
})
  .append({
    ignores: ['.nuxt/**', '.output/**', 'node_modules/**', 'dist/**'],
  })
  .append({
    rules: {
      // API 序列化边界（Prisma include 结果、动态展开的列表项）用 any 是合理豁免，
      // 服务端已有完整的 schema 类型约束，前端页面也通过 useFetch 泛型标注了返回结构。
      '@typescript-eslint/no-explicit-any': 'off',
    },
  })
  .append({
    languageOptions: {
      globals: {
        defineNuxtConfig: 'readonly',
      },
    },
  })
