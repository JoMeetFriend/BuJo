<template>
  <div
    data-tour="event-deadline-block"
    class="flex flex-col gap-1.5 border-t border-dashed border-[var(--bujo-line-soft)] pt-2"
  >
    <p
      class="text-xs leading-5"
      :class="isWarning ? 'font-semibold text-[var(--bujo-warning)]' : 'text-[var(--bujo-muted)]'"
    >
      <template v-if="isWarning">
        <span class="inline-flex items-center gap-1">
          <ClockIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {{ t('reportCutoff.warningPrefix') }}
          <strong class="font-[var(--bujo-font-meta)]">{{ remainingMinutes }}</strong>
          {{ t('reportCutoff.warningSuffix') }}
        </span>
      </template>
      <template v-else-if="timeLabel"
        >{{ t('reportCutoff.openUntilPrefix') }}
        <strong class="text-[var(--bujo-muted-strong)]">{{ timeLabel }}</strong>
        （<button
          type="button"
          data-tour="event-deadline-offset-button"
          class="-mx-1 -my-1 px-1 py-1"
          @click="$emit('toggle-editor')"
        >
          <span class="text-[var(--bujo-accent)] underline decoration-dotted underline-offset-2">{{
            offsetParts.number
          }}</span
          >{{ offsetParts.unit }}</button
        >{{ t('reportCutoff.deadlineSuffix') }}</template
      >
      <!-- 日期/時間都還沒選完：報名截止時間還算不出來，但錨點（data-tour）要一直在，
           不然情境導覽走到這步時找不到元素會被跳過，導覽就在前一步提早結束 -->
      <template v-else
        >{{ t('reportCutoff.pendingPrefix') }}
        <button
          type="button"
          data-tour="event-deadline-offset-button"
          class="-mx-1 -my-1 px-1 py-1 text-[var(--bujo-accent)] underline decoration-dotted underline-offset-2"
          @click="$emit('toggle-editor')"
        >
          {{ t('reportCutoff.pendingAction') }}</button
        >{{ t('reportCutoff.pendingSuffix') }}</template
      >
    </p>

    <p v-if="candidateReminderText" class="text-[11px] leading-5 text-[var(--bujo-accent)]">
      {{ candidateReminderText }}
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
import { useI18n } from 'vue-i18n'
import { ClockIcon } from '@heroicons/vue/24/outline'

const { t } = useI18n()

defineProps({
  isWarning: Boolean,
  remainingMinutes: Number,
  timeLabel: String,
  offsetParts: Object,
  showEditor: Boolean,
  presets: Array,
  selectedPresetKey: String,
  candidateReminderText: {
    type: String,
    default: '',
  },
})

defineEmits(['toggle-editor', 'select-preset'])
</script>
