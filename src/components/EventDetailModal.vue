<template>
  <Teleport to="body">
    <div v-if="isOpen" class="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div class="fixed inset-0 bg-[#4A5040]/40 cursor-pointer" @click="handleOutsideClick"></div>

      <div
        v-if="currentActivity"
        class="relative w-full max-w-[560px] bg-[#FEF7E8] border-[1.5px] border-[#4A5040] shadow-[6px_6px_0px_0px_#4A5040] z-10 flex flex-col font-cubic11 text-[#4A5040] select-none"
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
          <div
            class="h-32 flex items-center justify-center border-[1.5px] border-[#4A5040] bg-[#DEF4CD]"
          >
            <svg class="h-12 w-12 text-[#4A5040]" fill="currentColor" viewBox="0 0 24 24">
              <path
                d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z"
              />
            </svg>
          </div>

          <div class="flex items-center gap-2 text-sm font-semibold">
            <div class="w-6 h-6 border border-[#4A5040] flex items-center justify-center bg-white">
              <span class="text-xs">⭐</span>
            </div>
            <span>{{ currentActivity.host }} 發起</span>
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

            <div>
              <div class="text-sm text-[#4A5040] font-pixel mb-0.5">備註</div>
              <div class="text-base">
                {{ currentActivity.memo }}
              </div>
            </div>
          </div>

          <div class="flex items-end justify-between border-t border-[#DEF4CD] pt-4">
            <div class="flex flex-col gap-2">
              <div class="text-sm font-bold">
                已報名 {{ currentActivity.currentCount }} / {{ currentActivity.maxParticipants }}
              </div>

              <div class="flex gap-1.5 items-center h-6">
                <div
                  class="w-6 h-6 border border-[#4A5040] bg-[#DEF4CD] flex items-center justify-center font-['Nunito'] text-[10px] font-bold"
                >
                  A1
                </div>
                <div
                  class="w-6 h-6 border border-[#4A5040] bg-[#F9CE9A] flex items-center justify-center font-['Nunito'] text-[10px] font-bold"
                >
                  A2
                </div>
                <div
                  class="w-6 h-6 border border-[#4A5040] bg-[#E9EF6E] flex items-center justify-center font-['Nunito'] text-[10px] font-bold"
                >
                  A3
                </div>

                <span
                  class="flex items-center justify-center h-6 w-6 rounded-none border border-[#4A5040] bg-[#FEF7E8] text-[10px] font-bold text-[#4A5040] font-['Nunito']"
                >
                  A4
                </span>
                <span
                  v-if="currentActivity.maxParticipants - currentActivity.currentCount > 0"
                  class="text-[11px] font-bold border border-[#4A5040] px-2 py-0.5 bg-[#87C06D] text-white font-['Nunito'] tracking-wider"
                >
                  還差 {{ currentActivity.maxParticipants - currentActivity.currentCount }} 人
                </span>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 px-6 pb-6 pt-2">
          <button
            @click="handleClose"
            class="bg-white border-2 border-[#4A5040] shadow-[3px_3px_0_#4A5040] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#4A5040] px-5 py-1.5 text-sm font-bold transition-all"
          >
            關閉
          </button>
          <button
            @click="handleSignUp"
            class="bg-[#87C06D] text-white border-2 border-[#4A5040] shadow-[3px_3px_0_#4A5040] active:translate-x-[2px] active:translate-y-[2px] active:shadow-[1px_1px_0_#4A5040] px-5 py-1.5 text-sm font-bold transition-all"
          >
            報名參加
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

const emit = defineEmits(['close', 'save-draft', 'sign-up'])

const detailedActivitiesMock = [
  {
    id: 1,
    title: '上課',
    date: '6/11',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    host: 'AAA',
    memo: '記得帶筆電...................................！',
    currentCount: 7,
    maxParticipants: 10,
  },
  {
    id: 2,
    title: '來揪來揪來揪',
    date: '6/12',
    time: '09:00 - 17:00',
    location: '台北大安森林公園大草皮',
    host: '小美',
    memo: '週末野餐趴！請自行攜帶野餐墊與一份你想跟大家分享的零食，下雨的話就改去室內桌遊店喔。',
    currentCount: 3,
    maxParticipants: 6,
  },
  {
    id: 3,
    title: '吃下午茶',
    date: '6/13',
    time: '15:00 - 17:00',
    location: '某某像素風格咖啡廳',
    host: '老王',
    memo: '這家咖啡廳超難訂位！好不容易搶到 5 個人的位子，這次主要聊聊.........。',
    currentCount: 5,
    maxParticipants: 5,
  },
]

const currentActivity = computed(() => {
  // if (props.activityId) {
  //   return detailedActivitiesMock.find((act) => Number(act.id) === Number(props.activityId)) || null
  // }

  // return detailedActivitiesMock[0]

  return detailedActivitiesMock.find((act) => act.id === props.activityId) || null
})

const handleOutsideClick = () => {
  emit('save-draft')
  emit('close')
}

const handleClose = () => {
  emit('close')
}

const handleSignUp = () => {
  emit('sign-up')
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
