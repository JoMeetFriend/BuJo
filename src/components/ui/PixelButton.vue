<!-- 按鈕樣式：動畫、hover、樣式全部封裝在內，不需要額外設定。
用到這個樣式時：
引入：
  import PixelButton from '@/components/ui/PixelButton.vue'

  綠底白字（預設）：
  <PixelButton @click="doSomething">按鈕文字</PixelButton>
  
  白底深字（取消、次要動作）：
  <PixelButton variant="white" @click="doSomething">取消</PixelButton>
  
  表單送出：
  <PixelButton type="submit">送出揪團</PixelButton>
-->
<script setup>
import { ref, useAttrs, computed } from 'vue'

defineOptions({ inheritAttrs: false })

const props = defineProps({
  variant: {
    type: String,
    default: 'green',
  },
})

const attrs = useAttrs()
const attrsWithoutClick = computed(() => {
  const { onClick, ...rest } = attrs
  return rest
})

const isBouncing = ref(false)

function handleClick() {
  isBouncing.value = true
}

function onAnimationEnd() {
  isBouncing.value = false
  if (typeof attrs.onClick === 'function') {
    attrs.onClick()
  }
}
</script>

<template>
  <button
    v-bind="attrsWithoutClick"
    class="inline-flex items-center justify-center gap-1 font-[cubic11] font-black text-[12px] px-4 py-2 border-2 border-[#4A5040] shadow-[3px_3px_0px_#4A5040] hover:border-[#0E7490] hover:shadow-[3px_3px_0_#0E7490] transition-all duration-150 cursor-pointer"
    :class="[
      props.variant === 'white'
        ? 'bg-white text-[#4A5040] hover:bg-[#D9EEF2] hover:text-[#0E7490]'
        : props.variant === 'danger'
          ? 'bg-[#F9CE9A] text-[#4A5040] hover:bg-[rgba(185,64,64,0.12)] hover:border-[#9B3030] hover:shadow-[3px_3px_0_#9B3030] hover:text-[#9B3030]'
          : 'bg-[#87C06D] text-white hover:bg-[#69AD76]',
      { 'btn-bounce': isBouncing },
    ]"
    @click="handleClick"
    @animationend="onAnimationEnd"
  >
    <slot />
  </button>
</template>

<style scoped>
@keyframes pixel-bounce {
  0% {
    transform: translate(0, 0);
    box-shadow: 3px 3px 0 #4a5040;
  }
  40% {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #4a5040;
  }
  100% {
    transform: translate(0, 0);
    box-shadow: 3px 3px 0 #4a5040;
  }
}
.btn-bounce {
  animation: pixel-bounce 0.2s ease-in-out;
}
</style>
