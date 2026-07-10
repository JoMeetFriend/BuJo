<template>
  <div
    class="flex items-start gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-card-yellow)] px-3 py-2 mt-1"
  >
    <span class="flex-shrink-0 text-sm leading-5">⚠️</span>
    <span class="text-xs leading-5 text-[var(--bujo-ink)]">
      活動將在 <strong>{{ minutes }}</strong> 分鐘後開始，建立後請手動確認成團
    </span>
  </div>
</template>

<script setup>
defineProps({
  minutes: { type: Number, required: true },
})
</script>
