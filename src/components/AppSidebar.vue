<script setup>
defineProps({
  isOpen: Boolean,
  filters: Object,
})
const emit = defineEmits(['toggle-filter'])

import { ref } from 'vue'
const drawerOpen = ref(false)

import { RouterLink } from 'vue-router'
</script>

<template>
  <!-- 桌機版側邊欄 -->
  <aside
    class="hidden md:flex flex-col justify-between bg-[#87C06D] border-r-0 py-6 transition-all duration-300 overflow-hidden"
    :class="isOpen ? 'w-[180px] px-4' : 'w-0 px-0'"
  >
    <div>
      <!-- Logo -->
      <div class="flex items-center gap-3 mb-10 whitespace-nowrap">
        <div class="w-10 h-10 bg-[#DEF4CD] shrink-0"></div>
        <span
          class="font-['Press_Start_2P'] text-[#E9EF6E] text-lg"
          style="text-shadow: 2px 2px 0px #4a5040"
          >BuJo</span
        >
      </div>

      <!-- 導覽項目 -->
      <nav class="flex flex-col gap-2">
        <RouterLink
          v-for="item in [
            { label: '月曆', sub: 'CALENDAR', to: '/calendar' },
            { label: '活動', sub: 'ACTIVITY', to: '/event' }, //這裡合併時改名
            { label: '好友', sub: 'FRIENDS', to: '/friends-page' },
            { label: '通知', sub: 'ALERTS', to: '/alerts' },
          ]"
          :key="item.sub"
          :to="item.to"
          class="flex items-center gap-3 px-3 py-2 hover:bg-[#F9CE9A] transition-colors whitespace-nowrap"
        >
          <div class="w-10 h-10 bg-[#DEF4CD] shrink-0"></div>
          <div class="flex flex-col gap-[2px]">
            <span class="font-[cubic11] font-semibold text-[#4A5040] text-[14px]">{{
              item.label
            }}</span>
            <span class="font-['Press_Start_2P'] text-[#4A5040] text-[10px]">{{ item.sub }}</span>
          </div>
        </RouterLink>
      </nav>
    </div>

    <!-- 下半：篩選 + 用戶 -->
    <div class="flex flex-col gap-3">
      <!-- 篩選按鈕 -->
      <div class="flex flex-col gap-2 px-3 whitespace-nowrap">
        <button
          v-for="item in [
            { key: 'joined', label: '報名ing', color: '#87C06D', opacity: true },
            { key: 'formed', label: '成團！', color: '#5e9b57', opacity: false },
            { key: 'personal', label: '個人行程', color: '#F9CE9A', opacity: false },
          ]"
          :key="item.key"
          @click="emit('toggle-filter', item.key)"
          class="flex items-center gap-2 transition-opacity"
          :class="filters[item.key] ? 'opacity-100' : 'opacity-40'"
        >
          <div
            class="w-4 h-4 shrink-0 border border-[#4A5040]"
            :style="{ backgroundColor: item.color, opacity: item.opacity ? 0.4 : 1 }"
          ></div>
          <span class="font-[cubic11] text-[#4A5040] text-[13px]">{{ item.label }}</span>
        </button>
      </div>

      <!-- 用戶 -->
      <RouterLink
        to="/profile/edit"
        class="flex items-center gap-3 px-3 py-2 hover:bg-[#F9CE9A] transition-colors whitespace-nowrap"
      >
        <div class="w-10 h-10 bg-[#DEF4CD] shrink-0"></div>
        <span class="font-['Press_Start_2P'] text-[#4A5040] text-xs">Me</span>
      </RouterLink>
    </div>
  </aside>

  <!-- 手機版底部導覽列 + 篩選抽屜 -->
  <div class="md:hidden">
    <!-- 篩選抽屜 -->
    <div
      v-if="drawerOpen"
      class="fixed bottom-0 left-0 right-0 bg-[#87C06D] px-6 pt-4 flex flex-col gap-3 z-50 pb-[80px]"
    >
      <button
        v-for="item in [
          { key: 'joined', label: '報名ing', color: '#87C06D', opacity: true },
          { key: 'formed', label: '成團！', color: '#5e9b57', opacity: false },
          { key: 'personal', label: '個人行程', color: '#F9CE9A', opacity: false },
        ]"
        :key="item.key"
        @click="emit('toggle-filter', item.key)"
        class="flex items-center gap-3 transition-opacity"
        :class="filters[item.key] ? 'opacity-100' : 'opacity-40'"
      >
        <div
          class="w-4 h-4 shrink-0 border border-[#4A5040]"
          :style="{ backgroundColor: item.color, opacity: item.opacity ? 0.4 : 1 }"
        ></div>
        <span class="font-[cubic11] text-[#4A5040] text-[14px]">{{ item.label }}</span>
      </button>
    </div>

    <!-- 導覽列 -->
    <nav
      class="fixed bottom-0 left-0 right-0 bg-[#87C06D] flex justify-around items-center py-3 z-50"
    >
      <!-- 箭頭按鈕：浮在導覽列上緣正中間 -->
      <button
        @click="drawerOpen = !drawerOpen"
        class="absolute left-1/2 -translate-x-1/2 bottom-full w-8 h-6 bg-[#87C06D] flex items-center justify-center text-[#4A5040] text-[10px] font-['Press_Start_2P']"
      >
        {{ drawerOpen ? '▼' : '▲' }}
      </button>

      <RouterLink
        v-for="item in [
          { name: '月曆', to: '/calendar' },
          { name: '活動', to: '/event' }, //這裡合併時改名
          { name: '好友', to: '/friends-page' },
          { name: '通知', to: '/alerts' },
          { name: 'Me', to: '/profile/edit' },
        ]"
        :key="item.name"
        :to="item.to"
        class="flex flex-col items-center"
        @click="drawerOpen = false"
      >
        <div class="w-8 h-8 bg-[#DEF4CD]"></div>
      </RouterLink>
    </nav>
  </div>
</template>
