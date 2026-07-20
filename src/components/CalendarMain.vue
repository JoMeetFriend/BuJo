<template>
  <div
    class="calendar-main-shell flex flex-col flex-1 min-h-0 px-4 pb-8 md:px-16 md:pt-6 md:pb-16 relative isolate"
  >
    <div
      v-show="showDots"
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

    <button
      v-if="isMobile"
      @click="toggleDotsAnimation"
      class="calendar-arrow-button calendar-toggle-dots-mobile"
      :class="{ 'is-active': showDots }"
      :aria-label="t('calendar.toggleAnimation')"
    >
      <span class="calendar-square-toggle" aria-hidden="true"></span>
    </button>

    <button
      type="button"
      class="calendar-profile-button calendar-page-profile-button hidden md:flex"
      :class="{ 'btn-bounce-green': profileBtnBouncing }"
      @animationend="profileBtnBouncing = false"
      :aria-label="t('calendar.openAccountMenu')"
      @click="openProfileModal"
    >
      <img
        v-if="currentUserAvatarSrc"
        :src="currentUserAvatarSrc"
        :alt="currentUser.display_name"
        class="h-full w-full object-cover"
      />
      <span v-else class="profile-pixel-face profile-pixel-face--small" aria-hidden="true"></span>
    </button>
    <p class="calendar-mood-line" :aria-label="t('calendar.moodLineAria')">
      <strong>BuJo</strong>
      <span class="calendar-mood-divider"></span>
      <span>{{ t('calendar.moodLinePart1') }}</span>
      <span>{{ t('calendar.moodLinePart2') }}</span>
      <span>{{ t('calendar.moodLinePart3') }}</span>
      <span>.</span>
      <span class="calendar-mood-flag" aria-hidden="true"></span>
    </p>
    <p v-if="activitiesFetchError" class="calendar-fetch-error" role="alert">
      {{ activitiesFetchError }}
    </p>
    <div class="md:hidden h-5"></div>

    <section class="calendar-content-composition">
      <div class="calendar-paper-page">
        <span class="calendar-stack-sheet calendar-stack-sheet--back" aria-hidden="true"></span>
        <span class="calendar-stack-sheet calendar-stack-sheet--middle" aria-hidden="true"></span>

        <!-- Hero + controls -->
        <section class="calendar-hero-composition">
          <div class="calendar-hero-copy" :class="{ 'md:pl-[50px]': !sidebarOpen }">
            <div>
              <p class="calendar-eyebrow">{{ t('calendar.eyebrow') }}</p>
              <div class="calendar-title-line">
                <h1>{{ monthNames[currentMonth] }}</h1>
                <span class="calendar-year-mark">{{ currentYear }}</span>
              </div>
              <p class="calendar-exhibition-caption">{{ t('calendar.caption') }}</p>
            </div>
          </div>

          <div class="calendar-hero-actions">
            <button
              v-if="!isMobile"
              @click="toggleDotsAnimation"
              class="calendar-arrow-button"
              :class="{ 'is-active': showDots }"
              :aria-label="t('calendar.toggleAnimation')"
            >
              <span class="calendar-square-toggle" aria-hidden="true"></span>
            </button>
            <button
              @click="prevMonth"
              class="calendar-arrow-button calendar-arrow-button--prev"
              :aria-label="t('calendar.prevMonth')"
            >
              &lt;
              <svg
                class="calendar-crayon-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M15.4 4.6 C12.6 7.1 10.1 9.7 7.8 12.2 C10.2 14.7 12.8 17.3 15.3 19.1" />
                <path d="M16 6.2 C13.4 8.4 11 10.7 9.1 12.1 C11.1 13.8 13.2 16 15.8 17.8" />
                <path d="M14.4 5.7 C12.2 8.1 9.6 10.3 8.6 12.5" />
              </svg>
            </button>
            <button
              @click="nextMonth"
              class="calendar-arrow-button calendar-arrow-button--next"
              :aria-label="t('calendar.nextMonth')"
            >
              &gt;
              <svg
                class="calendar-crayon-icon"
                viewBox="0 0 24 24"
                aria-hidden="true"
                focusable="false"
              >
                <path d="M8.6 4.8 C11.5 7.2 14 9.8 16.2 12.1 C13.9 14.8 11.3 17.2 8.7 19" />
                <path d="M8.1 6.3 C10.7 8.2 13 10.5 14.9 12.1 C12.9 13.9 10.7 16 8.2 17.8" />
                <path d="M9.6 5.9 C11.8 8.1 14.4 10.3 15.4 12.5" />
              </svg>
            </button>

            <!-- 揪一團按鈕 -->
            <PixelButton
              class="calendar-create-button"
              data-tour="calendar-create-button"
              @click="openEventModal"
            >
              <span class="calendar-create-plus">＋</span
              ><span class="hidden md:inline">{{ t('calendar.createBtn') }}</span>
            </PixelButton>
          </div>
        </section>

        <!-- 行事曆本體 -->
        <div ref="calendarRef" class="calendar-board md:flex-1 md:flex md:flex-col">
          <!-- 星期標題 -->
          <div class="calendar-week-row grid grid-cols-7">
            <div v-for="day in weekDays" :key="day" class="calendar-weekday">
              {{ day }}
            </div>
          </div>

          <!-- 格子 -->
          <div
            class="calendar-grid grid grid-cols-7 md:flex-1 md:min-h-0"
            :style="{
              gridTemplateRows: isMobile ? 'repeat(6, minmax(0, 1fr))' : 'repeat(6, 1fr)',
            }"
          >
            <div
              v-for="(cell, index) in calendarDays"
              :key="index"
              class="calendar-cell flex flex-col overflow-hidden justify-start relative pb-2"
              :class="[cell.date && isToday(cell.date) ? 'is-today' : cell.faded ? 'is-faded' : '']"
              :data-tour="cell.date && isToday(cell.date) ? 'calendar-today-cell' : undefined"
              :role="cell.date ? 'button' : undefined"
              :tabindex="cell.date ? 0 : undefined"
              :aria-current="cell.date && isToday(cell.date) ? 'date' : undefined"
              @click="openDateModal(cell.date)"
              @keydown.enter.prevent="openDateModal(cell.date)"
              @keydown.space.prevent="openDateModal(cell.date)"
            >
              <!-- 日期數字（只有當月才顯示） -->
              <div class="w-full p-1 leading-none md:p-1.5">
                <span
                  v-if="cell.day"
                  class="calendar-day-number"
                  :class="{ 'calendar-day-number--today': cell.date && isToday(cell.date) }"
                >
                  {{ cell.day }}
                </span>
              </div>

              <!-- 活動條：只顯示時間最早的一筆，其餘用 +N 表示，點格子仍看得到完整清單 -->
              <div class="calendar-event-list flex flex-col gap-[3px] px-1 pb-1 md:px-2 md:pb-3">
                <template v-for="(event, i) in getEvents(cell.date)" :key="event.id">
                  <div
                    v-if="i === 0"
                    class="calendar-event-chip"
                    :class="statusStyle[event.status]"
                  >
                    <span class="calendar-event-dot"></span>
                    <span class="truncate">{{ event.title }}</span>
                    <span class="calendar-event-meta hidden md:inline">{{
                      statusMeta[event.status]
                    }}</span>
                  </div>
                </template>
              </div>

              <!-- +N：定位相對格子，不受 events 容器高度影響 -->
              <div v-if="getEvents(cell.date).length > 1" class="calendar-more-count">
                +{{ getEvents(cell.date).length - 1 }}
              </div>
            </div>
          </div>
        </div>

        <section class="calendar-mobile-pocket" :aria-label="t('calendar.ariaMobilePocket')">
          <div class="calendar-mobile-pocket-header">
            <span>{{ t('calendar.upcoming') }}</span>
            <strong>{{ upcomingItems.length }}</strong>
          </div>

          <div class="calendar-upcoming-list calendar-upcoming-list--mobile">
            <button
              v-for="item in upcomingItems"
              :key="item.id"
              type="button"
              class="calendar-upcoming-card"
              :class="{ 'is-soon': item.isSoon }"
              @click="openActivityDetail(item.id)"
            >
              <span class="calendar-upcoming-card-meta">
                <span class="calendar-upcoming-date">
                  <strong>{{ item.dayNumber }}</strong>
                  <em>{{ item.monthShort }}</em>
                </span>
                <span class="calendar-upcoming-relative">{{ item.relativeLabel }}</span>
              </span>
              <span class="calendar-upcoming-title">{{ item.title }}</span>
            </button>

            <div v-if="upcomingItems.length === 0" class="calendar-upcoming-card is-empty">
              <span class="calendar-upcoming-empty-title">{{
                t('calendar.noUpcomingThisMonth')
              }}</span>
            </div>
          </div>

          <p v-if="mobileHiddenUpcomingCount > 0" class="calendar-upcoming-hint">
            {{ t('calendar.mobileHiddenCount', { count: mobileHiddenUpcomingCount }) }}
          </p>
        </section>
      </div>

      <aside class="calendar-social-rail" :aria-label="t('calendar.ariaSocialRail')">
        <div class="calendar-rail-heading">
          <span>{{ t('calendar.upcoming') }}</span>
          <strong>{{ upcomingItems.length }}</strong>
        </div>

        <div class="calendar-upcoming-list">
          <button
            v-for="item in upcomingItems"
            :key="item.id"
            type="button"
            class="calendar-upcoming-card"
            :class="{ 'is-soon': item.isSoon }"
            @click="openActivityDetail(item.id)"
          >
            <span class="calendar-upcoming-card-meta">
              <span class="calendar-upcoming-date">
                <strong>{{ item.dayNumber }}</strong>
                <em>{{ item.monthShort }}</em>
              </span>
              <span class="calendar-upcoming-relative">{{ item.relativeLabel }}</span>
            </span>
            <span class="calendar-upcoming-title">{{ item.title }}</span>
          </button>

          <div v-if="upcomingItems.length === 0" class="calendar-upcoming-card is-empty">
            <span class="calendar-upcoming-empty-title">{{
              t('calendar.noUpcomingThisMonth')
            }}</span>
          </div>
        </div>

        <p v-if="desktopHiddenUpcomingCount > 0" class="calendar-upcoming-hint">
          {{ t('calendar.desktopHiddenCount', { count: desktopHiddenUpcomingCount }) }}
        </p>
      </aside>
    </section>

    <DateEventsModal
      v-if="selectedDate"
      :date="selectedDate"
      :events="selectedDateEvents"
      @close="closeDateModal"
      @add="openEventModalFromDate"
      @refresh="fetchActivities"
    />

    <BaseModal
      v-if="selectedActivityId"
      :is-open="true"
      :title="t('activityDetail.title')"
      bare
      @close="closeActivityDetail"
    >
      <ActivityDetailModal
        :is-open="true"
        :activity-id="selectedActivityId"
        closable
        @close="closeActivityDetail"
        @status-changed="fetchActivities"
      />
    </BaseModal>
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
    @submit="fetchActivities"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import PixelButton from './ui/PixelButton.vue'
