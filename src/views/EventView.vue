<script setup>
import { ref } from 'vue'

const activities = ref([
  {
    id: 1,
    title: '上課',
    date: '2026-07-15',
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
    ],
    totalParticipants: 8,
  },
  {
    id: 2,
    title: '來揪來揪來揪',
    date: '2026-08-01',
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
    date: '2026-09-10',
    time: '15:00 - 17:00',
    location: '某地',
    status: 'interested',
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
    totalParticipants: 5,
  },
  {
    id: 4,
    title: '唱歌',
    date: '2026-09-10',
    time: '18:00',
    location: '新北市.................',
    status: 'unregistered',
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
    totalParticipants: 3,
  },
  {
    id: 5,
    title: '上課',
    date: '2026-07-15',
    time: '18:00 - 22:00',
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
    ],
    totalParticipants: 8,
  },
  {
    id: 6,
    title: '打羽球',
    date: '2026-08-01',
    time: '09:00 - 17:00',
    location: '台北市..........',
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
    id: 7,
    title: '吃飯',
    date: '2026-09-10',
    time: '18:00',
    location: '台北',
    status: 'interested',
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
    totalParticipants: 3,
  },
  {
    id: 8,
    title: '打球',
    date: '2026-09-10',
    time: '17:00',
    location: '台北',
    status: 'unregistered',
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
    totalParticipants: 3,
  },
])

const STATUS_MAP = {
  registered: {
    text: '已報名',
    className: 'bg-[#87C06D] text-[#FFFFFF] border-[#87C06D]',
  },
  open: {
    text: '揪團中',
    className: 'bg-[#D9F0A8] text-[#2B2E24] border-[#D9F0A8]',
  },
  interested: {
    text: '有興趣',
    className: 'bg-[#F9CE9A] text-[#2B2E24] border-[#F9CE9A]',
  },
  unregistered: {
    text: '未報名',
    className: 'bg-[#FAF8F4] text-[#9DBD86] border-[#DEF4CD]',
  },
}

const goToDetail = (id) => {
  alert(`準備進入活動 ID: ${id} 的詳情頁面！`)
}
</script>

<template>
  <div class="max-w-7xl mx-auto p-6 bg-[#FAF8F4] min-h-screen">
    <h1 class="text-[28px] font-extrabold tracking-tight text-[#2B2E24] mb-6">所有活動</h1>

    <ul class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      <li
        v-for="activity in activities"
        :key="activity.id"
        @click="goToDetail(activity.id)"
        class="border-[1.5px] border-[#DEF4CD] rounded-[16px] bg-white transition flex flex-col justify-between cursor-pointer overflow-hidden"
      >
        <div class="p-4 flex flex-col gap-3 bg-white">
          <div class="flex items-center gap-3">
            <div class="text-[#9DBD86] shrink-0">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                class="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
            <h2 class="text-2xl font-bold text-[#2B2E24] truncate">{{ activity.title }}</h2>
          </div>
        </div>

        <div class="p-4 flex flex-col gap-4 bg-white">
          <div class="flex flex-col gap-y-1.5 text-sm text-[#4A5040]">
            <div>📅 {{ activity.date }}</div>
            <div>⏰ {{ activity.time }}</div>
            <div class="truncate">📍 {{ activity.location }}</div>
          </div>

          <div class="flex items-center justify-between border-t border-[#DEF4CD] pt-3">
            <div class="flex -space-x-1 overflow-hidden">
              <img
                v-for="participant in activity.participants"
                :key="participant.id"
                class="inline-block h-8 w-8 rounded-full ring-1 ring-white object-cover"
                :src="participant.avatar"
                alt="Avatar"
              />
              <div
                v-if="activity.totalParticipants - activity.participants.length > 0"
                class="flex items-center justify-center h-8 w-8 rounded-full ring-1 ring-white bg-[#FAF8F4] text-[10px] font-bold text-[#4A5040]"
              >
                +{{ activity.totalParticipants - activity.participants.length }}
              </div>
            </div>

            <span
              class="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold border"
              :class="STATUS_MAP[activity.status]?.className"
            >
              {{ STATUS_MAP[activity.status]?.text }}
            </span>
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
