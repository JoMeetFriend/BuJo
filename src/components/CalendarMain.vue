<template>
  <div
    class="calendar-main-shell flex flex-col flex-1 min-h-0 px-4 pb-8 md:px-16 md:pt-6 md:pb-16 relative isolate"
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
    <div class="md:hidden h-5"></div>

    <!-- Hero + controls + social rail -->
    <section class="calendar-hero-composition">
      <div class="calendar-hero-copy">
        <!-- 漢堡選單（僅桌機顯示） -->
        <button
          @click="emit('toggle-sidebar')"
          class="calendar-menu-button hidden md:flex"
          aria-label="切換側邊欄"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div>
          <p class="calendar-eyebrow">SOCIAL INBOX CALENDAR</p>
          <div class="calendar-title-line">
            <h1>{{ monthNames[currentMonth] }}</h1>
            <span class="calendar-year-mark">{{ currentYear }}</span>
          </div>
          <p class="calendar-exhibition-caption">( social index / small plans )</p>
        </div>
      </div>

      <div class="calendar-hero-actions">
        <button
          @click="prevMonth"
          class="calendar-arrow-button"
          aria-label="上一個月"
        >
          &lt;
        </button>
        <button
          @click="nextMonth"
          class="calendar-arrow-button"
          aria-label="下一個月"
        >
          &gt;
        </button>

        <!-- 揪一團按鈕 -->
        <PixelButton class="calendar-create-button" @click="openEventModal">
          ＋<span class="hidden md:inline"> CREATE</span>
        </PixelButton>

        <!-- 個人帳號 -->
        <button
          type="button"
          class="calendar-profile-button hidden md:flex"
          :class="{ 'btn-bounce-green': profileBtnBouncing }"
          @animationend="profileBtnBouncing = false"
          aria-label="開啟個人帳號"
          @click="openProfileModal"
        >
          <img
            v-if="currentUserAvatarSrc"
            :src="currentUserAvatarSrc"
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
    </section>

    <section class="calendar-content-composition">
      <!-- 行事曆本體 -->
      <div
        ref="calendarRef"
        class="calendar-board md:flex-1 md:flex md:flex-col"
      >
        <!-- 星期標題 -->
        <div class="calendar-week-row grid grid-cols-7">
          <div
            v-for="day in weekDays"
            :key="day"
            class="calendar-weekday"
          >
            {{ day }}
          </div>
        </div>

        <!-- 格子 -->
        <div
          class="calendar-grid grid grid-cols-7 md:flex-1 md:min-h-0"
          :style="{
            gridTemplateRows: isMobile ? 'repeat(6, clamp(50px, 8.4vh, 110px))' : 'repeat(6, 1fr)',
          }"
        >
          <div
            v-for="(cell, index) in calendarDays"
            :key="index"
            class="calendar-cell flex flex-col overflow-hidden justify-start relative pb-2"
            :class="[
              cell.date && isToday(cell.date)
                ? 'is-today'
                : cell.faded
                  ? 'is-faded'
                  : '',
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
                class="calendar-day-number"
              >
                {{ cell.day }}
              </span>
            </div>

            <!-- 活動條 -->
            <div class="flex flex-col gap-[3px] px-1 pb-1 md:px-2 md:pb-3">
              <template v-for="(event, i) in getEvents(cell.date)" :key="event.id">
                <div
                  v-if="(isMobile && i < 2) || (!isMobile && i < 3)"
                  class="calendar-event-chip"
                  :class="statusStyle[event.status]"
                >
                  <span class="calendar-event-dot"></span>
                  <span class="truncate">{{ event.title }}</span>
                  <span class="calendar-event-meta hidden md:inline">{{ statusMeta[event.status] }}</span>
                </div>
              </template>
            </div>

            <!-- +N：定位相對格子，不受 events 容器高度影響 -->
            <div
              v-if="getEvents(cell.date).length > (isMobile ? 2 : 3)"
              class="calendar-more-count"
            >
              +{{ getEvents(cell.date).length - (isMobile ? 2 : 3) }}
            </div>
          </div>
        </div>
      </div>

      <aside class="calendar-social-rail" aria-label="Social rail">
        <div class="calendar-rail-heading">
          <span>SOCIAL RAIL</span>
          <strong>{{ visibleEvents.length }}</strong>
        </div>

        <div class="calendar-rail-section">
          <p>MUST SEE</p>
          <button
            v-for="item in socialRailItems.mustSee"
            :key="item.id"
            type="button"
            class="calendar-rail-item"
            @click="openDateModal(item.date)"
          >
            <span class="calendar-rail-date">
              <strong>{{ item.monthShort }}</strong>
              <em>{{ item.dayNumber }}</em>
            </span>
            <span class="calendar-rail-title">{{ item.title }}</span>
            <small>{{ item.statusLabel }}</small>
          </button>
        </div>

        <div class="calendar-rail-section">
          <p>FYI</p>
          <button
            v-for="item in socialRailItems.fyi"
            :key="item.id"
            type="button"
            class="calendar-rail-item is-quiet"
            @click="openDateModal(item.date)"
          >
            <span class="calendar-rail-date">
              <strong>{{ item.monthShort }}</strong>
              <em>{{ item.dayNumber }}</em>
            </span>
            <span class="calendar-rail-title">{{ item.title }}</span>
            <small>{{ item.statusLabel }}</small>
          </button>
        </div>

        <div class="calendar-rail-note">
          <span>room notes</span>
          <p>small plans are becoming visible.</p>
        </div>
      </aside>
    </section>

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
import ProfileAccountModal from './ProfileAccountModal.vue'
import EventPage from './EventPage.vue'
import { toAvatarSrc } from '@/utils/avatar'

