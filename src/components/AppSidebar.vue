<script setup>
defineProps({ isOpen: Boolean })
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
        <span class="font-['Press_Start_2P'] text-[#E9EF6E] text-lg">BuJo</span>
      </div>

      <!-- 導覽項目 -->
      <nav class="flex flex-col gap-2">
        <a v-for="item in [
          { label: '月曆', sub: 'CALENDAR' },
          { label: '活動', sub: 'ACTIVITY' },
          { label: '好友', sub: 'FRIENDS' },
          { label: '通知', sub: 'ALERTS' },
        ]" :key="item.sub"
          href="#"
          class="flex items-center gap-3 px-3 py-2 hover:bg-[#F9CE9A] transition-colors whitespace-nowrap"
        >
          <div class="w-10 h-10 bg-[#DEF4CD] shrink-0"></div>
          <div class="flex flex-col gap-[2px]">
            <span class="font-[cubic11] font-semibold text-[#4A5040] text-[14px]">{{ item.label }}</span>
            <span class="font-['Press_Start_2P'] text-[#4A5040] text-[10px]">{{ item.sub }}</span>
          </div>
        </a>
      </nav>
    </div>

    <!-- 用戶 -->
    <a href="#" class="flex items-center gap-3 px-3 py-2 hover:bg-[#F9CE9A] transition-colors whitespace-nowrap">
      <div class="w-10 h-10 bg-[#DEF4CD] shrink-0"></div>
      <span class="font-['Press_Start_2P'] text-[#4A5040] text-xs">Me</span>
    </a>
  </aside>

  <!-- 手機版底部導覽列 -->
  <nav class="md:hidden fixed bottom-0 left-0 right-0 bg-[#87C06D] border-t-[1.5px] border-[#DEF4CD] flex justify-around items-center py-3 z-50">
    <a v-for="item in ['月曆','活動','好友','通知','Me']" :key="item"
      href="#" class="flex flex-col items-center">
      <div class="w-8 h-8 bg-[#DEF4CD]"></div>
    </a>
  </nav>
</template>