import BaseModal from './ui/BaseModal.vue'
import ActivityDetailModal from './ActivityDetailModal.vue'
import DateEventsModal from './DateEventsModal.vue'
import ProfileAccountModal from './ProfileAccountModal.vue'
import EventPage from './EventPage.vue'
import { toAvatarSrc } from '@/utils/avatar'

const showDots = ref(true)
const showEventModal = ref(false)
const eventModalInitialDate = ref(null)
const profileBtnBouncing = ref(false)
const router = useRouter()
const authStore = useAuthStore()
const { t } = useI18n()

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
    default: () => ({ formedByMe: true, formedByOthers: true }),
  },
})

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
  if (!showDots.value) return

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

async function toggleDotsAnimation() {
  showDots.value = !showDots.value

  if (showDots.value) {
    await nextTick()

    initDots()
    dotAnimId = requestAnimationFrame(tickDots)
  } else {
    if (dotAnimId) {
      cancelAnimationFrame(dotAnimId)
      dotAnimId = null
    }
  }
}

onMounted(() => {
  window.addEventListener('resize', handleResize)
  initDots()
  dotAnimId = requestAnimationFrame(tickDots)
  fetchActivities()
})
onUnmounted(() => {
  window.removeEventListener('resize', handleResize)
  if (dotAnimId) cancelAnimationFrame(dotAnimId)
})
const today = new Date()
const todayDate = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(
  today.getDate(),
).padStart(2, '0')}`
const currentYear = ref(today.getFullYear())
const currentMonth = ref(today.getMonth())
const selectedDate = ref(null)
const selectedActivityId = ref(null)

const monthKeys = [
  'monthJanuary',
  'monthFebruary',
  'monthMarch',
  'monthApril',
  'monthMay',
  'monthJune',
  'monthJuly',
  'monthAugust',
  'monthSeptember',
  'monthOctober',
  'monthNovember',
  'monthDecember',
]
const monthNames = computed(() => monthKeys.map((key) => t(`calendar.${key}`)))

const monthShortKeys = [
  'monthShortJanuary',
  'monthShortFebruary',
  'monthShortMarch',
  'monthShortApril',
  'monthShortMay',
  'monthShortJune',
  'monthShortJuly',
  'monthShortAugust',
  'monthShortSeptember',
  'monthShortOctober',
  'monthShortNovember',
  'monthShortDecember',
]
const monthShortNames = computed(() => monthShortKeys.map((key) => t(`calendar.${key}`)))

const weekDayKeys = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
const weekDays = computed(() => weekDayKeys.map((key) => t(`calendar.${key}`)))

const activities = ref([])

// 後端保證 date_iso 只有在 status === 'confirmed' 時才非 null，行事曆只依這個欄位
// 決定要不要畫進去，不需要另外判斷情境（免投票/單選/複選日期/各自時段）。
// 已成團的活動會依據 is_creator，拆分為 formedByMe (建立者) 與 formedByOthers (參與者)。
function toCalendarStatus(activity) {
  if (!activity.date_iso) return null
  return activity.is_creator ? 'formedByMe' : 'formedByOthers'
}

const events = computed(() =>
  activities.value
    .filter((activity) => activity.date_iso)
    .map((activity) => ({
      id: activity.id,
      date: activity.date_iso,
      title: activity.title,
      status: toCalendarStatus(activity),
      is_creator: activity.is_creator,
      creator: activity.creator,
      time: activity.time,
      location: activity.location,
      sortTime: activity.confirmed_start ?? activity.date_iso,
    }))
    .sort((a, b) => new Date(a.sortTime) - new Date(b.sortTime)),
)

const activitiesFetchError = ref('')

async function fetchActivities() {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities`, {
      credentials: 'include',
    })
    if (!res.ok) {
      console.error('fetchActivities 失敗：', res.status)
      activitiesFetchError.value = t('calendar.loadActivitiesError')
      return
    }
    const data = await res.json()
    activities.value = data.activities ?? []
    activitiesFetchError.value = ''
  } catch (err) {
    console.error('fetchActivities 失敗：', err)
    activitiesFetchError.value = t('calendar.loadActivitiesNetworkError')
  }
}

