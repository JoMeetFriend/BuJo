<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFriendStore } from '@/stores/friendStore'
import FriendAddModal from './FriendAddModal.vue'
import PixelButton from './ui/PixelButton.vue'

const friendStore = useFriendStore()
const { friends, isLoading, error } = storeToRefs(friendStore)

const isModalOpen = ref(false)

const brokenImages = ref(new Set())

const handleImageError = (id) => {
  brokenImages.value.add(id)
}

onMounted(() => {
  friendStore.fetchFriends()
})
</script>

<template>
  <div class="bg-[#FEF7E8]">
    <!-- Sticky Header -->
    <header
      class="sticky top-0 z-10 flex items-center justify-between px-5 pt-8 pb-4 md:px-14 bg-[#FEF7E8]"
    >
      <div class="flex items-baseline gap-4">
        <h1
          class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl"
          style="text-shadow: 2px 2px 0px #e4ded1"
        >
          好友
        </h1>
        <span class="font-['Press_Start_2P'] text-[#9DBD86] text-base tracking-widest uppercase"
          >FRIENDS</span
        >
      </div>
      <PixelButton @click="isModalOpen = true">＋ 新增好友</PixelButton>
    </header>

    <!-- 內容區 -->
    <div class="flex flex-col gap-4 px-5 pt-2 pb-4 md:px-14 md:py-4">
      <div v-if="isLoading" class="text-[#4A5040] font-[cubic11]">資料載入中...</div>
      <div v-else-if="error" class="text-red-500 font-[cubic11]">發生錯誤：{{ error }}</div>

      <div v-else>
        <div v-if="friends?.length === 0" class="text-[#9DBD86] font-[cubic11]">
          目前還沒有好友喔！
        </div>

        <!-- 好友列表 -->
        <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div
            v-for="friend in friends"
            :key="friend.id"
            class="flex items-center gap-3 p-3 border-[2px] border-[#9DBD86] bg-white"
          >
            <img
              v-if="friend.avatar_url && !brokenImages.has(friend.id)"
              :src="friend.avatar_url"
              alt="好友頭像"
              @error="handleImageError(friend.id)"
              class="w-10 h-10 border-[2px] border-[#4A5040] shrink-0 object-cover"
            />
            <div v-else class="w-10 h-10 bg-[#DEF4CD] border-[2px] border-[#4A5040] shrink-0"></div>

            <div class="flex flex-col gap-[2px]">
              <span class="font-[cubic11] font-semibold text-[#4A5040] text-sm">{{
                friend.display_name
              }}</span>
              <span class="font-[cubic11] text-[#9DBD86] text-xs">好友</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <FriendAddModal :isOpen="isModalOpen" @close="isModalOpen = false" />
</template>