const showEventModal = ref(false)
const eventModalInitialDate = ref(null)
const profileBtnBouncing = ref(false)
const router = useRouter()
const authStore = useAuthStore()

const currentUser = computed(() => authStore.user)
const currentUserAvatarSrc = computed(() => toAvatarSrc(currentUser.value?.avatar_url))

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

const COLORS = ['var(--bujo-deco-pink)', 'var(--bujo-deco-blue)', 'var(--bujo-deco-green)']
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
const today = new Date()
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
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
const monthShortNames = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']
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
  joined: 'calendar-event-chip--joined',
  formed: 'calendar-event-chip--formed',
  personal: 'calendar-event-chip--personal',
  recruiting: 'calendar-event-chip--recruiting',
  none: 'calendar-event-chip--none',
}

const statusMeta = {
  joined: 'JOIN',
  formed: 'LIVE',
  personal: 'SOLO',
  recruiting: 'OPEN',
  none: '',
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
const visibleEvents = computed(() => {
  const monthDates = new Set(calendarDays.value.filter((d) => d.date).map((d) => d.date))
  return events.value.filter(
    (event) => monthDates.has(event.date) && getEvents(event.date).some((visible) => visible.id === event.id),
  )
})

const socialRailItems = computed(() => {
  const items = visibleEvents.value.map((event) => {
    const [, month, day] = event.date.split('-')
    const monthIndex = Number(month) - 1
    return {
      ...event,
      monthShort: monthShortNames[monthIndex] || month,
      dayNumber: Number(day),
      statusLabel: statusMeta[event.status] || 'ROOM',
      meta: `${Number(month)}/${Number(day)} · ${statusMeta[event.status] || 'ROOM'}`,
    }
  })

  return {
    mustSee: items.slice(0, 2),
    fyi: items.slice(2, 4),
  }
})

function isToday(date) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return date === todayStr
}
</script>

<style scoped>
.calendar-main-shell {
  gap: clamp(16px, 2vw, 26px);
  color: var(--bujo-ink);
  font-family: "IBM Plex Sans TC", sans-serif;
}

.calendar-hero-composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: end;
  gap: 22px;
}

.calendar-hero-copy {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.calendar-menu-button {
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  margin-top: 28px;
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  transition:
    border-color 160ms cubic-bezier(.2, .8, .2, 1),
    background-color 160ms cubic-bezier(.2, .8, .2, 1);
}

.calendar-menu-button:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-white);
}

.calendar-menu-button span {
  display: block;
  width: 14px;
  height: 1.5px;
  background: var(--bujo-ink);
}

.calendar-menu-button span + span {
  margin-top: 4px;
}

.calendar-eyebrow,
.calendar-exhibition-caption {
  font-family: "Space Mono", monospace;
  letter-spacing: .04em;
}

.calendar-eyebrow {
  margin-bottom: 2px;
  color: var(--bujo-muted-strong);
  font-size: 11px;
  font-weight: 700;
}

.calendar-title-line {
  display: flex;
  align-items: baseline;
  gap: 10px;
  min-width: 0;
}

.calendar-title-line h1 {
  color: var(--bujo-ink);
  font-family: "SH Pinscher", "Space Mono", monospace;
  font-size: clamp(56px, 8vw, 112px);
  font-weight: 400;
  line-height: .72;
  letter-spacing: 0;
}

