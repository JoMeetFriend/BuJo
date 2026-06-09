<script setup>
import { ref } from 'vue'

const activities = ref([
  {
    id: 1,
    title: '上課',
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
    totalParticipants: 8,
  },
  {
    id: 2,
    title: '來揪來揪來揪',
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
    totalParticipants: 14,
  },
  {
    id: 3,
    title: '吃下午茶',
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
    totalParticipants: 5,
  },
])

// 對應圖片右下角狀態標籤底色（文字統一 #4A5040）
const STATUS_MAP = {
  registered: {
    text: '已報名',
    topBg: '#F9CE9A', // 比照圖片
    badgeBg: 'bg-[#F9CE9A]', // Warm Peach 點綴色
  },
  open: {
    text: '揪團中',
    topBg: '#DEF4CD', // Primary Pale
    badgeBg: 'bg-[#87C06D]', // Primary Green
  },
  success: {
    text: '已成團',
    topBg: '#D9F0A8', // 已成團活動條底色
    badgeBg: 'bg-[#D9F0A8]', // Primary Light
  },
}

const goToDetail = (id) => {
  alert(`準備進入活動 ID: ${id} 的詳情頁面！`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6 bg-[#FEF7E8] min-h-screen text-[#4A5040] font-cubic11">
    <div class="flex items-baseline gap-4 mb-6">
      <h1 class="text-4xl font-extrabold text-[#4A5040] tracking-wider">活動</h1>
      <span class="text-xl font-pixel text-[#9DBD86] tracking-widest uppercase"> ACTIVITY </span>
    </div>

    <ul class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      <li
        v-for="activity in activities"
        :key="activity.id"
        @click="goToDetail(activity.id)"
        class="border-[1.5px] border-[#9DBD86] rounded-none bg-white flex flex-col justify-between cursor-pointer overflow-hidden transition-transform active:translate-y-0.5"
      >
        <div
          class="h-20 flex items-center justify-center border-b-[1.5px] border-[#9DBD86] shrink-0"
          :style="{ backgroundColor: STATUS_MAP[activity.status]?.topBg }"
        >
          <svg class="h-10 w-10 text-[#4A5040]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z" />
          </svg>
        </div>

        <div class="p-4 flex flex-col flex-grow bg-white justify-between gap-4">
          <div class="flex flex-col gap-2">
            <h2 class="text-xl font-bold text-[#4A5040] truncate">{{ activity.title }}</h2>

            <div
              class="flex flex-col gap-y-1.5 text-sm text-[#4A5040] font-['Nunito'] font-semibold"
            >
              <div class="flex items-center gap-1.5">
                <span>🕒</span>
                <span>{{ activity.date }} {{ activity.time }}</span>
              </div>
              <div class="flex items-center gap-1.5 truncate">
                <span>📍</span>
                <span class="truncate font-cubic11">{{ activity.location }}</span>
              </div>
            </div>
          </div>

          <div class="flex items-end justify-between border-t border-[#DEF4CD] pt-3">
            <div class="flex gap-2 items-center overflow-hidden h-7">
              <img
                v-for="participant in activity.participants.slice(0, 5)"
                :key="participant.id"
                class="inline-block h-6 w-6 rounded-none border border-[#4A5040] object-cover"
                :src="participant.avatar"
                alt="Avatar"
              />

              <div
                v-if="activity.participants.length > 5"
                class="flex items-center justify-center h-6 w-6 rounded-none border border-[#4A5040] bg-[#FEF7E8] text-[10px] font-bold text-[#4A5040]"
              >
                +{{ activity.participants.length - 5 }}
              </div>
            </div>

            <div class="flex flex-col items-end gap-1.5">
              <span
                v-if="activity.status === 'success'"
                class="text-[11px] font-bold border border-[#4A5040] py-0.5 bg-white text-[#4A5040] w-[76px] text-center block whitespace-nowrap"
              >
                已成團
              </span>
              <span
                v-else-if="activity.totalParticipants - activity.participants.length > 0"
                class="text-[11px] font-bold border border-[#4A5040] py-0.5 bg-white text-[#4A5040] w-[76px] text-center block whitespace-nowrap font-['Nunito']"
              >
                還差 {{ activity.totalParticipants - activity.participants.length }} 人
              </span>

              <span
                class="inline-flex items-center justify-center py-0.5 rounded-none text-xs font-bold border border-[#4A5040] w-[76px] text-center whitespace-nowrap text-[#4A5040]"
                :class="STATUS_MAP[activity.status]?.badgeBg"
              >
                {{ STATUS_MAP[activity.status]?.text }}
              </span>
            </div>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>

<style scoped>
@import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=Nunito:wght@600&display=swap');

.font-cubic11 {
  font-family: 'cubic11', sans-serif;
}
.font-pixel {
  font-family: 'Press Start 2P', monospace;
}
</style>
