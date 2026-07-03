<template>
  <div
    class="flex flex-col gap-3 flex-1 min-h-0 px-4 pb-8 md:px-28 md:pt-4 md:pb-20 relative isolate"
  >
    <div
      ref="overlayRef"
      class="absolute left-0 right-0 top-0 pointer-events-none"
      style="z-index: -1; bottom: -5rem"
      aria-hidden="true"
    >
      <div
        v-for="dot in dots"
        :key="dot.id"
        class="absolute"
        :style="{
          left: dot.x + 'px',
          top: dot.y + 'px',
          width: dot.size + 'px',
          height: dot.size + 'px',
          background: dot.color,
        }"
      />
    </div>
    <MarqueeBanner />
    <div class="md:hidden h-5"></div>

    <!-- 標題列 -->
    <div class="flex items-center justify-between w-full">
      <div class="flex items-baseline gap-3">
        <!-- 漢堡選單（僅桌機顯示） -->
        <button
          @click="emit('toggle-sidebar')"
          class="hidden md:flex flex-col gap-[5px] p-2 hover:opacity-70 self-center"
        >
          <span class="block w-5 h-[2px] bg-[#4A5040]"></span>
          <span class="block w-5 h-[2px] bg-[#4A5040]"></span>
          <span class="block w-5 h-[2px] bg-[#4A5040]"></span>
        </button>

        <h1
          class="font-pixel font-extrabold text-[20px] md:text-[32px] tracking-[-1px] text-[#4A5040]"
          style="text-shadow: 2px 2px 0px #e4ded1"
        >
          {{ monthNames[currentMonth] }}
        </h1>
        <span class="font-pixel text-[#9DBD86] text-xs md:text-sm">{{ currentYear }}</span>
      </div>

      <div class="flex items-center gap-1">
        <button
          @click="prevMonth"
          class="font-['Syne'] font-bold text-[#4A5040] w-8 h-8 flex items-center justify-center hover:text-[#87C06D]"
        >
          &lt;
        </button>
        <button
          @click="nextMonth"
          class="font-['Syne'] font-bold text-[#4A5040] w-8 h-8 flex items-center justify-center hover:text-[#87C06D]"
        >
          &gt;
        </button>

        <!-- 揪一團按鈕 -->
        <PixelButton class="mx-2" @click="openEventModal">
          ＋<span class="hidden md:inline"> 揪一團</span>
        </PixelButton>

        <!-- 個人帳號 -->
        <button
          type="button"
          class="hidden h-10 w-10 items-center justify-center border-2 border-[#4A5040] bg-[#DEF4CD] shadow-[3px_3px_0px_#87C06D] transition-colors hover:bg-[#D9F0A8] md:flex"
          :class="{ 'btn-bounce-green': profileBtnBouncing }"
          @animationend="profileBtnBouncing = false"
          aria-label="開啟個人帳號"
          @click="openProfileModal"
        >
          <img
            v-if="currentUser?.avatar_url"
            :src="currentUser.avatar_url"
            :alt="currentUser.display_name"
            class="h-full w-full object-cover"
          />
          <span
            v-else
            class="profile-pixel-face profile-pixel-face--small"
            aria-hidden="true"
          ></span>
        </button>
      </div>
    </div>

    <!-- 行事曆本體 -->
    <div
      ref="calendarRef"
      class="border-[1.5px] border-[#DEF4CD] overflow-hidden md:flex-1 md:flex md:flex-col"
    >
      <!-- 星期標題 -->
      <div class="grid grid-cols-7 bg-[#D9F0A8] border-b-[1.5px] border-[#DEF4CD]">
        <div
          v-for="day in weekDays"
          :key="day"
          class="py-2 text-center font-[cubic11] font-semibold text-[#4A5040] text-[10px] md:text-sm"
        >
          {{ day }}
        </div>
      </div>

      <!-- 格子 -->
      <div
        class="grid grid-cols-7 md:flex-1 md:min-h-0"
        :style="{
          gridTemplateRows: isMobile ? 'repeat(6, clamp(50px, 8.4vh, 110px))' : 'repeat(6, 1fr)',
        }"
      >
        <div
          v-for="(cell, index) in calendarDays"
          :key="index"
          class="border-r-[1px] border-b-[1px] border-[#DEF4CD] flex flex-col overflow-hidden justify-start relative pb-2"
          :class="[
            cell.date && isToday(cell.date)
              ? 'bg-[#D9F0A8]'
              : cell.faded
                ? 'bg-[#FAF8F4]'
                : 'bg-white',
          ]"
          :role="cell.date ? 'button' : undefined"
          :tabindex="cell.date ? 0 : undefined"
          @click="openDateModal(cell.date)"
          @keydown.enter.prevent="openDateModal(cell.date)"
          @keydown.space.prevent="openDateModal(cell.date)"
        >
          <!-- 日期數字（只有當月才顯示） -->
          <div class="w-full p-1 md:p-2">
            <span
              v-if="cell.day"
              class="block font-['Press_Start_2P'] text-[8px] md:text-[10px] leading-none text-[#4A5040]"
            >
              {{ cell.day }}
            </span>
          </div>

          <!-- 活動條 -->
          <div class="flex flex-col gap-[2px] px-1 pb-1 md:pb-3">
            <template v-for="(event, i) in getEvents(cell.date)" :key="event.id">
              <div
                v-if="(isMobile && i < 2) || (!isMobile && i < 3)"
                class="flex items-center text-[10px] px-1 h-[18px] overflow-hidden cursor-pointer"
                :class="statusStyle[event.status]"
              >
                <div class="w-2 h-2 md:w-3 md:h-3 bg-white/40 shrink-0"></div>
                <span class="truncate font-[cubic11] font-semibold ml-1">{{ event.title }}</span>
                <div class="w-3 h-3 bg-white/40 shrink-0 ml-auto hidden md:block"></div>
              </div>
            </template>
          </div>

          <!-- +N：定位相對格子，不受 events 容器高度影響 -->
          <div
            v-if="getEvents(cell.date).length > (isMobile ? 2 : 3)"
            class="absolute bottom-1 right-1 text-[6px] font-['Press_Start_2P'] text-[#4A5040] bg-white/80 px-[2px] py-[1px] md:text-[8px]"
          >
            +{{ getEvents(cell.date).length - (isMobile ? 2 : 3) }}
          </div>
        </div>
      </div>
    </div>

    <DateEventsModal
      v-if="selectedDate"
      :date="selectedDate"
      :events="selectedDateEvents"
      @close="closeDateModal"
      @add="openEventModalFromDate"
    />
  </div>

  <ProfileAccountModal
    v-if="showProfileModal"
    :user="currentUser"
    @close="showProfileModal = false"
    @logout="handleLogout"
  />

  <EventPage
    :isOpen="showEventModal"
    :initialDate="eventModalInitialDate"
    @close="showEventModal = false"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PixelButton from './ui/PixelButton.vue'