.calendar-year-mark {
  display: inline-block;
  color: var(--bujo-muted);
  font-family: "Space Mono", monospace;
  font-size: clamp(10px, 1vw, 12px);
  font-weight: 400;
  letter-spacing: .04em;
  transform: translateY(-.18em);
}

.calendar-exhibition-caption {
  margin-top: 8px;
  color: rgb(var(--bujo-ink-rgb) / .55);
  font-size: 10px;
  font-weight: 400;
  line-height: 1.45;
  pointer-events: none;
}

.calendar-hero-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 6px;
}

.calendar-arrow-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid var(--bujo-line);
  background: transparent;
  color: var(--bujo-ink);
  font-family: "Space Mono", monospace;
  font-size: 14px;
  transition:
    background-color 160ms cubic-bezier(.2, .8, .2, 1),
    border-color 160ms cubic-bezier(.2, .8, .2, 1);
}

.calendar-arrow-button:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-surface);
}

.calendar-create-button {
  margin-left: 4px;
  border: 1px solid var(--bujo-ink) !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--bujo-ink) !important;
  font-family: "Space Mono", monospace !important;
  letter-spacing: 0 !important;
}

.calendar-create-button:hover {
  background: var(--bujo-ink) !important;
  border-color: var(--bujo-ink) !important;
  box-shadow: none !important;
  color: var(--bujo-white) !important;
}

.calendar-profile-button {
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  transition:
    background-color 160ms cubic-bezier(.2, .8, .2, 1),
    border-color 160ms cubic-bezier(.2, .8, .2, 1);
}

.calendar-profile-button:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-white);
}

.calendar-content-composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 240px);
  gap: clamp(18px, 2.2vw, 34px);
  min-height: 0;
  flex: 1;
}

.calendar-board {
  overflow: hidden;
  border: 1px solid var(--bujo-line-soft);
  background: var(--bujo-surface);
  box-shadow: 7px 8px 0 rgb(var(--bujo-ink-rgb) / .06);
}

.calendar-week-row {
  border-bottom: 1px solid var(--bujo-line-soft);
  background: var(--bujo-surface-muted);
}

.calendar-weekday {
  padding: 10px 0;
  color: var(--bujo-muted-strong);
  text-align: center;
  font-family: "Space Mono", monospace;
  font-size: 12px;
  font-weight: 700;
}

.calendar-cell {
  min-width: 0;
  border-right: 1px solid rgb(var(--bujo-line-rgb) / .38);
  border-bottom: 1px solid rgb(var(--bujo-line-rgb) / .38);
  background: rgb(var(--bujo-white-rgb) / .76);
  transition:
    background-color 160ms cubic-bezier(.2, .8, .2, 1),
    box-shadow 160ms cubic-bezier(.2, .8, .2, 1);
}

.calendar-cell:hover {
  background: var(--bujo-white);
  box-shadow: inset 0 0 0 1px var(--bujo-accent);
}

.calendar-cell.is-faded {
  background: rgb(var(--bujo-page-rgb) / .55);
}

.calendar-cell.is-today {
  background: var(--bujo-today);
  box-shadow: inset 0 0 0 1px var(--bujo-accent);
}

.calendar-day-number {
  display: block;
  color: var(--bujo-muted-strong);
  font-family: "Space Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.calendar-event-chip {
  display: grid;
  grid-template-columns: 7px minmax(0, 1fr) auto;
  align-items: center;
  gap: 6px;
  min-height: 20px;
  padding: 2px 6px;
  overflow: hidden;
  color: var(--bujo-ink);
  font-family: "IBM Plex Sans TC", sans-serif;
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 140ms cubic-bezier(.2, .8, .2, 1),
    background-color 140ms cubic-bezier(.2, .8, .2, 1);
}

.calendar-event-chip:hover {
  transform: translateY(-1px);
}

.calendar-event-dot {
  width: 6px;
  height: 6px;
  background: var(--bujo-ink);
}

.calendar-event-meta {
  color: rgb(var(--bujo-ink-rgb) / .56);
  font-family: "Space Mono", monospace;
  font-size: 9px;
  font-weight: 700;
}

.calendar-event-chip--joined {
  background: var(--bujo-card-blue);
}

.calendar-event-chip--formed {
  background: var(--bujo-accent);
}

.calendar-event-chip--personal {
  background: var(--bujo-card-yellow);
}

.calendar-event-chip--recruiting {
  background: var(--bujo-card-pink);
}

.calendar-event-chip--none {
  border: 1px solid var(--bujo-line-soft);
  background: var(--bujo-white);
}

