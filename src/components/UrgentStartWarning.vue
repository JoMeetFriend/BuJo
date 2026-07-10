<template>
  <div
    class="flex items-start gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-card-yellow)] px-3 py-2 mt-1"
  >
    <span class="flex-shrink-0 text-sm leading-5">⚠️</span>
    <span class="text-xs leading-5 text-[var(--bujo-ink)]">
      <template v-if="text">{{ text }}</template>
      <template v-else>活動將在 <strong>{{ minutes }}</strong> 分鐘後開始，建立後請手動確認成團</template>
    </span>
  </div>
</template>

<script setup>
defineProps({
  minutes: { type: Number, default: 0 },
  // 有些情境（例如情境三候選日不連續）預設的「N 分鐘後開始」文案不準確，
  // 傳這個 prop 可以整段換成客製文字，不用 minutes
  text: { type: String, default: '' },
})
</script>
