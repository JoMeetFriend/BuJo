<template>
  <BaseModal :isOpen="!isModalOpen" :title="formattedDate" @close="emit('close')">
    <template v-if="events.length && !isPastDate" #header-actions>
      <button
        type="button"
        class="grid h-7 w-7 place-items-center text-lg leading-none text-[var(--bujo-muted-strong)] transition-colors duration-150 hover:text-[var(--bujo-ink)] active:translate-x-px active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bujo-accent)]"
        aria-label="新增行程"
        @click="emit('add', props.date)"
      >
        +
      </button>
    </template>

    <template #default>
      <div class="min-h-[114px]">
        <div v-if="events.length" class="flex flex-col gap-3">
          <article
            v-for="event in events"
            :key="event.id"
            class="flex min-h-[60px] items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-2 text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)] md:px-3 cursor-pointer"
            @click="goToDetail(event.id)"
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
              <h3 class="font-[plex-sans-tc] text-[15px] font-bold leading-tight">
                {{ event.title }}
              </h3>
              <p
                class="mt-1 truncate font-[space-mono] text-[10px] text-[var(--bujo-muted-strong)] md:text-[12px]"
              >
                {{ event.time || '未設定時間' }}
                <span v-if="event.location"> ・ {{ event.location }}</span>
              </p>
            </div>

            <span
              class="ml-2 shrink-0 border border-[var(--bujo-ink)] px-1.5 py-1 font-[space-mono] text-[11px] text-[var(--bujo-ink)] md:ml-3 md:px-2 md:text-[12px]"
              :class="statusClass[event.status] || statusClass.formed"
            >
              {{ statusLabel[event.status] || '已成團' }}
            </span>
          </article>
        </div>

        <div
          v-else
          class="flex min-h-[82px] items-center justify-center gap-2 text-center text-[var(--bujo-muted-strong)]"
        >
          <p class="font-[plex-sans-tc] text-[15px]">{{ isPastDate ? '這天沒有行程' : '這天還沒有行程' }}</p>
          <button
            v-if="!isPastDate"
            type="button"
            class="grid h-8 w-8 place-items-center text-lg leading-none text-[var(--bujo-muted-strong)] transition-transform duration-150 hover:scale-125 hover:text-[var(--bujo-ink)] active:translate-x-px active:translate-y-px focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--bujo-accent)]"
            aria-label="新增行程"
            @click="emit('add', props.date)"
          >
            +
          </button>
        </div>
      </div>
    </template>
  </BaseModal>

  <BaseModal :isOpen="isModalOpen" title="活動詳情" bare @close="isModalOpen = false">
    <ActivityDetailModal
      :is-open="isModalOpen"
      :activity-id="selectedActivityId"
      closable
      @close="isModalOpen = false"
      @status-changed="emit('refresh')"
    />
  </BaseModal>
</template>

<script setup>
import { ref, computed } from 'vue'
import BaseModal from './ui/BaseModal.vue'
import ActivityDetailModal from './ActivityDetailModal.vue'

const isModalOpen = ref(false)
const selectedActivityId = ref(null)

const goToDetail = (id) => {
  selectedActivityId.value = id
  isModalOpen.value = true
}

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

const emit = defineEmits(['close', 'add', 'refresh'])

const isPastDate = computed(() => {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return props.date < todayStr
})

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
  joined: 'bg-[var(--bujo-card-blue)]',
  formed: 'bg-[var(--bujo-accent)]',
  personal: 'bg-[var(--bujo-surface)]',
  recruiting: 'bg-[var(--bujo-card-pink)]',
}
</script>
