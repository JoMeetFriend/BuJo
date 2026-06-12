<script setup>
import { ref } from 'vue'

const avatarUrl = ref('')

const handleAvatarChange = (event) => {
  const file = event.target.files?.[0]

  if (!file) return

  avatarUrl.value = URL.createObjectURL(file)
}
</script>

<template>
  <main class="min-h-screen bg-[#FAF8F4] px-4 py-3 font-[cubic11] text-[#2B2E24] sm:px-9 sm:py-4">
    <header class="mb-3 flex items-center gap-3 sm:gap-4">
      <button
        class="grid size-8 shrink-0 place-items-center border-[3px] border-[#2B2E24] bg-white text-lg text-[#2B2E24] shadow-[3px_3px_0_#9DBD86] transition hover:-translate-y-0.5 hover:bg-[#FEF7E8] hover:shadow-[4px_4px_0_#9DBD86]"
        type="button"
        aria-label="返回"
      >
        ←
      </button>

      <div class="flex items-center gap-2">
        <h1 class="text-xl font-bold leading-none tracking-[0.05em] text-[#2B2E24] sm:text-3xl">
          個人編輯
        </h1>
        <span class="text-sm leading-none tracking-[0.08em] text-[#87C06D] sm:text-lg">ME</span>
      </div>
    </header>

    <section
      class="w-full max-w-[920px] border-4 border-[#DEF4CD] bg-white p-4 shadow-[8px_8px_0_#D9F0A8] sm:p-5"
    >
      <div class="mb-4 grid gap-3">
        <span
          class="w-fit border-4 border-[#DEF4CD] bg-[#87C06D] px-3 py-1 text-sm text-white shadow-[3px_3px_0_#9DBD86]"
        >
          頭像
        </span>

        <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <div
            class="size-24 shrink-0 overflow-hidden border-4 border-[#D9F0A8] bg-[#DEF4CD] shadow-[6px_6px_0_#9DBD86] md:size-28"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="使用者頭像"
              class="size-full object-cover"
            />
          </div>

          <div class="grid gap-2">
            <label
              class="inline-flex h-10 w-fit cursor-pointer items-center justify-center gap-2 border-4 border-[#DEF4CD] bg-[#87C06D] px-4 text-[15px] text-white shadow-[4px_4px_0_#9DBD86] transition hover:-translate-y-0.5 hover:bg-[#D9F0A8] hover:text-[#2B2E24] hover:shadow-[5px_5px_0_#9DBD86]"
            >
              <input
                class="hidden"
                type="file"
                accept="image/png, image/jpeg"
                @change="handleAvatarChange"
              />
              <span class="text-xl leading-none">▲</span>
              上傳照片
            </label>
            <p class="text-xs text-[#9DBD86]">支援 JPG、PNG，建議使用正方形圖片。</p>
          </div>
        </div>
      </div>

      <form class="grid gap-4" @submit.prevent>
        <span
          class="w-fit border-4 border-[#DEF4CD] bg-[#87C06D] px-3 py-1 text-sm text-white shadow-[3px_3px_0_#9DBD86]"
        >
          基本資料
        </span>
        <label class="grid gap-1.5">
          <span class="text-sm text-[#2B2E24]">
            修改顯示名稱 <strong class="text-[#87C06D]">*</strong>
          </span>
          <input
            class="h-10 w-full border-4 border-[#DEF4CD] bg-[#FEF7E8] px-4 text-[15px] text-[#2B2E24] outline-none shadow-[4px_4px_0_#D9F0A8] transition placeholder:text-[#9DBD86] focus:bg-white focus:placeholder:text-transparent focus:shadow-[6px_6px_0_#D9F0A8]"
            type="text"
            placeholder="請輸入顯示名稱"
          />
          <p class="text-xs text-[#9DBD86]">顯示名稱會出現在揪團、行事曆與留言中。</p>
        </label>

        <div class="grid gap-1.5">
          <span class="text-sm text-[#2B2E24]">電子郵件</span>
          <div
            class="flex h-10 w-full items-center border-4 border-[#DEF4CD] bg-[#FEF7E8] px-4 text-[15px] text-[#6F7567] shadow-[4px_4px_0_#D9F0A8]"
          >
            bujo.user@example.com
          </div>
        </div>

        <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            class="h-10 min-w-28 border-4 border-[#DEF4CD] bg-white px-5 text-[15px] text-[#2B2E24] shadow-[4px_4px_0_#D9F0A8] transition hover:-translate-y-0.5 hover:bg-[#FEF7E8] hover:shadow-[5px_5px_0_#D9F0A8]"
            type="button"
          >
            取消
          </button>
          <button
            class="h-10 min-w-32 border-4 border-[#DEF4CD] bg-[#87C06D] px-5 text-[15px] text-white shadow-[4px_4px_0_#9DBD86] transition hover:-translate-y-0.5 hover:bg-[#D9F0A8] hover:text-[#2B2E24] hover:shadow-[5px_5px_0_#9DBD86]"
            type="submit"
          >
            儲存變更
          </button>
        </div>
      </form>
    </section>
  </main>
</template>
