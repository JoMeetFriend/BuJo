<template>
  <div class="min-h-screen flex flex-col justify-center items-center px-4 py-12">
    <div class="text-center">
      <h1 class="text-7xl md:text-9xl font-normal text-brand-text font-pixel">404</h1>

      <h2 class="mt-6 text-3xl font-bold text-brand-text tracking-tight sm:text-4xl">
        糟糕，迷路了嗎？
      </h2>

      <p class="mt-4 text-base leading-7 text-brand-text">
        你找的頁面可能已經搬家、被外星人綁架，或者根本不存在。
      </p>

      <div class="mt-6 flex items-center justify-center">
        <router-link
          to="/"
          class="bg-primary-green border-2 border-brand-text shadow-pixel px-6 py-3 text-sm font-semibold text-brand-text active:translate-x-[1px] active:translate-y-[1px] active:shadow-pixel-pressed transition-all duration-70"
        >
          帶我回首頁
        </router-link>
      </div>
    </div>
  </div>
</template>
