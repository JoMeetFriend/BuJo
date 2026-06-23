<template>
  <BaseModal :isOpen="isOpen" title="新增好友" @close="emit('close')">
    <div class="grid gap-4">
      <label class="grid gap-2" for="friend-search">
        <span class="text-sm leading-none" style="-webkit-text-stroke: 0.5px #4a5040"
          >搜尋好友</span
        >
        <input
          id="friend-search"
          class="min-h-[44px] w-full rounded-none border-[1.5px] border-[#A8C893] bg-white px-4 font-[cubic11] text-sm leading-none text-[#4A5040] outline-none placeholder:text-[#858A7A] focus:border-[#7DB968] focus:shadow-[inset_0_0_0_1px_#7DB968]"
          type="search"
          placeholder="輸入名稱或 BuJo ID"
        />
      </label>

      <div class="grid gap-2">
        <p class="m-0 text-xs leading-none text-[#87C06D]">搜尋結果</p>

        <article
          class="grid grid-cols-[auto_1fr_auto] items-center gap-3 border-[1.5px] border-[#A8C893] bg-white px-4 py-3 max-sm:grid-cols-[auto_1fr] max-sm:gap-x-3 max-sm:gap-y-3"
        >
          <div
            class="grid size-10 shrink-0 place-items-center bg-[linear-gradient(#4A5040_0_0)] [clip-path:polygon(25%_12%,75%_12%,75%_25%,88%_25%,88%_75%,75%_75%,75%_88%,25%_88%,25%_75%,12%_75%,12%_25%,25%_25%)]"
            aria-hidden="true"
          >
            <div
              class="size-6 bg-[#DDF3AE] [clip-path:polygon(0_25%,25%_25%,25%_0,75%_0,75%_25%,100%_25%,100%_75%,75%_75%,75%_100%,25%_100%,25%_75%,0_75%)]"
            ></div>
          </div>

          <div class="min-w-0">
            <h2 class="m-0 truncate text-sm font-semibold leading-tight text-[#4A5040]">朋友1號</h2>
          </div>

          <button
            class="min-h-[32px] whitespace-nowrap border-2 border-[#4A5040] bg-white px-4 py-1 font-[cubic11] text-[13px] font-bold leading-none text-[#4A5040] shadow-[3px_3px_0_#4A5040] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#4A5040] max-sm:col-span-2 max-sm:w-full"
            type="button"
          >
            ＋ 加好友
          </button>
        </article>
      </div>
    </div>
  </BaseModal>
</template>

<script setup>
import BaseModal from './ui/BaseModal.vue'

defineProps({
  isOpen: Boolean,
})
const emit = defineEmits(['close'])
</script>
