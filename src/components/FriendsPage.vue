<script setup>
import { ref } from 'vue'
import FriendAddModal from './FriendAddModal.vue'
import PixelButton from './ui/PixelButton.vue'

const friends = [
  { id: 1, name: '小美' },
  { id: 2, name: '阿傑' },
  { id: 3, name: '庭庭' },
  { id: 4, name: '大雄' },
  { id: 5, name: '欣欣' },
  { id: 6, name: '阿翔' },
  { id: 7, name: '語安' },
  { id: 8, name: '小布' },
]
const isModalOpen = ref(false)
</script>

<template>
  <div class="bg-[#FEF7E8]">
    <!-- Sticky Header -->
    <header class="sticky top-0 z-10 flex items-center justify-between px-5 pt-8 pb-4 md:px-14 bg-[#FEF7E8]">
      <div class="flex items-baseline gap-4">
        <h1
          class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl"
          style="text-shadow: 2px 2px 0px #e4ded1"
        >
          好友
        </h1>
        <span class="font-['Press_Start_2P'] text-[#9DBD86] text-base tracking-widest uppercase">FRIENDS</span>
      </div>
      <PixelButton @click="isModalOpen = true">＋ 新增好友</PixelButton>
    </header>

    <!-- 內容區 -->
    <div class="flex flex-col gap-4 px-5 pt-2 pb-4 md:px-14 md:py-4">
      <!-- 好友列表 -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div
          v-for="friend in friends"
          :key="friend.id"
          class="flex items-center gap-3 p-3 border-[2px] border-[#9DBD86] bg-white"
        >
          <div class="w-10 h-10 bg-[#DEF4CD] border-[2px] border-[#4A5040] shrink-0"></div>
          <div class="flex flex-col gap-[2px]">
            <span class="font-[cubic11] font-semibold text-[#4A5040] text-sm">{{ friend.name }}</span>
            <span class="font-[cubic11] text-[#9DBD86] text-xs">好友</span>
          </div>
        </div>
      </div>
    </div>
  </div>
  <FriendAddModal :isOpen="isModalOpen" @close="isModalOpen = false" />
</template>

