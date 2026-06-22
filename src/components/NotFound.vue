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
        <PixelButton @click="$router.push('/')">帶我回首頁</PixelButton>
      </div>
    </div>
  </div>
</template>

<script setup>
import PixelButton from './ui/PixelButton.vue'
</script>
