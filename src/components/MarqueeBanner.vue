<script setup></script>

<template>
  <div
    class="relative border-b-[2px] border-[#87C06D] bg-[#87C06D] md:md:bg-transparent py-2 overflow-hidden h-9 -mx-4 md:mx-0"
  >
    <span
      class="marquee-text absolute inset-0 flex items-center justify-center font-[cubic11] font-semibold text-[#FAF8F4] md:text-[#4A5040] text-sm"
    >
      ☀️ 哈囉！今天想揪什麼？
    </span>
  </div>
</template>

<style scoped>
.marquee-text {
  animation: marquee 45s linear infinite;
}

@keyframes marquee {
  0% {
    transform: translateX(-100%);
  }
  100% {
    transform: translateX(100%);
  }
}
</style>
