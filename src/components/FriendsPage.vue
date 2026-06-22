<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useFriendStore } from '@/stores/friendStore'
import FriendAddModal from './FriendAddModal.vue'

const friendStore = useFriendStore()
const { friends, isLoading, error } = storeToRefs(friendStore)

const isModalOpen = ref(false)

onMounted(() => {
  friendStore.fetchFriends()
})
</script>

<template>
  <div class="flex flex-col gap-4 min-h-screen px-4 py-6 md:px-16 md:py-8 bg-[#FEF7E8]">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1
          class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl"
          style="text-shadow: 2px 2px 0px #e4ded1"
        >
          好友
        </h1>
        <span class="font-['Press_Start_2P'] text-[#9DBD86] text-xs md:text-sm">FRIENDS</span>
      </div>
      <button
        class="flex items-center gap-1 bg-[#87C06D] text-[#4A5040] font-[cubic11] font-black text-[12px] px-4 py-2 border-2 border-[#4A5040] shadow-[3px_3px_0px_#4A5040] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
        @click="isModalOpen = true"
      >
        ＋ 新增好友
      </button>
    </div>

    <div v-if="isLoading" class="text-[#4A5040] font-[cubic11]">資料載入中...</div>
    <div v-else-if="error" class="text-red-500 font-[cubic11]">發生錯誤：{{ error }}</div>

    <!-- 好友列表 -->
    <div v-else>
      <div v-if="friends.length === 0" class="text-[#9DBD86] font-[cubic11]">
        目前還沒有好友喔！
      </div>
      <div v-else class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="flex items-center gap-3 p-3 border-[2px] border-[#9DBD86] bg-white"
        >
          <img
            v-if="friend.avatar_url"
            :src="friend.avatar_url"
            alt="好友頭像"
            @error="friend.avatar_url = null"
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

  <FriendAddModal :isOpen="isModalOpen" @close="isModalOpen = false" />
</template>
