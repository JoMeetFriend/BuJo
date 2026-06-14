<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-[#4A5040]/40 cursor-pointer" @click="handleClose"></div>

      <div
        v-if="currentActivity"
        class="relative w-full max-w-[460px] bg-[#FEF7E8] border-[1.5px] border-[#4A5040] shadow-[6px_6px_0px_0px_#4A5040] z-10 flex flex-col font-cubic11 text-[#4A5040] select-none"
      >
        <div
          class="flex justify-between items-center px-4 py-3 border-b-[1.5px] border-[#4A5040] bg-[#D9F0A8]"
        >
          <h3 class="text-xl font-bold tracking-wider">{{ currentActivity.title }}</h3>
          <button
            @click="handleClose"
            class="font-pixel text-sm hover:scale-110 transition-transform p-1"
          >
            ✕
          </button>
        </div>

        <div class="p-6 flex flex-col gap-5">
          <div class="flex gap-2 items-center h-12">
            <div
              class="h-12 w-12 flex items-center justify-center border-[1.5px] border-[#4A5040] bg-[#DEF4CD]"
            >
              <svg class="h-6 w-6 text-[#4A5040]" fill="currentColor" viewBox="0 0 24 24">
                <path
                  d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z"
                />
              </svg>
            </div>
            <span
              class="inline-flex items-center justify-center py-0.5 rounded-none text-xs font-bold border border-[#4A5040] w-[76px] text-center whitespace-nowrap"
              :class="STATUS_MAP[currentActivity.status]?.badgeBg"
              :style="{ color: STATUS_MAP[currentActivity.status]?.color }"
            >
              {{ STATUS_MAP[currentActivity.status]?.text }}
            </span>
          </div>

          <div class="flex flex-col gap-3 text-base">
            <div>
              <div class="text-sm text-[#4A5040] font-pixel mb-0.5">時間</div>
              <div class="font-['Nunito'] font-semibold">
                {{ currentActivity.date }} {{ currentActivity.time }}
              </div>
            </div>

            <div>
              <div class="text-sm text-[#4A5040] font-pixel mb-0.5">地點</div>
              <div>{{ currentActivity.location }}</div>
            </div>
          </div>

          <div class="border-b border-[#DEF4CD] pb-4 flex flex-col gap-2">
            <div class="text-sm text-[#4A5040] font-pixel">參加成員</div>

            <div class="flex items-center gap-1.5 h-6">
              <div class="flex items-center overflow-hidden">
                <img
                  v-for="participant in currentActivity?.participants?.slice(0, 5)"
                  :key="participant.id"
                  class="inline-block h-6 w-6 rounded-none border border-[#4A5040] object-cover shrink-0 bg-[#DEF4CD]"
                  :src="participant.avatar"
                  alt="Avatar"
                />

                <span
                  v-if="currentActivity?.currentCount > 5"
                  class="relative z-10 flex items-center justify-center h-6 w-6 rounded-none border border-[#4A5040] bg-[#FEF7E8] text-[10px] font-bold text-[#4A5040] shrink-0"
                >
                  +{{ currentActivity.currentCount - 5 }}
                </span>
              </div>

              <span class="text-sm ml-2">
                {{ currentActivity.currentCount }} / {{ currentActivity.maxParticipants }} 人
              </span>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button
            @click="handleClose"
            class="bg-[#FEF7E8] border-2 border-[#4A5040] shadow-[3px_3px_0_#4A5040] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#4A5040] px-5 py-1.5 text-sm font-bold transition-all"
          >
            關閉
          </button>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  isOpen: Boolean,
  activityId: Number,
})

const emit = defineEmits(['close'])

const mockActivities = [
  {
    id: 1,
    title: 'KTV',
    date: '2026-06-02',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    status: 'joined',
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
    ],

    currentCount: 4,
    maxParticipants: 6,
  },
  {
    id: 2,
    title: '小酌',
    date: '2026-06-04',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    status: 'personal',
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
    ],

    currentCount: 4,
    maxParticipants: 6,
  },
  {
    id: 3,
    title: '晚餐',
    date: '2026-06-05',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    status: 'formed',
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
    ],

    currentCount: 4,
    maxParticipants: 6,
  },
  {
    id: 4,
    title: '爬山',
    date: '2026-06-10',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    status: 'joined',
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
    ],

    currentCount: 4,
    maxParticipants: 6,
  },
  {
    id: 6,
    title: '歌唱',
    date: '2026-06-18',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    status: 'formed',
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
    ],

    currentCount: 4,
    maxParticipants: 6,
  },
]

const STATUS_MAP = {
  joined: {
    text: '已報名',
    color: '#FEF7E8',
    badgeBg: 'bg-[#87C06D]',
  },
  formed: {
    text: '已成團',
    color: '#4A5040',
    badgeBg: 'bg-[#D9F0A8]',
  },
  personal: {
    text: '個人行程',
    color: '#4A5040',
    badgeBg: 'bg-[#DEF4CD]',
  },
}

const currentActivity = computed(() => {
  return mockActivities.find((act) => act.id === props.activityId) || null
})

const handleClose = () => {
  emit('close')
}
</script>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@600&display=swap');

.font-cubic11 {
  font-family: 'cubic11', sans-serif;
}
.font-pixel {
  font-family: 'Press Start 2P', monospace;
}
</style>