import DateEventsModal from './DateEventsModal.vue'
import MarqueeBanner from './MarqueeBanner.vue'
import ProfileAccountModal from './ProfileAccountModal.vue'
import EventPage from './EventPage.vue'

const showEventModal = ref(false)
const eventModalInitialDate = ref(null)
const profileBtnBouncing = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user)

function openProfileModal() {
  showProfileModal.value = true
  profileBtnBouncing.value = true
}

async function handleLogout() {
  showProfileModal.value = false
  await authStore.logout()
  router.push('/login')
}

const props = defineProps({
  sidebarOpen: Boolean,
  filters: {
    type: Object,
    default: () => ({ joined: true, formed: true, personal: true }),
  },
})
const emit = defineEmits(['toggle-sidebar'])

const isMobile = ref(window.innerWidth < 768)
const showProfileModal = ref(false)
const handleResize = () => {
  isMobile.value = window.innerWidth < 768
}

const COLORS = ['#da90c7', '#5ea5e1', '#56b597']
const overlayRef = ref(null)
const calendarRef = ref(null)
const dots = ref([])
let dotAnimId = null

function initDots() {
  const W = overlayRef.value.clientWidth
  const H = overlayRef.value.clientHeight
  const overlayRect = overlayRef.value.getBoundingClientRect()
  const calRect = calendarRef.value.getBoundingClientRect()
  const cal = {
    x: calRect.left - overlayRect.left,
    y: calRect.top - overlayRect.top,
    w: calRect.width,
    h: calRect.height,
  }

  const topRegion = { minY: 0, maxY: cal.y }
  const bottomRegion = { minY: cal.y + cal.h, maxY: H }

  function posInRegion(region, size) {
    return {
      x: Math.random() * (W - size),
      y: region.minY + Math.random() * Math.max(0, region.maxY - region.minY - size),
    }
  }

  dots.value = Array.from({ length: 3 }, (_, i) => {
    const size = Math.floor(Math.random() * 5) + 10
    // 偶數 index → 下方，奇數 → 上方，確保下方一定有方塊
    const { x, y } = posInRegion(i % 2 === 0 ? bottomRegion : topRegion, size)
    return {
      id: i,
      x,
      y,
      dx: (Math.random() * 1.0 + 2.0) * (Math.random() < 0.5 ? 1 : -1),
      dy: (Math.random() * 1.0 + 2.0) * (Math.random() < 0.5 ? 1 : -1),
      size,
      color: COLORS[i % COLORS.length],
    }
  })
}

function hitsCalendar(x, y, size, cal) {
  return x < cal.x + cal.w && x + size > cal.x && y < cal.y + cal.h && y + size > cal.y
}

