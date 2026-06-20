<script setup>
import { ref } from 'vue'
import PixelButton from './ui/PixelButton.vue'

const avatarUrl = ref('')
const handleAvatarChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  avatarUrl.value = URL.createObjectURL(file)
}
</script>

<template>
  <main class="min-h-screen bg-[#FEF7E8] px-5 pt-8 pb-4 md:px-14 font-[cubic11] text-[#4A5040]">
    <!-- 頁首 -->
    <header class="mb-5 flex items-baseline gap-4">
      <h1
        class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl"
        style="text-shadow: 2px 2px 0px #e4ded1"
      >個人編輯</h1>
      <span class="font-['Press_Start_2P'] text-[#9DBD86] text-base tracking-widest uppercase">ME</span>
    </header>

    <!-- 主卡片 -->
    <section class="w-full max-w-[800px] border-2 border-[#4A5040] bg-white shadow-[6px_6px_0_#4A5040] max-sm:shadow-[4px_4px_0_#4A5040]">

      <!-- 頭像 -->
      <header class="flex items-center border-b-2 border-[#DEF4CD] bg-[#D9F0A8] px-5 py-3">
        <h2 class="text-base leading-none md:text-lg" style="-webkit-text-stroke: 0.5px #4A5040">頭像</h2>
      </header>
      <div class="px-5 py-4">
        <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <div class="size-24 shrink-0 overflow-hidden border-2 border-[#4A5040] bg-[#DEF4CD] shadow-[4px_4px_0_#4A5040] md:size-28">
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="使用者頭像"
              class="size-full object-cover"
            />
          </div>
          <div class="grid gap-2">
            <label
              class="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 border-2 border-[#4A5040] bg-[#87C06D] px-4 text-[12px] text-white shadow-[3px_3px_0_#4A5040] transition-all duration-150 hover:bg-[#69AD76] hover:border-[#0E7490] hover:shadow-[3px_3px_0_#0E7490]"
            >
              <input class="hidden" type="file" accept="image/png, image/jpeg" @change="handleAvatarChange" />
              ▲ 上傳照片
            </label>
            <p class="text-xs text-[#9DBD86]">支援 JPG、PNG，建議使用正方形圖片。</p>
          </div>
        </div>
      </div>

      <!-- 基本資料 -->
      <header class="flex items-center border-y-2 border-[#DEF4CD] bg-[#D9F0A8] px-5 py-3">
        <h2 class="text-base leading-none md:text-lg" style="-webkit-text-stroke: 0.5px #4A5040">基本資料</h2>
      </header>
      <form class="px-5 py-4 grid gap-4" @submit.prevent>
        <label class="grid gap-1.5">
          <span class="text-xs field-label">
            修改顯示名稱 <strong class="text-[#87C06D]" style="-webkit-text-stroke: 0">*</strong>
          </span>
          <input
            class="h-9 w-full border-2 border-[#4A5040] bg-[#FEF7E8] px-4 text-[12px] shadow-[3px_3px_0_#4A5040] outline-none transition-all duration-150 placeholder:text-[#9DBD86] focus:bg-white focus:shadow-[4px_4px_0_#4A5040]"
            type="text"
            placeholder="請輸入顯示名稱"
          />
          <p class="text-xs text-[#9DBD86]">顯示名稱會出現在揪團、行事曆與留言中。</p>
        </label>

        <div class="grid gap-1.5">
          <span class="text-xs field-label">電子郵件</span>
          <div class="flex h-9 w-full items-center border-2 border-[#DEF4CD] bg-[#FEF7E8] px-4 text-[12px] text-[#9DBD86]">
            bujo.user@example.com
          </div>
        </div>

        <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <PixelButton variant="white" type="button">取消</PixelButton>
          <PixelButton type="submit">儲存變更</PixelButton>
        </div>
      </form>
    </section>
  </main>
</template>

<style scoped>
.field-label {
  -webkit-text-stroke: 0.5px #4A5040;
}
</style>