.calendar-more-count {
  position: absolute;
  right: 6px;
  bottom: 5px;
  background: var(--bujo-white);
  color: var(--bujo-ink);
  font-family: "Space Mono", monospace;
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
}

.calendar-social-rail {
  display: flex;
  flex-direction: column;
  gap: 18px;
  border-left: 1px solid rgb(var(--bujo-line-rgb) / .45);
  padding: 10px 0 0 20px;
}

.calendar-rail-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--bujo-ink);
}

.calendar-rail-heading span,
.calendar-rail-section p,
.calendar-rail-note span {
  font-family: "Space Mono", monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: .08em;
}

.calendar-rail-heading strong {
  color: var(--bujo-accent);
  font-family: "Space Mono", monospace;
  font-size: 18px;
}

.calendar-rail-section {
  display: grid;
  gap: 8px;
}

.calendar-rail-section p {
  color: rgb(var(--bujo-ink-rgb) / .42);
}

.calendar-rail-item {
  display: grid;
  gap: 7px;
  width: 100%;
  border: 1px solid rgb(var(--bujo-line-rgb) / .7);
  background: var(--bujo-surface);
  padding: 12px 12px 11px;
  text-align: left;
  transition:
    background-color 160ms cubic-bezier(.2, .8, .2, 1),
    border-color 160ms cubic-bezier(.2, .8, .2, 1),
    transform 160ms cubic-bezier(.2, .8, .2, 1);
}

.calendar-rail-item:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-white);
  transform: translateY(-1px);
}

.calendar-rail-date {
  display: flex;
  align-items: baseline;
  gap: 7px;
  color: var(--bujo-ink);
  line-height: .8;
}

.calendar-rail-date strong {
  font-family: "Doto", "Space Mono", monospace;
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: .76;
}

.calendar-rail-date em {
  color: var(--bujo-muted);
  font-family: "Space Mono", monospace;
  font-size: 12px;
  font-style: normal;
  font-weight: 400;
}

.calendar-rail-title {
  color: var(--bujo-ink);
  font-size: 13px;
  font-weight: 500;
  line-height: 1.25;
}

.calendar-rail-item small {
  color: var(--bujo-muted);
  font-family: "Space Mono", monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: .04em;
}

.calendar-rail-item.is-quiet {
  border-style: dashed;
}

.calendar-rail-note {
  margin-top: auto;
  color: var(--bujo-muted);
  font-size: 13px;
  line-height: 1.45;
}

.calendar-rail-note p {
  margin-top: 5px;
}

.profile-pixel-face {
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  background:
    linear-gradient(var(--bujo-ink) 0 0) 8px 4px / 16px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 4px 8px / 4px 16px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 24px 8px / 4px 16px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 8px 24px / 16px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 12px 12px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 20px 12px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 16px 20px / 4px 4px no-repeat;
}

.profile-pixel-face::before,
.profile-pixel-face::after {
  position: absolute;
  top: 0;
  width: 8px;
  height: 8px;
  background: var(--bujo-ink);
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
    box-shadow: 3px 3px 0 var(--bujo-accent);
  }
  40% {
    transform: translate(3px, 3px);
    box-shadow: 0 0 0 var(--bujo-accent);
  }
  100% {
    transform: translate(0, 0);
    box-shadow: 3px 3px 0 var(--bujo-accent);
  }
}
.btn-bounce-green {
  animation: pixel-bounce-green 0.2s ease-in-out;
}

@media (max-width: 900px) {
  .calendar-hero-composition,
  .calendar-content-composition {
    grid-template-columns: 1fr;
  }

  .calendar-hero-actions {
    justify-content: flex-start;
  }

  .calendar-social-rail {
    display: grid;
    grid-template-columns: 1fr 1fr;
    border-left: 0;
    border-top: 1px solid rgb(var(--bujo-line-rgb) / .45);
    padding: 14px 0 0;
  }

  .calendar-rail-heading,
  .calendar-rail-note {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .calendar-main-shell {
    gap: 14px;
  }

  .calendar-title-line h1 {
    font-size: 40px;
  }

  .calendar-exhibition-caption,
  .calendar-social-rail {
    display: none;
  }

  .calendar-hero-actions {
    flex-wrap: wrap;
  }

  .calendar-board {
    box-shadow: none;
  }

  .calendar-weekday {
    padding: 8px 0;
    font-size: 11px;
  }

  .calendar-event-chip {
    grid-template-columns: 5px minmax(0, 1fr);
    gap: 4px;
    min-height: 17px;
    padding: 1px 4px;
    font-size: 10px;
  }

  .calendar-event-dot {
    width: 5px;
    height: 5px;
  }
}
</style>
