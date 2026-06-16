<script setup>
import { computed } from 'vue'

const props = defineProps({
  date: {
    type: String,
    required: true,
  },
  events: {
    type: Array,
    default: () => [],
  },
})

const emit = defineEmits(['close', 'add'])

const formattedDate = computed(() => {
  const parts = props.date.split('-')

  if (parts.length !== 3) {
    return props.date
  }

  const [, month, day] = parts
  return `${Number(month)} 月 ${Number(day)} 日`
})

const statusLabel = {
  joined: '已報名',
  formed: '已成團',
  personal: '個人',
  recruiting: '招募中',
}

const statusClass = {
  joined: 'border-[#87A76B] bg-[#87C06D]/40 text-[#4A5040]',
  formed: 'border-[#5e9b57] bg-[#5e9b57] text-white',
  personal: 'border-[#F9CE9A] bg-[#F9CE9A] text-[#4A5040]',
  recruiting: 'border-[#87A76B] bg-[#DEF4CD] text-[#4A5040]',
}
</script>

<template>
  <div class="fixed inset-0 z-40 flex items-center justify-center px-4 pb-16 md:pb-0">
    <button
      type="button"
      class="absolute inset-0 cursor-pointer bg-[#4A5040]/25"
      aria-label="關閉日期彈窗"
      @click="emit('close')"
    ></button>

    <section
      class="relative z-10 w-full max-w-[440px] border-2 border-[#4A5040] bg-[#FEF7E8] shadow-[5px_5px_0_#4A5040]"
      role="dialog"
      aria-modal="true"
      :aria-label="formattedDate"
    >
      <header
        class="flex h-[62px] items-center justify-between border-b border-[#9DBD86] bg-[#DEF4CD] px-4 md:px-5"
      >
        <h2 class="font-[cubic11] text-[20px] font-black tracking-[0.16em] text-[#4A5040]">
          {{ formattedDate }}
        </h2>

        <div class="flex items-center gap-5 text-[#4A5040]">
          <button
            type="button"
            class="font-[cubic11] text-[18px] leading-none hover:opacity-70"
            aria-label="新增行程"
            @click="emit('add')"
          >
            +
          </button>
          <button
            type="button"
            class="font-[cubic11] text-[18px] leading-none hover:opacity-70"
            aria-label="關閉"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
      </header>

      <div class="min-h-[114px] px-4 py-4 md:px-[18px]">
        <div v-if="events.length" class="flex flex-col gap-3">
          <article
            v-for="event in events"
            :key="event.id"
            class="flex min-h-[60px] items-center border border-[#9DBD86] bg-white px-2 text-[#4A5040] md:px-3"
          >
            <svg
              class="mr-2 h-7 w-7 shrink-0 md:mr-3 md:h-9 md:w-9"
              viewBox="0 0 36 36"
              aria-hidden="true"
            >
              <path
                d="M4 28h28v4H4zM4 24h4v4H4zM8 20h4v4H8zM12 16h4v4h-4zM16 12h4v4h-4zM20 16h4v4h-4zM24 20h4v4h-4zM28 24h4v4h-4zM12 24h4v4h-4z"
                fill="currentColor"
              />
            </svg>

            <div class="min-w-0 flex-1">
              <h3 class="font-[cubic11] text-[15px] font-black leading-tight">
                {{ event.title }}
              </h3>
              <p class="mt-1 truncate font-[cubic11] text-[10px] text-[#9DBD86] md:text-[12px]">
                {{ event.time || '未設定時間' }}
                <span v-if="event.location"> ・ {{ event.location }}</span>
              </p>
            </div>

            <span
              class="ml-2 shrink-0 border px-1.5 py-1 font-[cubic11] text-[11px] md:ml-3 md:px-2 md:text-[12px]"
              :class="statusClass[event.status] || statusClass.formed"
            >
              {{ statusLabel[event.status] || '已成團' }}
            </span>
          </article>
        </div>

        <div
          v-else
          class="flex min-h-[82px] flex-col items-center justify-center text-center font-[cubic11] text-[#9DBD86]"
        >
          <p class="text-[16px]">這天還沒有行程</p>
          <p class="mt-1 text-[12px]">點右上角 ＋ 新增</p>
        </div>
      </div>
    </section>
  </div>
</template>
