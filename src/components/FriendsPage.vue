<script setup>
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
</script>

<template>
  <div class="flex flex-col gap-4 min-h-screen px-4 py-6 md:px-16 md:py-8 
  bg-[#FEF7E8]">
    <!-- 標題列 -->
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-3">
        <h1 class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl" style="text-shadow: 2px 2px 0px #e4ded1;">好友</h1>
        <span class="font-['Press_Start_2P'] text-[#9DBD86] text-xs md:text-sm">FRIENDS</span>
      </div>
      <button class="flex items-center gap-1 bg-[#87C06D] text-[#4A5040] font-[cubic11] font-black text-[12px] px-4 py-2 border-2 border-[#4A5040] shadow-[3px_3px_0px_#4A5040] active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all">
        ＋ 新增好友
      </button>
    </div>

    <!-- 好友列表 -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
      <div
        v-for="friend in friends" :key="friend.id"
        class="flex items-center gap-3 p-3 border-[1.5px] border-[#9DBD86] bg-white"
      >
        <div class="w-10 h-10 bg-[#DEF4CD] shrink-0"></div>
        <div class="flex flex-col gap-[2px]">
          <span class="font-[cubic11] font-semibold text-[#4A5040] text-sm">{{ friend.name }}</span>
          <span class="font-[cubic11] text-[#9DBD86] text-xs">好友</span>
        </div>
      </div>
    </div>
  </div>
</template>