const statusStyle = {
  formedByMe: 'calendar-event-chip--formed',
  formedByOthers: 'calendar-event-chip--joined',
  recruiting: 'calendar-event-chip--recruiting',
  none: 'calendar-event-chip--none',
}

const statusMeta = computed(() => ({
  formedByMe: t('calendar.statusFormedByMe'),
  formedByOthers: t('calendar.statusFormedByOthers'),
  personal: t('calendar.statusPersonal'),
  recruiting: t('calendar.statusRecruiting'),
  none: t('calendar.statusNone'),
}))

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

function openActivityDetail(activityId) {
  if (!activityId) return
  selectedActivityId.value = String(activityId)
}

function closeActivityDetail() {
  selectedActivityId.value = null
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
    if (e.status === 'formedByMe' && !props.filters.formedByMe) return false
    if (e.status === 'formedByOthers' && !props.filters.formedByOthers) return false
    return true
  })
}

const selectedDateEvents = computed(() => getEvents(selectedDate.value))
const upcomingEvents = computed(() => {
  const monthDates = new Set(calendarDays.value.filter((d) => d.date).map((d) => d.date))
  return events.value.filter(
    (event) =>
      monthDates.has(event.date) &&
      event.date >= todayDate &&
      getEvents(event.date).some((visible) => visible.id === event.id),
  )
})

