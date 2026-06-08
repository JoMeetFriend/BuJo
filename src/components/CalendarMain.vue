<script setup>
import { ref, computed } from 'vue'

const props = defineProps({ sidebarOpen: Boolean })
const emit = defineEmits(['toggle-sidebar'])

const currentYear = ref(2026)
const currentMonth = ref(5)

const monthNames = ['JANUARY','FEBRUARY','MARCH','APRIL','MAY','JUNE',
  'JULY','AUGUST','SEPTEMBER','OCTOBER','NOVEMBER','DECEMBER']
const weekDays = ['一','二','三','四','五','六','日']

const events = ref([
  { id: 1, date: '2026-06-02', title: 'KTV', status: 'joined' },
  { id: 2, date: '2026-06-04', title: '小酌', status: 'interested' },
  { id: 3, date: '2026-06-05', title: '晚餐', status: 'recruiting' },
  { id: 4, date: '2026-06-10', title: '爬山', status: 'joined' },
  { id: 5, date: '2026-06-12', title: '桌遊', status: 'interested' },
  { id: 6, date: '2026-06-18', title: '歌唱', status: 'recruiting' },
])

const statusStyle = {
  joined:     'bg-[#87C06D] text-white',
  recruiting: 'bg-[#D9F0A8] text-[#2B2E24]',
  interested: 'bg-[#F9CE9A] text-[#2B2E24]',
  none:       'bg-[#FAF8F4] text-[#9DBD86] border border-[#DEF4CD]',
}

function prevMonth() {
  if (currentMonth.value === 0) { currentMonth.value = 11; currentYear.value-- }
  else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 11) { currentMonth.value = 0; currentYear.value++ }
  else currentMonth.value++
}

const calendarDays = computed(() => {
  const year = currentYear.value
  const month = currentMonth.value
  const firstDay = new Date(year, month, 1).getDay()
  const totalDays = new Date(year, month + 1, 0).getDate()
  const startOffset = firstDay === 0 ? 6 : firstDay - 1
  const days = []

  // 前月補空格（不顯示數字）
  for (let i = 0; i < startOffset; i++) {
    days.push({ date: null, day: null, faded: true })
  }

  // 當月
  for (let d = 1; d <= totalDays; d++) {
    const mm = String(month + 1).padStart(2, '0')
    const dd = String(d).padStart(2, '0')
    days.push({ date: `${year}-${mm}-${dd}`, day: d, faded: false })
  }

  // 後月補空格（不顯示數字），補滿 42 格
  const remaining = 42 - days.length
  for (let i = 0; i < remaining; i++) {
    days.push({ date: null, day: null, faded: true })
  }

  return days
})

function getEvents(date) {
  if (!date) return []
  return events.value.filter(e => e.date === date)
}

function isToday(date) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth()+1).padStart(2,'0')}-${String(today.getDate()).padStart(2,'0')}`
  return date === todayStr
}
</script>

<template>
  <!-- 手機版：置中佈局 -->
  <div class="flex flex-col gap-3 h-full px-12 pt-10 pb-20">

    <!-- 標題列 -->
    <div class="flex items-center justify-between w-full">
      <div class="flex items-center gap-3">
        <!-- 漢堡選單（僅桌機顯示） -->
        <button
          @click="emit('toggle-sidebar')"
          class="hidden md:flex flex-col gap-[5px] p-2 hover:opacity-70"
        >
          <span class="block w-5 h-[2px] bg-[#2B2E24]"></span>
          <span class="block w-5 h-[2px] bg-[#2B2E24]"></span>
          <span class="block w-5 h-[2px] bg-[#2B2E24]"></span>
        </button>

        <h1 class="font-pixel font-extrabold text-[22px] md:text-[28px] tracking-[-1px] text-[#4A5040]">
          {{ monthNames[currentMonth] }}
        </h1>
        <span class="font-pixel text-[#4A5040] text-sm">{{ currentYear }}</span>
      </div>

      <div class="flex items-center gap-2">
        <button @click="prevMonth" class="font-['Syne'] font-bold text-[#2B2E24] w-8 h-8 flex items-center justify-center hover:text-[#87C06D]">&lt;</button>
        <button @click="nextMonth" class="font-['Syne'] font-bold text-[#2B2E24] w-8 h-8 flex items-center justify-center hover:text-[#87C06D]">&gt;</button>

        <!-- 揪一團按鈕：桌機版文字+圖示，手機版只有方塊佔位 -->
        <button class="hidden md:flex items-center gap-1 mx-2 bg-[#87C06D] text-[#4A5040] font-[cubic11] font-semibold text-[12px] px-4 py-2 border-2 border-[#4A5040] shadow-[3px_3px_0px_#4A5040] hover:shadow-none hover:translate-x-[3px] hover:translate-y-[3px] transition-all">
          ＋ 揪一團
        </button>

        <!-- 頭像佔位 -->
        <div class="w-10 h-10 bg-[#DEF4CD] border-2 border-[#2B2E24]"></div>
      </div>
    </div>

    <!-- 行事曆本體 -->
    <div class="flex-1 border-[1.5px] border-[#DEF4CD] flex flex-col min-h-0">

      <!-- 星期標題 -->
      <div class="grid grid-cols-7 bg-[#D9F0A8] border-b-[1.5px] border-[#DEF4CD]">
        <div
          v-for="day in weekDays" :key="day"
          class="py-2 text-center font-['Nunito'] font-semibold text-[#2B2E24] text-xs md:text-sm"
        >
          {{ day }}
        </div>
      </div>

      <!-- 格子 -->
      <div class="grid grid-cols-7 grid-rows-6 flex-1 min-h-0">
        <div
          v-for="(cell, index) in calendarDays" :key="index"
          class="border-r-[1px] border-b-[1px] border-[#DEF4CD] flex flex-col overflow-hidden"
          :class="[
            cell.date && isToday(cell.date) ? 'bg-[#D9F0A8]' : cell.faded ? 'bg-[#FAF8F4]' : 'bg-white'
          ]"
        >
          <!-- 日期數字（只有當月才顯示） -->
          <div class="p-1">
            <span
              v-if="cell.day"
              class="font-['Press_Start_2P'] text-[8px] md:text-[10px] leading-none text-[#2B2E24]"
            >
              {{ cell.day }}
            </span>
          </div>

          <!-- 活動條 -->
          <div class="flex flex-col gap-[2px] px-1 pb-1">
            <div
              v-for="event in getEvents(cell.date)" :key="event.id"
              class="flex items-center justify-between text-[9px] md:text-[10px] px-1 h-5 overflow-hidden"
              :class="statusStyle[event.status]"
            >
              <div class="flex items-center gap-1 min-w-0">
                <div class="w-3 h-3 bg-white/40 shrink-0"></div>
                <span class="truncate font-[cubic11] font-semibold">{{ event.title }}</span>
              </div>
              <div class="w-4 h-4 bg-white/40 shrink-0 ml-1"></div>
            </div>
          </div>
        </div>
      </div>

    </div>
  </div>
</template>