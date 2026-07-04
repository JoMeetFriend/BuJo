<template>
  <div class="min-h-screen bg-[var(--bujo-page)] flex items-center justify-center">
    <PixelButton @click="show = true">開啟選取時間</PixelButton>
    <AvailabilityPickerModal v-model="show" rangeStart="2026-07-10" rangeEnd="2026-07-16" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AvailabilityPickerModal from './AvailabilityPickerModal.vue'
import PixelButton from './ui/PixelButton.vue'

const show = ref(true)
</script>
