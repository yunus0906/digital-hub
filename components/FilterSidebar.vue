<script setup lang="ts">
// 通用筛选侧栏：
// - 桌面端（lg+）作为左侧 sticky 栏展示
// - 移动端折叠为一个「筛选」按钮 + 底部抽屉（USlideover，side="bottom"）
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

// 将 FilterOption[] 转成 USelect 需要的 { value, label } 形式
function selectItems(f: FilterField) {
  return (f.options ?? []).map(o => ({ value: o.value, label: o.label }))
}

// 统一渲染：桌面侧栏与抽屉复用同一套字段渲染逻辑
function fieldValue(f: FilterField) {
  return props.modelValue[f.key] ?? ''
}
</script>

<template>
  <div>
    <!-- 移动端：筛选触发按钮（< lg 显示） -->
    <div class="mb-4 flex items-center gap-2 lg:hidden">
      <UButton
        color="neutral"
        variant="outline"
        class="flex-1"
        :label="`筛选${activeCount > 0 ? ` (${activeCount})` : ''}`"
        icon="i-lucide-sliders-horizontal"
        @click="drawerOpen = true"
      />
      <UButton
        v-if="activeCount > 0"
        color="neutral"
        variant="outline"
        label="清空"
        @click="onClear"
      />
    </div>

    <!-- 桌面端：左侧 sticky 栏（lg+ 显示） -->
    <aside
      class="sticky top-20 hidden w-60 shrink-0 self-start rounded-xl border border-neutral-200 bg-white p-4 lg:block"
      aria-label="筛选条件"
    >
      <div class="mb-3 flex items-center justify-between">
        <h2 class="text-sm font-semibold text-neutral-900">{{ title }}</h2>
        <UButton
          v-if="activeCount > 0"
          variant="link"
          color="primary"
          size="xs"
          :label="`清空（${activeCount}）`"
          @click="onClear"
        />
      </div>

      <div class="space-y-4">
        <div
          v-for="f in fields"
          :key="f.key"
        >
          <UFormField :label="f.label">
            <UInput
              v-if="f.type === 'text'"
              :model-value="fieldValue(f)"
              type="text"
              class="w-full"
              :placeholder="f.placeholder"
              @update:model-value="onFieldChange(f.key, $event)"
            />
            <USelect
              v-else-if="f.type === 'select'"
              :model-value="fieldValue(f)"
              :items="selectItems(f)"
              class="w-full"
              @update:model-value="onFieldChange(f.key, $event)"
            />
            <UInput
              v-else-if="f.type === 'number'"
              :model-value="fieldValue(f)"
              type="number"
              :min="f.min"
              class="w-full"
              :placeholder="f.placeholder"
              @update:model-value="onFieldChange(f.key, $event)"
            />
          </UFormField>
        </div>
      </div>
    </aside>

    <!-- 移动端：底部抽屉（USlideover） -->
    <USlideover
      v-model:open="drawerOpen"
      side="bottom"
      title="筛选条件"
      :description="`${title} · 已选 ${activeCount} 项`"
    >
      <template #body>
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <UFormField
            v-for="f in fields"
            :key="f.key"
            :label="f.label"
          >
            <UInput
              v-if="f.type === 'text'"
              :model-value="fieldValue(f)"
              type="text"
              class="w-full"
              :placeholder="f.placeholder"
              @update:model-value="onFieldChange(f.key, $event)"
            />
            <USelect
              v-else-if="f.type === 'select'"
              :model-value="fieldValue(f)"
              :items="selectItems(f)"
              class="w-full"
              @update:model-value="onFieldChange(f.key, $event)"
            />
            <UInput
              v-else-if="f.type === 'number'"
              :model-value="fieldValue(f)"
              type="number"
              :min="f.min"
              class="w-full"
              :placeholder="f.placeholder"
              @update:model-value="onFieldChange(f.key, $event)"
            />
          </UFormField>
        </div>
      </template>

      <template #footer>
        <div class="flex gap-2">
          <UButton
            color="neutral"
            variant="outline"
            block
            label="清空"
            @click="onClear"
          />
          <UButton
            block
            :label="`应用（${activeCount} 项）`"
            @click="onDrawerApply"
          />
        </div>
      </template>
    </USlideover>
  </div>
</template>
