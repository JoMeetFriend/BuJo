<template>
  <div class="w-full max-w-7xl mx-auto bg-page-bg text-brand-text font-cubic11">
    <!-- Sticky Header -->
    <header
      class="sticky top-0 z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 px-5 pt-8 pb-4 md:px-14 bg-page-bg"
    >
      <div class="flex items-baseline gap-4">
        <h1
          class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl"
          style="text-shadow: 2px 2px 0px #e4ded1"
        >
          活動
        </h1>
        <span class="text-base font-pixel text-primary-mid tracking-widest uppercase">
          ACTIVITY
        </span>
      </div>

      <div class="flex gap-2.5 overflow-x-auto scrollbar-hide pb-0.5 touch-pan-x">
        <button
          v-for="item in filters"
          :key="item.key"
          @click="currentFilter = item.key"
          class="filter-btn"
          :class="currentFilter === item.key ? 'filter-btn--active' : 'filter-btn--inactive'"
        >
          {{ item.text }}
        </button>
      </div>
    </header>

    <!-- 內容區 -->
    <div class="px-5 pt-2 pb-4 md:px-14 md:py-4">
      <div v-if="loading" class="text-center py-12 text-sm text-primary-mid">載入中...</div>

      <div v-else-if="fetchError" class="text-center py-12 text-sm text-red-500">{{ fetchError }}</div>

      <ul
        v-else-if="filteredActivities.length > 0"
        class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6"
      >
        <li
          v-for="activity in filteredActivities"
          :key="activity.id"
          @click="goToDetail(activity.id)"
          class="border-[1.5px] border-[#4A5040] rounded-none bg-white flex flex-col justify-between cursor-pointer overflow-hidden transition-all duration-200 ease-in-out hover:-translate-x-1 hover:-translate-y-1 hover:shadow-[4px_4px_0px_0px_#4A5040]"
        >
          <div
            class="h-14 flex items-center justify-center border-b-[1.5px] border-[#4A5040] shrink-0"
            :class="STATUS_MAP[activity.status]?.topBg"
          >
            <svg class="h-6 w-6 text-brand-text" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z"
              />
            </svg>
          </div>

          <div class="p-4 flex flex-col flex-grow bg-white justify-between gap-4">
            <h2 class="card-title truncate mb-2">{{ activity.title }}</h2>

            <div class="flex flex-col gap-y-1.5 text-xs text-brand-text">
              <div class="flex items-center gap-1.5">
                <span>🕒</span>
                <span>{{ activity.date }} {{ activity.time }}</span>
              </div>
              <div class="flex items-center gap-1.5 truncate">
                <span>📍</span>
                <span class="truncate">{{ activity.location || '未設定地點' }}</span>
              </div>
            </div>

            <div class="flex items-end justify-between border-t border-[#4A5040] pt-3">
              <div class="flex items-center overflow-hidden h-7">
                <template v-for="participant in activity.participants" :key="participant.id">
                  <img
                    v-if="participant.avatar_url"
                    class="inline-block h-6 w-6 rounded-none border border-brand-text object-cover shrink-0"
                    :src="participant.avatar_url"
                    alt="Avatar"
                  />
                  <div
                    v-else
                    class="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-brand-text bg-[#DEF4CD] text-[9px] font-bold text-brand-text"
                  >
                    {{ participant.id.slice(0, 2).toUpperCase() }}
                  </div>
                </template>

                <span
                  v-if="activity.current_count > 5"
                  class="flex items-center justify-center h-6 w-6 rounded-none border border-brand-text bg-page-bg text-[10px] font-bold text-brand-text shrink-0"
                >
                  +{{ activity.current_count - 5 }}
                </span>
              </div>

              <div class="flex flex-col items-end gap-1.5">
                <span
                  class="text-[11px] border border-brand-text py-0.5 bg-white text-brand-text w-[76px] text-center block whitespace-nowrap"
                  :class="
                    activity.status === 'recruiting' && activity.max_participants && activity.max_participants - activity.current_count > 0
                      ? 'visible'
                      : 'invisible'
                  "
                >
                  還差 {{ activity.max_participants - activity.current_count }} 人
                </span>

                <span
                  class="inline-flex items-center justify-center py-0.5 rounded-none text-xs font-bold border border-brand-text w-[76px] text-center whitespace-nowrap text-brand-text"
                  :class="STATUS_MAP[activity.status]?.badgeBg"
                >
                  {{ STATUS_MAP[activity.status]?.text ?? activity.status }}
                </span>
              </div>
            </div>
          </div>
        </li>
      </ul>

      <div v-else class="text-center py-12 text-lg border border-dashed border-brand-text bg-white">
        目前沒有相關活動
      </div>

      <ActivityDetailModal
        :is-open="isModalOpen"
        :activity-id="selectedActivityId"
        @close="handleModalClose"
        @status-changed="fetchActivities"
      />
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityDetailModal from './ActivityDetailModal.vue'

const STATUS_MAP = {
  recruiting: {
    text: '揪團中',
    topBg: 'bg-primary-pale',
    badgeBg: 'bg-primary-green',
  },
  confirmed: {
    text: '已成團',
    topBg: 'bg-primary-light',
    badgeBg: 'bg-primary-light',
  },
  cancelled: {
    text: '已取消',
    topBg: 'bg-warm-peach',
    badgeBg: 'bg-warm-peach',
  },
}

const filters = [
  { key: 'all', text: '全部' },
  { key: 'mine', text: '我建立的' },
  { key: 'joined', text: '我報名的' },
  { key: 'recruiting', text: '揪團中' },
  { key: 'confirmed', text: '已成團' },
]

const activities = ref([])
const loading = ref(false)
const fetchError = ref('')
const currentFilter = ref('all')
const isModalOpen = ref(false)
const selectedActivityId = ref(null)

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') return activities.value
  if (currentFilter.value === 'mine') return activities.value.filter((a) => a.is_creator)
  if (currentFilter.value === 'joined') return activities.value.filter((a) => !a.is_creator)
  return activities.value.filter((a) => a.status === currentFilter.value)
})

async function fetchActivities() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities`, {
      credentials: 'include',
    })
    if (!res.ok) {
      fetchError.value = '無法載入活動'
      return
    }
    const data = await res.json()
    activities.value = data.activities
  } catch {
    fetchError.value = '無法連線到伺服器'
  } finally {
    loading.value = false
  }
}

function goToDetail(id) {
  selectedActivityId.value = id
  isModalOpen.value = true
}

function handleModalClose() {
  isModalOpen.value = false
  selectedActivityId.value = null
}

onMounted(fetchActivities)
</script>

<style scoped>
.card-title {
  font-family: cubic11, monospace;
  font-weight: 900;
  font-size: 0.875rem;
  color: #4a5040;
  -webkit-text-stroke: 0.5px #4a5040;
}

.scrollbar-hide {
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

.filter-btn {
  font-family: cubic11, monospace;
  font-weight: 900;
  font-size: 12px;
  padding: 6px 16px;
  border: 2px solid #4a5040;
  cursor: pointer;
  white-space: nowrap;
  flex-shrink: 0;
  transition:
    transform 0.15s ease-out,
    box-shadow 0.15s ease-out,
    background 0.15s,
    color 0.15s;
}

.filter-btn--active {
  background: #4a5040;
  color: #fef7e8;
  transform: translate(2px, 2px);
  box-shadow: none;
}

.filter-btn--inactive {
  background: white;
  color: #4a5040;
  box-shadow: 3px 3px 0 #4a5040;
}

.filter-btn--inactive:hover {
  transform: translate(2px, 2px);
  box-shadow: none;
}
</style>
