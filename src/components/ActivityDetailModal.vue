<template>
  <BaseModal
    :isOpen="isOpen && !showPicker"
    :title="currentActivity?.title || '活動詳情'"
    maxWidth="440px"
    @close="handleClose"
  >
    <template #default>
      <div v-if="currentActivity" class="flex flex-col gap-5 select-none">
        <!-- 封面佔位 -->
        <div
          class="h-32 flex items-center justify-center border-[1.5px] border-[#4A5040] bg-[#DEF4CD]"
        >
          <svg class="h-12 w-12 text-[#4A5040]" fill="currentColor" viewBox="0 0 24 24">
            <path
              d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z"
            />
          </svg>
        </div>

        <!-- 發起人 -->
        <div class="flex items-center gap-2 text-sm">
          <div
            class="w-6 h-6 border border-[#4A5040] flex items-center justify-center bg-white"
          >
            <span class="text-xs">⭐</span>
          </div>
          <span>{{ currentActivity.host }} 發起</span>
        </div>

        <!-- 活動資訊 -->
        <div class="flex flex-col gap-3 text-sm">
          <div>
            <div class="text-xs text-[#87C06D] mb-0.5">時間</div>
            <div>{{ currentActivity.date }} {{ currentActivity.time }}</div>
          </div>
          <div>
            <div class="text-xs text-[#87C06D] mb-0.5">地點</div>
            <div>{{ currentActivity.location }}</div>
          </div>
          <div>
            <div class="text-xs text-[#87C06D] mb-0.5">費用</div>
            <div>{{ currentActivity.cost }} 元</div>
          </div>
          <div>
            <div class="text-xs text-[#87C06D] mb-0.5">備註</div>
            <div
              class="text-sm break-words whitespace-pre-wrap max-h-[4.5rem] overflow-y-auto pr-2 custom-scrollbar"
            >
              {{ currentActivity.memo }}
            </div>
          </div>
        </div>

        <!-- 報名人數 -->
        <div class="pb-2">
          <div class="text-xs text-[#87C06D] mb-2">
            已報名 {{ currentActivity.currentCount }} / {{ currentActivity.maxParticipants }}
          </div>
          <div class="flex gap-1.5 items-center h-6">
            <div class="flex items-center overflow-hidden h-7">
              <img
                v-for="participant in currentActivity.participants.slice(0, 5)"
                :key="participant.id"
                class="inline-block h-6 w-6 border border-[#4A5040] object-cover shrink-0"
                :src="participant.avatar"
                alt="Avatar"
              />
              <span
                v-if="currentActivity.currentCount > 5"
                class="flex items-center justify-center h-6 w-6 border border-[#4A5040] bg-[#FEF7E8] text-[10px] font-bold text-[#4A5040] shrink-0"
              >
                +{{ currentActivity.currentCount - 5 }}
              </span>
            </div>
            <span
              v-if="currentActivity.maxParticipants - currentActivity.currentCount > 0"
              class="text-[11px] font-bold border border-[#4A5040] px-2 py-0.5 bg-[#87C06D] text-white tracking-wider"
            >
              還差 {{ currentActivity.maxParticipants - currentActivity.currentCount }} 人
            </span>
          </div>
        </div>
      </div>
    </template>

    <template #footer>
      <PixelButton variant="white" type="button" @click="handleClose">關閉</PixelButton>
      <PixelButton v-if="isOwnerView" variant="danger" type="button" @click="handleCancelActivity">
        取消活動
      </PixelButton>
      <PixelButton v-else type="button" @click="handleSignUp">報名參加</PixelButton>
    </template>
  </BaseModal>

  <AvailabilityPickerModal
    v-model="showPicker"
    rangeStart="2026-06-11"
    rangeEnd="2026-06-17"
    @confirm="handlePickerConfirm"
  />
</template>

<script setup>
import { computed, ref } from 'vue'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'
import AvailabilityPickerModal from './AvailabilityPickerModal.vue'

const props = defineProps({
  isOpen: Boolean,
  activityId: Number,
  isOwnerView: Boolean,
})

const emit = defineEmits(['close', 'confirm'])

const showPicker = ref(false)

const mockActivities = [
  {
    id: 1,
    title: '上課',
    isMine: true,
    date: '6/11',
    time: '9:30 - 16:30',
    location: '臺北市中正區黎明里衡陽路7號5樓',
    host: 'AAA',
    memo: '無',
    cost: '100',
    participants: [
      { id: 101, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 102, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 103, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 104, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 105, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 106, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 107, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
    ],
    currentCount: 7,
    maxParticipants: 10,
  },
  {
    id: 2,
    title: '來揪來揪來揪',
    isMine: false,
    date: '6/12',
    time: '09:00 - 17:00',
    location: '台北大安森林公園大草皮',
    host: '小美',
    memo: '週末野餐趴！請自行攜帶野餐墊與一份你想跟大家分享的零食，下雨的話就改去室內桌遊店喔。週末野餐趴！請自行攜帶野餐墊與一份你想跟大家分享的零食，下雨的話就改去室內桌遊店喔。週末野餐趴！請自行攜帶野餐墊與一份你想跟大家分享的零食，下雨的話就改去室內桌遊店喔。',
    cost: '150',
    participants: [
      { id: 101, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 102, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 103, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
    ],
    currentCount: 3,
    maxParticipants: 6,
  },
  {
    id: 3,
    title: '吃下午茶',
    isMine: false,
    date: '6/13',
    time: '15:00 - 17:00',
    location: '某某像素風格咖啡廳',
    host: '老王',
    memo: '這家咖啡廳超難訂位！好不容易搶到 5 個人的位子，這次主要聊聊.........。',
    cost: '200',
    participants: [
      { id: 101, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 102, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 103, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 104, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
      { id: 105, avatar: 'https://i.pinimg.com/236x/68/ec/c3/68ecc3889935a9884a6a7a2caced803f.jpg' },
    ],
    currentCount: 5,
    maxParticipants: 5,
  },
]

const currentActivity = computed(() =>
  mockActivities.find((act) => act.id === props.activityId) || null,
)

const handleClose = () => emit('close')

const handleSignUp = () => {
  showPicker.value = true
}

const handlePickerConfirm = (result) => {
  emit('confirm', result)
  showPicker.value = false
  emit('close')
}

const handleCancelActivity = () => {
  // 點擊取消活動時
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a5040;
  border: 1px solid #fef7e8;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #87c06d;
}
</style>
