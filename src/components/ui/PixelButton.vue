<!-- 按鈕樣式（Outline Button，見 BuJo_Visual_Specification_v1.md 第 10 節）：
動畫、hover、樣式全部封裝在內，不需要額外設定。
用到這個樣式時：
引入：
  import PixelButton from '@/components/ui/PixelButton.vue'

  主要動作（預設）：
  <PixelButton @click="doSomething">按鈕文字</PixelButton>

  次要動作（取消、返回）：
  <PixelButton variant="white" @click="doSomething">取消</PixelButton>

  破壞性動作：
  <PixelButton variant="danger" @click="doSomething">刪除</PixelButton>

  表單送出：
  <PixelButton type="submit">送出揪團</PixelButton>
-->

<template>
  <button class="bujo-btn" :class="`bujo-btn--${variant}`">
    <slot />
  </button>
</template>

<script setup>
defineProps({
  variant: {
    type: String,
    default: 'green',
  },
})
</script>

<style scoped>
.bujo-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  padding: 8px 18px;
  border: 1px solid var(--bujo-ink);
  background: transparent;
  color: var(--bujo-ink);
  font-family: var(--bujo-font-body);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  cursor: pointer;
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 100ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-btn:hover:not(:disabled) {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.bujo-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
}

.bujo-btn:focus-visible {
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
}

.bujo-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
  pointer-events: none;
}

.bujo-btn--white {
  border-color: var(--bujo-line);
  color: var(--bujo-muted-strong);
}

.bujo-btn--white:hover:not(:disabled) {
  background: transparent;
  border-color: var(--bujo-ink);
  color: var(--bujo-ink);
}

.bujo-btn--danger {
  border-color: var(--bujo-line);
  color: var(--bujo-muted-strong);
}

.bujo-btn--danger:hover:not(:disabled) {
  background: transparent;
  border-color: #dc2626;
  color: #dc2626;
}
</style>