function daysFromToday(date) {
  const [todayYear, todayMonth, todayDay] = todayDate.split('-').map(Number)
  const [eventYear, eventMonth, eventDay] = date.split('-').map(Number)
  const todayUtc = Date.UTC(todayYear, todayMonth - 1, todayDay)
  const eventUtc = Date.UTC(eventYear, eventMonth - 1, eventDay)
  return Math.round((eventUtc - todayUtc) / 86_400_000)
}

const upcomingItems = computed(() =>
  upcomingEvents.value.map((event) => {
    const [, month, day] = event.date.split('-')
    const monthIndex = Number(month) - 1
    const daysUntil = daysFromToday(event.date)

    return {
      ...event,
      monthShort: monthShortNames[monthIndex] || month,
      dayNumber: Number(day),
      relativeLabel:
        daysUntil === 0 ? t('calendar.today') : t('calendar.daysLater', { days: daysUntil }),
      isSoon: daysUntil <= 3,
    }
  }),
)

const desktopHiddenUpcomingCount = computed(() => Math.max(0, upcomingItems.value.length - 5))
const mobileHiddenUpcomingCount = computed(() => Math.max(0, upcomingItems.value.length - 4))

function isToday(date) {
  const today = new Date()
  const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
  return date === todayStr
}
</script>

<style scoped>
.calendar-main-shell {
  gap: clamp(16px, 2vw, 26px);
  height: 100%;
  overflow: hidden;
  background-color: #f5f3ec;
  background-image: radial-gradient(circle, rgb(var(--bujo-line-rgb) / 0.11) 1px, transparent 1px);
  background-position: 0 0;
  background-size: 24px 24px;
  color: var(--bujo-text-body);
  font-family: 'Inter', var(--bujo-font-body);
}

.calendar-hero-composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) max-content;
  align-items: end;
  column-gap: clamp(16px, 2.3vw, 28px);
  row-gap: 14px;
  position: relative;
  z-index: 3;
  margin-bottom: clamp(22px, 3vh, 34px);
}

.calendar-hero-copy {
  display: flex;
  align-items: flex-start;
  gap: 14px;
  min-width: 0;
}

.calendar-eyebrow,
.calendar-exhibition-caption {
  font-family: var(--bujo-font-meta);
  letter-spacing: 0.04em;
}

.calendar-eyebrow {
  margin-bottom: 2px;
  padding-bottom: 6px;
  color: var(--bujo-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.calendar-title-line {
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  column-gap: 10px;
  row-gap: 2px;
  min-width: 0;
  max-width: 100%;
}

.calendar-title-line h1 {
  color: var(--bujo-text-primary);
  font-family: 'Inter', var(--bujo-font-body);
  font-size: clamp(36px, 4.5vw, 60px);
  font-weight: 700;
  line-height: 0.94;
  letter-spacing: 0.015em;
  min-width: 0;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.calendar-year-mark {
  display: inline-block;
  color: var(--bujo-text-muted);
  font-family: var(--bujo-font-meta);
  font-size: clamp(10px, 1vw, 12px);
  font-weight: 400;
  letter-spacing: 0.04em;
  transform: translateY(-0.18em);
}

.calendar-exhibition-caption {
  margin-top: 8px;
  color: var(--bujo-text-faint);
  font-size: 10px;
  font-weight: 400;
  line-height: 1.45;
  pointer-events: none;
}

.calendar-hero-actions {
  display: flex;
  flex: 0 0 auto;
  align-items: center;
  align-self: end;
  justify-content: flex-end;
  gap: 8px;
  padding-bottom: 6px;
  white-space: nowrap;
}

.calendar-arrow-button {
  display: grid;
  place-items: center;
  width: 36px;
  height: 36px;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.72);
  background: transparent;
  color: var(--bujo-text-primary);
  font-family: var(--bujo-font-meta);
  font-size: 14px;
  transition:
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.calendar-arrow-button:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-surface);
}

.calendar-create-button {
  margin-left: 4px;
  font-family: var(--bujo-font-meta);
  letter-spacing: 0;
}

.calendar-crayon-icon {
  display: none;
}

.calendar-profile-button {
  align-items: center;
  justify-content: center;
  width: 38px;
  height: 38px;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.72);
  background: var(--bujo-surface);
  transition:
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.calendar-profile-button:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-white);
}

