<template>
  <div class="min-h-screen bg-[#FEF7E8] flex items-center justify-center">
    <button
      @click="show = true"
      class="px-4 py-2 bg-[#87C06D] border-2 border-[#4A5040] font-bold font-cubic11 text-sm"
    >
      開啟選取時間
    </button>
    <AvailabilityPickerModal v-model="show" rangeStart="2026-07-10" rangeEnd="2026-07-16" />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import AvailabilityPickerModal from './AvailabilityPickerModal.vue'

const show = ref(true)
</script>
