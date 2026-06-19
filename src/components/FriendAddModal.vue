<template>
  <Teleport to="body">
    <section
      v-if="isOpen"
      class="grid min-h-screen place-items-center bg-brand-text/40 px-4 py-6 font-cubic11 text-text-main fixed inset-0 z-50"
      aria-label="新增好友彈窗"
    >
      <div
        class="w-[min(100%,560px)] border-[3px] border-text-main bg-[#FFF8E8] shadow-[9px_9px_0_#4A5040] max-sm:shadow-[6px_6px_0_#4A5040]"
        role="dialog"
        aria-modal="true"
        aria-labelledby="friend-modal-title"
      >
        <header
          class="flex items-center justify-between gap-5 border-b-[1.5px] border-[#A8C893] bg-[#DDF3AE] px-6 py-4 max-sm:px-4 max-sm:py-3"
        >
          <h1
            id="friend-modal-title"
            class="m-0 text-[28px] font-bold leading-none tracking-[0.04em] text-text-main max-sm:text-2xl"
          >
            新增好友
          </h1>
          <button
            @click="handleClose"
            class="grid size-8 place-items-center border-0 bg-transparent p-0 font-cubic11 text-[28px] leading-none text-text-main"
            type="button"
            aria-label="關閉新增好友彈窗"
          >
            ×
          </button>
        </header>

        <div class="grid gap-5 px-6 py-6 max-sm:gap-4 max-sm:px-4 max-sm:py-5">
          <label class="grid gap-2" for="friend-search">
            <span class="text-[20px] leading-none text-text-main max-sm:text-lg">搜尋好友</span>
            <input
              id="friend-search"
              class="min-h-[54px] w-full rounded-none border-[1.5px] border-[#A8C893] bg-[#FFFDF4] px-5 font-cubic11 text-[21px] leading-none text-text-main outline-none placeholder:text-[#858A7A] focus:border-[#7DB968] focus:shadow-[inset_0_0_0_1px_#7DB968] max-sm:min-h-12 max-sm:px-4 max-sm:text-[19px]"
              type="search"
              placeholder="輸入名稱或 BuJo ID"
            />
          </label>

          <div class="grid gap-2">
            <p class="m-0 text-[18px] leading-none text-[#86AD70] max-sm:text-base">搜尋結果</p>

            <article
              class="grid grid-cols-[auto_1fr_auto] items-center gap-4 border-[1.5px] border-[#A8C893] bg-[#FFFDF4] px-5 py-4 max-sm:grid-cols-[auto_1fr] max-sm:gap-x-3 max-sm:gap-y-4 max-sm:px-4"
            >
              <div
                class="grid size-12 shrink-0 place-items-center bg-[linear-gradient(#4A5040_0_0)] [clip-path:polygon(25%_12%,75%_12%,75%_25%,88%_25%,88%_75%,75%_75%,75%_88%,25%_88%,25%_75%,12%_75%,12%_25%,25%_25%)]"
                aria-hidden="true"
              >
                <div
                  class="size-7 bg-[#DDF3AE] [clip-path:polygon(0_25%,25%_25%,25%_0,75%_0,75%_25%,100%_25%,100%_75%,75%_75%,75%_100%,25%_100%,25%_75%,0_75%)]"
                ></div>
              </div>

              <div class="min-w-0">
                <h2 class="m-0 truncate text-[23px] font-bold leading-tight text-text-main">
                  朋友1號
                </h2>
              </div>

              <button
                class="min-h-11 whitespace-nowrap border-2 border-text-main bg-[#FFFDF4] px-5 py-2 font-cubic11 text-[20px] font-bold leading-none text-text-main shadow-[4px_4px_0_#4A5040] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[2px_2px_0_#4A5040] max-sm:col-span-2 max-sm:w-full"
                type="button"
              >
                ＋ 加好友
              </button>
            </article>
          </div>
        </div>
      </div>
    </section>
  </Teleport>
</template>

<script setup>
defineProps({
  isOpen: Boolean,
})
const emit = defineEmits(['close'])

const handleClose = () => {
  emit('close')
}
</script>