.calendar-page-profile-button {
  position: absolute;
  top: 22px;
  right: 32px;
  z-index: 8;
  width: 42px;
  height: 42px;
  border-color: rgb(var(--bujo-line-rgb) / 0.62);
  background:
    linear-gradient(135deg, rgb(var(--bujo-white-rgb) / 0.92), rgb(var(--bujo-surface-rgb) / 0.94)),
    var(--bujo-surface);
  box-shadow:
    0 8px 16px rgb(var(--bujo-ink-rgb) / 0.08),
    -4px 4px 0 rgb(var(--bujo-deco-pink) / 0.28);
  transform: rotate(-2.5deg);
  transition:
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.calendar-page-profile-button::before,
.calendar-page-profile-button::after {
  position: absolute;
  pointer-events: none;
  clip-path: polygon(
    50% 0,
    61% 35%,
    98% 35%,
    68% 56%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 56%,
    2% 35%,
    39% 35%
  );
  content: '';
}

.calendar-page-profile-button::before {
  top: -9px;
  right: -7px;
  width: 17px;
  height: 17px;
  background: #ef6f9f;
  transform: rotate(16deg);
}

.calendar-page-profile-button::after {
  bottom: -6px;
  left: -7px;
  width: 12px;
  height: 12px;
  background: #56b597;
  transform: rotate(-18deg);
}

.calendar-page-profile-button:hover {
  border-color: var(--bujo-ink);
  box-shadow:
    0 9px 18px rgb(var(--bujo-ink-rgb) / 0.1),
    -4px 4px 0 rgb(var(--bujo-deco-pink) / 0.42);
  transform: rotate(0deg) translateY(-1px);
}

.calendar-fetch-error {
  position: relative;
  z-index: 8;
  margin: 0 0 8px;
  color: var(--bujo-danger);
  font-family: var(--bujo-font-meta);
  font-size: 12px;
  font-weight: 700;
}

.calendar-mood-line {
  position: fixed;
  top: 22px;
  left: 50vw;
  transform: translateX(-50%);
  z-index: 7;
  display: flex;
  max-width: calc(100% - 260px);
  align-items: center;
  gap: 6px;
  color: var(--bujo-text-muted);
  font-family: 'Inter', var(--bujo-font-body);
  font-size: 18px;
  font-weight: 400;
  line-height: 1;
  white-space: nowrap;
}

.calendar-mood-line strong {
  color: var(--bujo-text-body);
  font-weight: 700;
}

.calendar-mood-divider {
  width: 1px;
  height: 32px;
  background: rgb(var(--bujo-line-rgb) / 0.35);
}

.calendar-mood-flag {
  position: relative;
  width: 38px;
  height: 28px;
  border-left: 2px solid rgb(var(--bujo-ink-rgb) / 0.46);
}

.calendar-mood-flag::after {
  position: absolute;
  top: 1px;
  left: 0;
  width: 34px;
  height: 24px;
  background: #ef6f9f;
  clip-path: polygon(0 0, 100% 50%, 0 100%);
  content: '';
}

.calendar-content-composition {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(190px, 240px);
  gap: clamp(18px, 2.2vw, 34px);
  align-items: start;
  min-height: 0;
  margin-top: clamp(92px, 13vh, 112px);
  flex: 1;
}

.calendar-paper-page {
  position: relative;
  isolation: isolate;
  overflow: visible;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.52);
  background: #fffefa;
  box-shadow:
    0 18px 32px rgb(var(--bujo-ink-rgb) / 0.055),
    0 1px 0 rgb(var(--bujo-white-rgb) / 0.7) inset;
  padding: clamp(22px, 2.5vw, 34px) clamp(18px, 2.6vw, 34px) clamp(22px, 2.6vw, 36px)
    clamp(58px, 5vw, 74px);
  display: flex;
  flex-direction: column;
  align-self: start;
  min-width: 0;
  width: 100%;
}

.calendar-stack-sheet {
  position: absolute;
  z-index: -1;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.16);
  background: rgb(var(--bujo-white-rgb) / 0.54);
  pointer-events: none;
}

.calendar-stack-sheet--back {
  inset: 18px -11px -14px 18px;
  background: rgb(var(--bujo-white-rgb) / 0.38);
  transform: rotate(0.6deg);
}

.calendar-stack-sheet--middle {
  inset: 9px -6px -8px 8px;
  background: rgb(var(--bujo-white-rgb) / 0.5);
  transform: rotate(-0.28deg);
}

.calendar-paper-page::before,
.calendar-paper-page::after {
  position: absolute;
  top: 0;
  bottom: 0;
  pointer-events: none;
  content: '';
}

.calendar-paper-page::before {
  left: 0;
  z-index: 2;
  width: 42px;
  border-right: 1px solid rgb(var(--bujo-line-rgb) / 0.16);
  background:
    radial-gradient(circle at 48% 22px, rgb(var(--bujo-line-rgb) / 0.12) 0 8px, transparent 8.5px) 0
      18px / 42px 86px repeat-y,
    #fffefa;
}

.calendar-paper-page::after {
  left: -11px;
  z-index: 1;
  width: 20px;
  background: linear-gradient(to right, rgb(var(--bujo-ink-rgb) / 0.055), transparent 72%);
  clip-path: polygon(22% 0, 100% 0, 78% 31%, 94% 62%, 62% 100%, 0 100%, 18% 68%, 0 37%);
  opacity: 0.72;
}

.calendar-board {
  position: relative;
  z-index: 3;
  overflow: hidden;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.42);
  background: rgb(var(--bujo-white-rgb) / 0.9);
  display: flex;
  flex-direction: column;
  height: clamp(390px, 53vh, 440px);
  min-height: 0;
  flex: 0 0 auto;
}

