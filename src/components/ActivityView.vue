<script setup>
import { ref, computed } from 'vue'
import ActivityDetailModal from './ActivityDetailModal.vue'

const activities = ref([
  {
    id: 1,
    title: '上課',
    isMine: true,
    date: '6/11',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    status: 'registered',
    participants: [
      {
        id: 101,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 102,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 103,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 104,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 105,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 106,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 107,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
    ],
    currentCount: 7,
    maxParticipants: 8,
  },
  {
    id: 2,
    title: '來揪來揪來揪',
    isMine: false,
    date: '6/12',
    time: '09:00 - 17:00',
    location: '台北某某某某地',
    status: 'open',
    participants: [
      {
        id: 101,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 102,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 103,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
    ],
    currentCount: 3,
    maxParticipants: 14,
  },
  {
    id: 3,
    title: '吃下午茶',
    isMine: false,
    date: '6/13',
    time: '15:00 - 17:00',
    location: '某地',
    status: 'success',
    participants: [
      {
        id: 101,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 102,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 103,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 104,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
      {
        id: 105,
        avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg',
      },
    ],
    currentCount: 5,
    maxParticipants: 5,
  },
])

const STATUS_MAP = {
  registered: {
    text: '已報名',
    topBg: 'bg-warm-peach',
    badgeBg: 'bg-warm-peach',
  },
  open: {
    text: '揪團中',
    topBg: 'bg-primary-pale',
    badgeBg: 'bg-primary-green',
  },
  success: {
    text: '已成團',
    topBg: 'bg-primary-light',
    badgeBg: 'bg-primary-light',
  },
}

const filters = [
  { key: 'all', text: '全部' },
  { key: 'mine', text: '我建立的活動' },
  { key: 'registered', text: '已報名' },
  { key: 'open', text: '揪團中' },
  { key: 'success', text: '已成團' },
]

const currentFilter = ref('all')

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') {
    return activities.value
  }
  if (currentFilter.value === 'mine') {
    return activities.value.filter((act) => act.isMine)
  }
  return activities.value.filter((act) => act.status === currentFilter.value)
})

const isModalOpen = ref(false)
const selectedActivityId = ref(null)

const goToDetail = (id) => {
  selectedActivityId.value = id
  isModalOpen.value = true
}
</script>

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
      <ul
        v-if="filteredActivities.length > 0"
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
                <span class="truncate">{{ activity.location }}</span>
              </div>
            </div>

            <div class="flex items-end justify-between border-t border-[#4A5040] pt-3">
              <div class="flex items-center overflow-hidden h-7">
                <img
                  v-for="participant in activity.participants.slice(0, 5)"
                  :key="participant.id"
                  class="inline-block h-6 w-6 rounded-none border border-brand-text object-cover shrink-0"
                  :src="participant.avatar"
                  alt="Avatar"
                />

                <span
                  v-if="activity.currentCount > 5"
                  class="flex items-center justify-center h-6 w-6 rounded-none border border-brand-text bg-page-bg text-[10px] font-bold text-brand-text shrink-0"
                >
                  +{{ activity.currentCount - 5 }}
                </span>
              </div>

              <div class="flex flex-col items-end gap-1.5">
                <span
                  class="text-[11px] border border-brand-text py-0.5 bg-white text-brand-text w-[76px] text-center block whitespace-nowrap"
                  :class="
                    activity.status !== 'success' &&
                    activity.maxParticipants - activity.currentCount > 0
                      ? 'visible'
                      : 'invisible'
                  "
                >
                  還差 {{ activity.maxParticipants - activity.currentCount }} 人
                </span>

                <span
                  class="inline-flex items-center justify-center py-0.5 rounded-none text-xs font-bold border border-brand-text w-[76px] text-center whitespace-nowrap text-brand-text"
                  :class="STATUS_MAP[activity.status]?.badgeBg"
                >
                  {{ STATUS_MAP[activity.status]?.text }}
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
        :is-owner-view="currentFilter === 'mine'"
        @close="isModalOpen = false"
      />
    </div>
  </div>
</template>

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
    color 0.15s,
    border-color 0.15s;
}

.filter-btn--active {
  background: #87c06d;
  color: white;
  transform: translate(3px, 3px);
  box-shadow: 0 0 0 #4a5040;
}

.filter-btn--inactive {
  background: white;
  color: #4a5040;
  box-shadow: 3px 3px 0 #4a5040;
}

.filter-btn--inactive:hover {
  background: #d9eef2;
  color: #0e7490;
  border-color: #0e7490;
  box-shadow: 3px 3px 0 #0e7490;
}
</style>
