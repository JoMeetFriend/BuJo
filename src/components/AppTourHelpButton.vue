<template>
  <button
    type="button"
    class="bujo-tour-help-btn"
    :class="floating ? 'bujo-tour-help-btn--floating' : 'bujo-tour-help-btn--inline'"
    :aria-label="t('tour.helpButtonLabel')"
    :title="t('tour.helpButtonTitle')"
    @click="emit('click')"
  >
    ?
  </button>
</template>

<script setup>
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

defineProps({
  // 桌機版嵌在側邊欄 CALENDAR FILTER 那條線上面，跟著版面走；
  // 手機版沒有側邊欄可以嵌，改成浮在畫面右上角
  floating: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['click'])
</script>

<style scoped>
.bujo-tour-help-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bujo-ink);
  border-radius: 999px;
  background: var(--bujo-surface);
  color: var(--bujo-ink);
  font-family: var(--bujo-font-body);
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

.bujo-tour-help-btn--inline {
  width: 26px;
  height: 26px;
  font-size: 13px;
}

.bujo-tour-help-btn--floating {
  position: fixed;
  top: 5px;
  right: 10px;
  z-index: 70;
  width: 26px;
  height: 26px;
  font-size: 12px;
}
</style>
