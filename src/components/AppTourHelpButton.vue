<template>
  <button
    type="button"
    class="bujo-tour-help-btn"
    aria-label="重新開啟新手導覽"
    title="新手導覽"
    @click="emit('click')"
  >
    ?
  </button>
</template>

<script setup>
const emit = defineEmits(['click'])
</script>

<style scoped>
.bujo-tour-help-btn {
  position: fixed;
  right: 20px;
  bottom: 88px;
  z-index: 70;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 44px;
  height: 44px;
  border: 1px solid var(--bujo-ink);
  border-radius: 999px;
  background: var(--bujo-surface);
  color: var(--bujo-ink);
  font-family: var(--bujo-font-body);
  font-size: 18px;
  font-weight: 700;
  line-height: 1;
  box-shadow: 0 2px 0 var(--bujo-ink);
  cursor: pointer;
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 100ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-tour-help-btn:hover {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.bujo-tour-help-btn:active {
  transform: translate(1px, 1px);
  box-shadow: 0 1px 0 var(--bujo-ink);
}

.bujo-tour-help-btn:focus-visible {
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
}

@media (min-width: 768px) {
  .bujo-tour-help-btn {
    bottom: 24px;
  }
}
</style>
