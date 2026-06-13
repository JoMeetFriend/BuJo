<template>
  <div class="min-h-screen bg-[#FEF7E8] flex flex-col justify-center items-center px-4 py-12">
    <div class="text-center">
      <h1
        class="text-7xl md:text-9xl font-normal text-[#4A5040]"
        style="font-family: 'Press Start 2P', cursive"
      >
        404
      </h1>

      <h2
        class="mt-6 text-3xl font-bold text-[#4A5040] tracking-tight sm:text-4xl"
        style="font-family: 'cubic11', sans-serif"
      >
        糟糕，迷路了嗎？
      </h2>

      <p class="mt-4 text-base leading-7 text-[#4A5040]" style="font-family: 'cubic11', sans-serif">
        你找的頁面可能已經搬家、被外星人綁架，或者根本不存在。
      </p>

      <div class="mt-6 flex items-center justify-center">
        <router-link
          to="/"
          class="bg-[#87C06D] border-2 border-[#4A5040] shadow-[3px_3px_0_0_#4A5040] px-6 py-3 text-sm font-semibold text-[#4A5040] active:translate-x-[1px] active:translate-y-[1px] active:shadow-[2px_2px_0_0_#4A5040] transition-all duration-70"
          style="font-family: 'cubic11', sans-serif"
        >
          帶我回首頁
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap');

@font-face {
  font-family: 'cubic11';
  src: url('https://cdn.jsdelivr.net/gh/ACh-K/Cubic-11@v1.451/fonts/web/Cubic_11.woff2')
    format('woff2');
  font-weight: normal;
  font-style: normal;
  font-display: swap;
}
</style>
