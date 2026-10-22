<script setup lang="ts">
// 通用筛选侧栏：
// - 桌面端（lg+）作为左侧 sticky 栏展示
// - 移动端折叠为一个「筛选」按钮 + 底部抽屉（bottom sheet）
// - 筛选项由外部传入的 fields 配置驱动，支持 text / select / number 三种类型
// - 默认「即时生效」：任意字段变化即触发 update 事件（由父组件决定是否防抖/刷新）

export interface FilterOption {
  value: string
  label: string
}

export interface FilterField {
  /** 绑定到 filters 对象的 key */
  key: string
  /** 展示标签 */
  label: string
  type: 'text' | 'select' | 'number'
  placeholder?: string
  /** select 类型的选项 */
  options?: FilterOption[]
  /** number 类型的 min 属性 */
  min?: number
}

const props = withDefaults(
  defineProps<{
    /** 筛选字段配置 */
    fields: FilterField[]
    /** 当前筛选值（父组件 reactive 对象） */
    modelValue: Record<string, any>
    /** 激活的筛选项数量（用于角标） */
    activeCount?: number
    /** 分组标题，默认「筛选」 */
    title?: string
  }>(),
  {
    activeCount: 0,
    title: '筛选',
  },
)

const emit = defineEmits<{
  /** 任意字段变化（即时生效） */
  'update:modelValue': [value: Record<string, any>]
  /** 应用（移动端抽屉点击应用时） */
  apply: []
  /** 清空 */
  clear: []
}>()

// 移动端抽屉开关
const drawerOpen = ref(false)

// 修改某个字段 → 触发即时生效
function onFieldChange(key: string, value: any) {
  const next = { ...props.modelValue, [key]: value }
  emit('update:modelValue', next)
  emit('apply')
}

function onClear() {
  emit('clear')
}

function onDrawerApply() {
  emit('apply')
  drawerOpen.value = false
}
</script>

<template>
  <div>
    <!-- 移动端：筛选触发按钮（< lg 显示） -->
    <div class="mb-4 flex items-center gap-2 lg:hidden">
      <button
        class="btn-secondary flex-1"
        type="button"
        @click="drawerOpen = true"
      >
        <span class="mr-1.5 inline-block h-3 w-3 align-middle">
          <svg
            viewBox="0 0 16 16"
            class="h-3 w-3"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          ><path
            d="M2 4h12M4 8h8M6 12h4"
            stroke-linecap="round"
          /></svg>
        </span>
        筛选
        <span
          v-if="activeCount > 0"
          class="ml-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-blue-600 px-1 text-[10px] font-semibold text-white"
        >{{ activeCount }}</span>
      </button>
      <button
        v-if="activeCount > 0"
        class="btn-secondary shrink-0"
        type="button"
        @click="onClear"
      >
        清空
      </button>
    </div>

    <!-- 桌面端：左侧 sticky 栏（lg+ 显示） -->
    <aside
      class="card sticky top-20 hidden w-60 shrink-0 self-start p-4 lg:block"
      aria-label="筛选条件"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-gray-900">{{ title }}</h2>
        <button
          v-if="activeCount > 0"
          class="text-xs text-blue-600 hover:text-blue-700"
          type="button"
          @click="onClear"
        >
          清空（{{ activeCount }}）
        </button>
      </div>

      <div class="space-y-4">
        <div
          v-for="f in fields"
          :key="f.key"
        >
          <label
            :for="`side-${f.key}`"
            class="mb-1 block text-xs font-medium text-gray-600"
          >{{ f.label }}</label>

          <input
            v-if="f.type === 'text'"
            :id="`side-${f.key}`"
            :value="modelValue[f.key] ?? ''"
            type="text"
            class="input !py-1.5 !text-[13px]"
            :placeholder="f.placeholder"
            @input="onFieldChange(f.key, ($event.target as HTMLInputElement).value)"
          >

          <select
            v-else-if="f.type === 'select'"
            :id="`side-${f.key}`"
            :value="modelValue[f.key] ?? ''"
            class="select w-full !py-1.5 !text-[13px]"
            @change="onFieldChange(f.key, ($event.target as HTMLSelectElement).value)"
          >
            <option
              v-for="o in f.options"
              :key="o.value"
              :value="o.value"
            >
              {{ o.label }}
            </option>
          </select>

          <input
            v-else-if="f.type === 'number'"
            :id="`side-${f.key}`"
            :value="modelValue[f.key] ?? ''"
            type="number"
            :min="f.min"
            class="input !py-1.5 !text-[13px]"
            :placeholder="f.placeholder"
            @input="onFieldChange(f.key, ($event.target as HTMLInputElement).value)"
          >
        </div>
      </div>
    </aside>

    <!-- 移动端：底部抽屉 -->
    <Teleport to="body">
      <Transition name="drawer">
        <div
          v-if="drawerOpen"
          class="fixed inset-0 z-50 lg:hidden"
          role="dialog"
          aria-modal="true"
          aria-label="筛选条件"
        >
          <div
            class="absolute inset-0 bg-black/40"
            @click="drawerOpen = false"
          />
          <div
            class="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))]"
          >
            <div class="mb-4 flex items-center justify-between">
              <h2 class="text-base font-semibold text-gray-900">{{ title }}</h2>
              <button
                class="text-sm text-gray-400"
                type="button"
                aria-label="关闭筛选"
                @click="drawerOpen = false"
              >
                ✕
              </button>
            </div>

            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div
                v-for="f in fields"
                :key="f.key"
              >
                <label
                  :for="`drawer-${f.key}`"
                  class="mb-1 block text-xs font-medium text-gray-600"
                >{{ f.label }}</label>

                <input
                  v-if="f.type === 'text'"
                  :id="`drawer-${f.key}`"
                  :value="modelValue[f.key] ?? ''"
                  type="text"
                  class="input"
                  :placeholder="f.placeholder"
                  @input="onFieldChange(f.key, ($event.target as HTMLInputElement).value)"
                >

                <select
                  v-else-if="f.type === 'select'"
                  :id="`drawer-${f.key}`"
                  :value="modelValue[f.key] ?? ''"
                  class="select w-full"
                  @change="onFieldChange(f.key, ($event.target as HTMLSelectElement).value)"
                >
                  <option
                    v-for="o in f.options"
                    :key="o.value"
                    :value="o.value"
                  >
                    {{ o.label }}
                  </option>
                </select>

                <input
                  v-else-if="f.type === 'number'"
                  :id="`drawer-${f.key}`"
                  :value="modelValue[f.key] ?? ''"
                  type="number"
                  :min="f.min"
                  class="input"
                  :placeholder="f.placeholder"
                  @input="onFieldChange(f.key, ($event.target as HTMLInputElement).value)"
                >
              </div>
            </div>

            <div class="mt-5 flex gap-2">
              <button
                class="btn-secondary flex-1"
                type="button"
                @click="onClear"
              >
                清空
              </button>
              <button
                class="btn-primary flex-1"
                type="button"
                @click="onDrawerApply"
              >
                应用（{{ activeCount }} 项）
              </button>
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>
