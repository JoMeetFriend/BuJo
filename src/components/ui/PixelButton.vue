<!-- 綠底白字按鈕
用到這個樣式時：
import PixelButton from '@/components/ui/PixelButton.vue'
  
<PixelButton @click="doSomething">按鈕文字</PixelButton>
動畫、hover、樣式全部封裝在內，不需要額外設定。
-->
<script setup>
import { ref } from 'vue'

const isBouncing = ref(false)

function handleClick() {
  isBouncing.value = true
}
</script>

<template>
  <button
    class="inline-flex items-center justify-center gap-1 bg-[#87C06D] text-white font-[cubic11] font-black text-[12px] px-4 py-2 border-2 border-[#4A5040] shadow-[3px_3px_0px_#4A5040] hover:bg-[#98CF7E] transition-colors cursor-pointer"
    :class="{ 'btn-bounce': isBouncing }"
    @click="handleClick"
    @animationend="isBouncing = false"
  >
    <slot />
  </button>
</template>

<style scoped>
@keyframes pixel-bounce {
  0%   { transform: translate(0, 0);     box-shadow: 3px 3px 0 #4A5040; }
  40%  { transform: translate(3px, 3px); box-shadow: 0 0 0 #4A5040; }
  100% { transform: translate(0, 0);     box-shadow: 3px 3px 0 #4A5040; }
}
.btn-bounce {
  animation: pixel-bounce 0.2s ease-in-out;
}
</style>

