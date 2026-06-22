<!-- BaseModal — 統一彈窗外殼
  Props:
    isOpen   Boolean  — 控制顯示
    title    String   — 標題文字（同時用於 aria-labelledby）
    scrollable Boolean — 是否可捲動（預設 false）；true 時 body 可捲、footer 固定在底部
    maxWidth String   — 彈窗最大寬度（預設 '440px'）

  Slots:
    default  — body 內容（必填）
    footer   — 底部按鈕列（可選；有傳才會顯示 footer 列）

  Emits:
    close    — 點遮罩 / 點 × / 按 ESC 時觸發

  用法：
    import BaseModal from '@/components/ui/BaseModal.vue'

    非捲動（ProfileAccountModal 型）：
    <BaseModal :isOpen="isOpen" title="我的帳號" @close="close">
      <template #default>…內容…</template>
    </BaseModal>

    可捲動 + footer（EventPage 型）：
    <BaseModal :isOpen="isOpen" title="建立揪團活動" scrollable @close="close">
      <template #default>…表單欄位…</template>
      <template #footer>
        <PixelButton variant="white" type="button" @click="close">取消</PixelButton>
        <PixelButton type="submit">送出揪團</PixelButton>
      </template>
    </BaseModal>
-->
<script setup>
import { computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  isOpen: {
    type: Boolean,
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  scrollable: {
    type: Boolean,
    default: false,
  },
  maxWidth: {
    type: String,
    default: '440px',
  },
})

const emit = defineEmits(['close'])

const titleId = computed(
  () => `modal-title-${props.title.replace(/[\s\W]+/g, '-').toLowerCase()}`,
)

function handleKeydown(e) {
  if (e.key === 'Escape') emit('close')
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="isOpen"
      class="fixed inset-0 z-[80] flex items-center justify-center bg-[#4A5040]/35 px-4"
      @click="emit('close')"
    >
      <div
        class="w-full border-2 border-[#4A5040] bg-[#FEF7E8] font-[cubic11] text-[#4A5040] shadow-[6px_6px_0_#4A5040] max-sm:shadow-[4px_4px_0_#4A5040]"
        :class="scrollable ? 'flex flex-col max-h-[80vh]' : ''"
        :style="{ maxWidth }"
        role="dialog"
        aria-modal="true"
        :aria-labelledby="titleId"
        @click.stop
      >
        <!-- header -->
        <header
          class="flex items-center justify-between border-b-2 border-[#DEF4CD] bg-[#D9F0A8] px-5 py-3"
          :class="scrollable ? 'shrink-0 sticky top-0' : ''"
        >
          <h2
            :id="titleId"
            class="m-0 text-base md:text-lg leading-none"
            style="-webkit-text-stroke: 0.5px #4A5040"
          >
            {{ title }}
          </h2>
          <div class="flex items-center gap-2">
            <slot name="header-actions" />
            <button
              class="grid h-7 w-7 place-items-center text-lg leading-none text-[#4A5040] transition hover:bg-[#DEF4CD]"
              type="button"
              :aria-label="`關閉${title}`"
              @click="emit('close')"
            >
              ×
            </button>
          </div>
        </header>

        <!-- scrollable: body 可捲、footer 固定 -->
        <template v-if="scrollable">
          <div class="flex flex-col flex-1 overflow-hidden">
            <div class="flex-1 overflow-y-auto overflow-x-hidden px-5 py-4">
              <slot />
            </div>
          </div>
          <footer
            v-if="$slots.footer"
            class="shrink-0 flex justify-end gap-4 max-sm:gap-3 border-t-2 border-[#DEF4CD] bg-[#FEF7E8] px-5 py-3 max-sm:py-2"
          >
            <slot name="footer" />
          </footer>
        </template>

        <!-- 非捲動：body 直接撐開 -->
        <template v-else>
          <div class="px-5 py-4">
            <slot />
          </div>
          <footer
            v-if="$slots.footer"
            class="flex justify-end gap-4 max-sm:gap-3 border-t-2 border-[#DEF4CD] bg-[#FEF7E8] px-5 py-3 max-sm:py-2"
          >
            <slot name="footer" />
          </footer>
        </template>
      </div>
    </div>
  </Teleport>
</template>