/* 桌面版：日曆往下延伸進紙張底部內距，負 margin 抵銷高度差，紙張不會被撐高 */
@media (min-width: 768px) {
  .calendar-board {
    height: calc(clamp(390px, 53vh, 440px) + 24px);
    margin-bottom: -24px;
  }
}

.calendar-week-row {
  position: relative;
  z-index: 3;
  border-bottom: 1px solid rgb(var(--bujo-line-rgb) / 0.36);
  background: #f0f1eb;
}

.calendar-grid {
  position: relative;
  z-index: 3;
  flex: 1 1 auto;
  grid-auto-rows: minmax(0, 1fr);
  min-height: 0;
  overflow: hidden;
}

.calendar-weekday {
  padding: 10px 0;
  color: var(--bujo-text-muted);
  text-align: center;
  font-family: var(--bujo-font-meta);
  font-size: 12px;
  font-weight: 700;
}

.calendar-cell {
  min-width: 0;
  min-height: 0;
  border-right: 1px solid rgb(var(--bujo-line-rgb) / 0.24);
  border-bottom: 1px solid rgb(var(--bujo-line-rgb) / 0.24);
  background: rgb(var(--bujo-white-rgb) / 0.84);
  transition:
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.calendar-event-list {
  min-height: 0;
  overflow: hidden;
}

.calendar-cell:hover {
  background: #fffefa;
  box-shadow: inset 0 0 0 1px var(--bujo-accent);
}

.calendar-cell.is-faded {
  background: rgb(var(--bujo-page-rgb) / 0.36);
}

.calendar-day-number {
  display: inline-block;
  color: var(--bujo-text-muted);
  font-family: var(--bujo-font-meta);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
}

.calendar-day-number--today {
  position: relative;
  z-index: 0;
  color: var(--bujo-ink);
}

.calendar-day-number--today::before {
  position: absolute;
  top: 50%;
  left: 50%;
  z-index: -1;
  width: 20px;
  height: 20px;
  border-radius: 50%;
  background: color-mix(in srgb, var(--bujo-notification) 40%, var(--bujo-white));
  transform: translate(-50%, -50%);
  content: '';
}

@media (min-width: 768px) {
  .calendar-day-number--today::before {
    width: 22px;
    height: 22px;
  }
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
  font-family: var(--bujo-font-body);
  font-size: 11px;
  font-weight: 600;
  cursor: pointer;
  transition:
    transform 140ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 140ms cubic-bezier(0.2, 0.8, 0.2, 1);
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
  color: rgb(var(--bujo-ink-rgb) / 0.56);
  font-family: var(--bujo-font-meta);
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
  color: var(--bujo-text-primary);
  font-family: var(--bujo-font-meta);
  font-size: 9px;
  font-weight: 700;
  line-height: 1;
  padding: 2px 4px;
}

.calendar-social-rail {
  display: flex;
  flex-direction: column;
  gap: 14px;
  border-left: 1px solid rgb(var(--bujo-line-rgb) / 0.32);
  padding: 10px 0 0 20px;
}

.calendar-rail-heading {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
  color: var(--bujo-text-primary);
}

.calendar-rail-heading span,
.calendar-mobile-pocket-header span {
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.28em;
}

.calendar-rail-heading strong {
  color: var(--bujo-deco-blue);
  font-family: var(--bujo-font-meta);
  font-size: 18px;
}

.calendar-upcoming-list {
  display: grid;
  gap: 12px;
  max-height: 568px;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding-right: 5px;
  scrollbar-color: rgb(var(--bujo-ink-rgb) / 0.28) transparent;
  scrollbar-width: thin;
}

.calendar-upcoming-list::-webkit-scrollbar {
  width: 5px;
}

.calendar-upcoming-list::-webkit-scrollbar-thumb {
  background: rgb(var(--bujo-ink-rgb) / 0.28);
}

.calendar-upcoming-list::-webkit-scrollbar-track {
  background: transparent;
}

.calendar-upcoming-card {
  position: relative;
  display: grid;
  gap: 12px;
  width: 100%;
  min-height: 104px;
  border: 1px dashed rgb(var(--bujo-line-rgb) / 0.72);
  background: rgb(var(--bujo-white-rgb) / 0.5);
  padding: 15px 16px 14px;
  color: var(--bujo-text-primary);
  text-align: left;
  transition:
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.calendar-upcoming-card.is-soon {
  border-style: solid;
  border-color: rgb(var(--bujo-line-rgb) / 0.46);
  background:
    linear-gradient(145deg, rgb(var(--bujo-white-rgb) / 0.62), transparent 48%),
    color-mix(in srgb, var(--bujo-card-blue) 44%, var(--bujo-white));
}

.calendar-upcoming-card:hover {
  border-color: rgb(var(--bujo-ink-rgb) / 0.58);
  background:
    linear-gradient(145deg, rgb(var(--bujo-white-rgb) / 0.5), transparent 48%),
    color-mix(in srgb, var(--bujo-card-blue) 54%, var(--bujo-white));
}

.calendar-upcoming-card-meta {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.calendar-upcoming-date {
  display: inline-flex;
  align-items: baseline;
  gap: 8px;
  color: var(--bujo-text-primary);
  line-height: 0.8;
}

.calendar-upcoming-date strong {
  font-family: var(--bujo-font-deco);
  font-size: 34px;
  font-weight: 700;
  letter-spacing: 0;
  line-height: 0.76;
}

.calendar-upcoming-date em {
  color: var(--bujo-text-muted);
  font-family: var(--bujo-font-meta);
  font-size: 11px;
  font-style: normal;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.calendar-upcoming-relative {
  flex: 0 0 auto;
  background: rgb(var(--bujo-line-rgb) / 0.12);
  color: var(--bujo-text-muted);
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  padding: 5px 7px;
}

.calendar-upcoming-card.is-soon .calendar-upcoming-relative {
  background: #4a7fa5;
  color: var(--bujo-white);
}

.calendar-upcoming-title {
  overflow: hidden;
  color: var(--bujo-text-primary);
  font-family: var(--bujo-font-body);
  font-size: 14px;
  font-weight: 700;
  line-height: 1.25;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.calendar-upcoming-card.is-empty {
  place-items: center;
  border-style: dashed;
  background: rgb(var(--bujo-white-rgb) / 0.36);
  cursor: default;
}

.calendar-upcoming-card.is-empty:hover {
  border-color: rgb(var(--bujo-line-rgb) / 0.72);
  background: rgb(var(--bujo-white-rgb) / 0.36);
}

.calendar-upcoming-empty-title {
  color: var(--bujo-text-muted);
  font-size: 13px;
  font-weight: 500;
  text-align: center;
}

.calendar-upcoming-hint {
  color: var(--bujo-text-muted);
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  line-height: 1.4;
}

.calendar-mobile-pocket {
  display: none;
}

.calendar-mobile-pocket-header {
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: 10px;
}

.calendar-mobile-pocket-header strong {
  color: var(--bujo-deco-blue);
  font-family: var(--bujo-font-meta);
  font-size: 16px;
  font-weight: 700;
}

.calendar-mobile-pocket .calendar-upcoming-hint {
  margin-top: 8px;
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
  .calendar-mood-line {
    display: none;
  }

  .calendar-hero-composition,
  .calendar-content-composition {
    grid-template-columns: 1fr;
  }

  .calendar-content-composition {
    margin-top: 24px;
  }

  .calendar-hero-actions {
    justify-content: flex-start;
  }

  .calendar-paper-page {
    padding: 22px 18px 22px 54px;
  }

  .calendar-social-rail {
    border-left: 0;
    border-top: 1px solid rgb(var(--bujo-line-rgb) / 0.45);
    padding: 14px 0 0;
  }

  .calendar-upcoming-list {
    display: flex;
    gap: 12px;
    max-height: none;
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    padding: 0 0 6px;
    scrollbar-width: none;
    touch-action: pan-x;
  }

  .calendar-upcoming-list::-webkit-scrollbar {
    display: none;
  }

  .calendar-upcoming-card {
    flex: 0 0 min(58vw, 210px);
    min-height: 88px;
    gap: 8px;
    padding: 12px 14px 11px;
  }
}

@media (max-width: 640px) {
  .calendar-main-shell {
    gap: 14px;
    padding: 8px 8px calc(84px + env(safe-area-inset-bottom, 0px));
  }

  .calendar-content-composition {
    margin-top: 6px;
  }

  .calendar-hero-composition {
    position: relative;
    margin-bottom: 24px;
    padding-right: 94px;
  }

  .calendar-title-line h1 {
    font-size: 36px;
  }

  .calendar-exhibition-caption,
  .calendar-social-rail {
    display: none;
  }

  .calendar-hero-actions {
    position: absolute;
    right: 3px;
    bottom: 1px;
    width: auto;
    align-self: auto;
    justify-content: flex-end;
    gap: 4px;
    margin-top: 0;
    padding-bottom: 0;
  }

  .calendar-arrow-button {
    position: relative;
    display: grid;
    place-items: center;
    width: 25px;
    height: 25px;
    border: 0;
    background: transparent;
    color: rgb(var(--bujo-ink-rgb) / 0.72);
    cursor: pointer;
    font-size: 0;
    transform-origin: center;
    transition:
      color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
      transform 120ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .calendar-crayon-icon {
    position: relative;
    z-index: 1;
    display: block;
    width: 20px;
    height: 20px;
    overflow: visible;
    fill: none;
    stroke: currentColor;
    stroke-linecap: round;
    stroke-linejoin: round;
    pointer-events: none;
  }

  .calendar-crayon-icon path {
    stroke-dasharray: 1.2 1.6;
    stroke-width: 2.25;
  }

  .calendar-crayon-icon path:nth-child(2) {
    opacity: 0.42;
    stroke-dasharray: 0.6 2.2;
    stroke-width: 1.35;
  }

  .calendar-crayon-icon path:nth-child(3) {
    opacity: 0.26;
    stroke-dasharray: 0.35 2.7;
    stroke-width: 1;
  }

  .calendar-arrow-button--prev {
    transform: rotate(-4deg);
  }

  .calendar-arrow-button--next {
    transform: rotate(3deg);
  }

  .calendar-arrow-button--prev:hover {
    color: var(--bujo-deco-blue);
    transform: rotate(-7deg) scale(1.08);
  }

  .calendar-arrow-button--next:hover {
    color: #c9a84d;
    transform: rotate(6deg) scale(1.08);
  }

  .calendar-arrow-button:active {
    color: var(--bujo-deco-pink);
    transform: rotate(0deg) scale(0.94);
  }

  .calendar-create-button {
    display: grid;
    flex: 0 0 auto;
    place-items: center;
    width: 42px;
    height: 40px;
    margin-left: 6px;
    padding: 0;
    border: 0;
    background: transparent !important;
    color: rgb(var(--bujo-ink-rgb) / 0.72);
    font-family: var(--bujo-font-meta);
    font-size: 20px;
    font-weight: 700;
    box-shadow: none;
    transition: color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  .calendar-create-button:hover:not(:disabled) {
    background: transparent !important;
    color: var(--bujo-ink);
  }

  .calendar-create-button:active:not(:disabled) {
    background: transparent !important;
    transform: scale(0.94);
  }

  .calendar-paper-page {
    padding: 14px 10px 18px 32px;
  }

  .calendar-board {
    height: clamp(292px, calc(100dvh - 360px), 360px);
    box-shadow: none;
  }

  .calendar-mobile-pocket {
    position: relative;
    z-index: 4;
    display: block;
    margin-top: 12px;
    overflow: visible;
    border-top: 1px dashed rgb(var(--bujo-line-rgb) / 0.48);
    padding-top: 10px;
    padding-bottom: 6px;
  }

  .calendar-mobile-pocket .calendar-upcoming-list {
    margin-top: 8px;
  }

  .calendar-mobile-pocket .calendar-upcoming-card {
    flex-basis: min(42vw, 160px);
    min-height: 72px;
    gap: 5px;
    padding: 9px 10px 8px;
  }

  .calendar-stack-sheet--back {
    inset: 10px -5px -7px 8px;
  }

  .calendar-stack-sheet--middle {
    inset: 5px -3px -4px 4px;
  }

  .calendar-paper-page::before {
    width: 24px;
    background:
      radial-gradient(circle at 48% 18px, rgb(var(--bujo-line-rgb) / 0.15) 0 5px, transparent 5.5px)
        0 14px / 24px 66px repeat-y,
      var(--bujo-surface);
  }

  .calendar-paper-page::after {
    left: -7px;
    width: 13px;
  }

  .calendar-weekday {
    padding: 8px 0;
    font-size: 11px;
  }

  .calendar-event-list {
    padding-inline: 2px;
  }

  .calendar-event-chip {
    grid-template-columns: 4px minmax(0, 1fr);
    gap: 3px;
    min-height: 17px;
    padding: 1px 3px;
    font-size: 10px;
  }

  .calendar-event-dot {
    width: 4px;
    height: 4px;
  }

  .calendar-more-count {
    top: 4px;
    right: 4px;
    bottom: auto;
    padding: 0;
    font-size: 8px;
    line-height: 1;
  }
}

@media (max-width: 640px) and (max-height: 700px) {
  .calendar-main-shell {
    gap: 8px;
  }

  .calendar-content-composition {
    min-height: 0;
    margin-top: 0;
  }

  .calendar-paper-page {
    align-self: stretch;
    min-height: 0;
    height: 100%;
    padding: 10px 8px 10px 28px;
  }

  .calendar-hero-composition {
    margin-bottom: 12px;
  }

  .calendar-eyebrow {
    margin-bottom: 0;
    padding-bottom: 2px;
    font-size: 10px;
  }

  .calendar-title-line h1 {
    font-size: 32px;
  }

  .calendar-board {
    flex: 1 1 auto;
    height: clamp(220px, calc(100dvh - 330px), 360px);
    min-height: 220px;
    max-height: 360px;
  }

  .calendar-mobile-pocket {
    margin-top: 8px;
    padding-top: 6px;
    padding-bottom: 0;
  }

  .calendar-mobile-pocket .calendar-upcoming-list {
    margin-top: 6px;
  }

  .calendar-upcoming-card {
    min-height: 64px;
    gap: 4px;
    padding: 8px 10px 7px;
  }

  .calendar-upcoming-date strong {
    font-size: 28px;
  }

  .calendar-upcoming-relative {
    padding: 4px 6px;
  }

  .calendar-upcoming-title {
    font-size: 13px;
  }

  .calendar-weekday {
    padding: 6px 0;
  }
}

.calendar-square-toggle {
  display: block;
  width: 12px;
  height: 12px;
  border: 1px solid rgb(var(--bujo-ink-rgb) / 0.5);
  background: transparent;
  transition: all 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.calendar-arrow-button.is-active .calendar-square-toggle {
  background: #98d0a2;
  border-color: #98d0a2;
  box-shadow: 2px 2px 0 rgb(var(--bujo-ink-rgb) / 0.15);
  transform: translate(-1px, -1px);
}

.calendar-arrow-button:hover .calendar-square-toggle:not(.is-active) {
  border-color: var(--bujo-ink);
}

@media (max-width: 640px) {
  .calendar-toggle-dots-mobile {
    position: absolute;
    top: 5px;
    right: 48px;
    z-index: 10;

    display: grid;
    width: 26px;
    height: 26px;
    border: 1px solid rgb(var(--bujo-line-rgb) / 0.72);
    background: transparent;
  }

  .calendar-toggle-dots-mobile:hover {
    border-color: var(--bujo-ink);
    background: var(--bujo-surface);
  }
}
</style>