function tickDots() {
  const W = overlayRef.value?.clientWidth
  const H = overlayRef.value?.clientHeight
  if (!W || !H) return

  const overlayRect = overlayRef.value.getBoundingClientRect()
  const calRect = calendarRef.value.getBoundingClientRect()
  const cal = {
    x: calRect.left - overlayRect.left,
    y: calRect.top - overlayRect.top,
    w: calRect.width,
    h: calRect.height,
  }

  dots.value.forEach((dot) => {
    const newX = dot.x + dot.dx
    const newY = dot.y + dot.dy

    if (newX <= 0 || newX + dot.size >= W) {
      dot.dx *= -1
    } else if (hitsCalendar(newX, dot.y, dot.size, cal)) {
      dot.dx *= -1
    } else {
      dot.x = newX
    }

    if (newY <= 0 || newY + dot.size >= H) {
      dot.dy *= -1
    } else if (hitsCalendar(dot.x, newY, dot.size, cal)) {
      dot.dy *= -1
    } else {
      dot.y = newY
    }
  })
  dotAnimId = requestAnimationFrame(tickDots)
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  initDots()
  dotAnimId = requestAnimationFrame(tickDots)
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (dotAnimId) cancelAnimationFrame(dotAnimId)
})
const currentYear = ref(2026)
const currentMonth = ref(5)
const selectedDate = ref(null)

const monthNames = [
  'JANUARY',
  'FEBRUARY',
  'MARCH',
  'APRIL',
  'MAY',
  'JUNE',
  'JULY',
  'AUGUST',
  'SEPTEMBER',
  'OCTOBER',
  'NOVEMBER',
  'DECEMBER',
]
const weekDays = ['一', '二', '三', '四', '五', '六', '日']

const events = ref([
  { id: 1, date: '2026-06-02', title: 'KTV', status: 'joined' },
  { id: 2, date: '2026-06-04', title: '小酌', status: 'personal' },
  { id: 3, date: '2026-06-05', title: '晚餐', status: 'formed' },
  {
    id: 4,
    date: '2026-06-10',
    title: '爬山',
    status: 'joined',
    time: '06:00 – 14:00',
    location: '象山步道',
  },
  { id: 5, date: '2026-06-12', title: '桌遊', status: 'recruiting' },
  { id: 6, date: '2026-06-18', title: '歌唱', status: 'formed' },
  { id: 7, date: '2026-06-02', title: 'KTV', status: 'joined' },
  { id: 8, date: '2026-06-02', title: '小酌', status: 'personal' },
  { id: 9, date: '2026-06-02', title: '晚餐', status: 'formed' },
])

const statusStyle = {
  joined: 'bg-[#87C06D]/40 text-[#4A5040]/40',
  formed: 'bg-[#5e9b57] text-white',
  personal: 'bg-[#F9CE9A] text-[#4A5040]',
  recruiting: '',
  none: 'bg-[#FAF8F4] text-[#9DBD86] border border-[#DEF4CD]',
}

function prevMonth() {
  if (currentMonth.value === 0) {
    currentMonth.value = 11
    currentYear.value--
  } else currentMonth.value--
}
function nextMonth() {
  if (currentMonth.value === 11) {
    currentMonth.value = 0
    currentYear.value++
  } else currentMonth.value++
}

function openDateModal(date) {
  if (!date) return
  selectedDate.value = date
}

function closeDateModal() {
  selectedDate.value = null
}

function openEventModal() {
  eventModalInitialDate.value = null
  showEventModal.value = true
}

function openEventModalFromDate(date) {
  closeDateModal()
  eventModalInitialDate.value = date
  showEventModal.value = true
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

  // 後月補空格（不顯示數字），補滿到剛好的週數（5 或 6 列）
  const remaining = 42 - days.length
  for (let i = 0; i < remaining; i++) {
    days.push({ date: null, day: null, faded: true })
  }

  return days
})

function getEvents(date) {
  if (!date) return []
  return events.value.filter((e) => {
    if (e.date !== date) return false
    if (e.status === 'recruiting') return false
    if (e.status === 'joined' && !props.filters.joined) return false
    if (e.status === 'formed' && !props.filters.formed) return false
    if (e.status === 'personal' && !props.filters.personal) return false
    return true
  })
}

const selectedDateEvents = computed(() => getEvents(selectedDate.value))

function isToday(date) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return date === todayStr
}
</script>

<style scoped>
.profile-pixel-face {
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  background:
    linear-gradient(#4a5040 0 0) 8px 4px / 16px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 4px 8px / 4px 16px no-repeat,
    linear-gradient(#4a5040 0 0) 24px 8px / 4px 16px no-repeat,
    linear-gradient(#4a5040 0 0) 8px 24px / 16px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 12px 12px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 20px 12px / 4px 4px no-repeat,
    linear-gradient(#4a5040 0 0) 16px 20px / 4px 4px no-repeat;
}

.profile-pixel-face::before,
.profile-pixel-face::after {
  position: absolute;
  top: 0;
  width: 8px;
  height: 8px;
  background: #4a5040;
  content: '';
}

.profile-pixel-face::before {
  left: 4px;
}

.profile-pixel-face::after {
  right: 4px;
}

.profile-pixel-face--small {
  transform: scale(0.78);
}

@keyframes pixel-bounce-green {
  0% {
    transform: translate(0, 0);
    box-shadow: 3px 3px 0 #87c06d;
  }
  40% {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 #87c06d;
  }
  100% {
    transform: translate(0, 0);
    box-shadow: 3px 3px 0 #87c06d;
  }
}
.btn-bounce-green {
  animation: pixel-bounce-green 0.2s ease-in-out;
}
</style>
