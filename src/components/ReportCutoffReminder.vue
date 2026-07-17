<template>
  <div class="flex flex-col gap-1.5 border-t border-dashed border-[var(--bujo-line-soft)] pt-2">
    <p
      class="flex items-center gap-1 text-xs leading-5"
      :class="
        isWarning ? 'font-semibold text-[var(--bujo-notification)]' : 'text-[var(--bujo-muted)]'
      "
    >
      <template v-if="isWarning">
        <ClockIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        距離報名截止僅剩
        <strong class="font-[var(--bujo-font-meta)]">{{ remainingMinutes }}</strong>
        分鐘！
      </template>
      <template v-else
        >報名開放到
        <strong class="text-[var(--bujo-muted-strong)]">{{ timeLabel }}</strong>
        （<button type="button" class="-mx-1 -my-1 px-1 py-1" @click="$emit('toggle-editor')">
          <span class="text-[var(--bujo-accent)] underline decoration-dotted underline-offset-2">{{
            offsetParts.number
          }}</span
          >{{ offsetParts.unit }}</button
        >截止）</template
      >
    </p>

    <!-- 流團編輯器 -->
    <div
      v-if="showEditor"
      class="flex flex-wrap items-center gap-2 border border-dashed border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] px-3 py-2"
    >
      <button
        v-for="preset in presets"
        :key="preset.key"
        type="button"
        class="h-8 rounded-none border px-2 text-xs transition-colors"
        :class="
          selectedPresetKey === preset.key
            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
            : 'border-[var(--bujo-line)] bg-white text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)]'
        "
        @click="$emit('select-preset', preset.key)"
      >
        {{ preset.label }}
      </button>
    </div>
  </div>
</template>

<script setup>
import { ClockIcon } from '@heroicons/vue/24/outline'

defineProps({
  isWarning: Boolean,
  remainingMinutes: Number,
  timeLabel: String,
  offsetParts: Object,
  showEditor: Boolean,
  presets: Array,
  selectedPresetKey: String,
})

defineEmits(['toggle-editor', 'select-preset'])
</script>
