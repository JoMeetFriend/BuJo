<template>
  <div class="activity-gallery-page">
    <header class="activity-gallery-header">
      <div class="activity-heading">
        <p class="activity-eyebrow">{{ t('activity.socialIndex') }}</p>
        <h1>{{ t('activity.activityLabel') }}</h1>
        <div class="activity-filter-row">
          <div class="activity-filter-scroller" :aria-label="t('activity.ariaFilters')">
            <button
              v-for="item in filters"
              :key="item.key"
              type="button"
              @click="currentFilter = item.key"
              class="activity-filter"
              :class="{ 'activity-filter--active': currentFilter === item.key }"
            >
              <span>{{ item.text }}</span>
              <b>{{ filterCounts[item.key] ?? 0 }}</b>
            </button>
          </div>

          <PixelButton type="button" class="activity-create-button" @click="showCreateModal = true">
            {{ t('activity.createButton') }}
          </PixelButton>
        </div>
      </div>
    </header>

    <section v-if="loading" class="activity-state-message">{{ t('activity.loading') }}</section>
    <section v-else-if="fetchError" class="activity-state-message activity-state-message--error">
      {{ fetchError }}
    </section>

    <template v-else-if="featuredActivity || focusMissing">
      <section class="activity-stage">
        <span class="activity-stage-sheet activity-stage-sheet--back" aria-hidden="true"></span>
        <span class="activity-stage-sheet activity-stage-sheet--middle" aria-hidden="true"></span>
        <div v-if="focusMissing" class="activity-state-message">{{ t('activity.notFound') }}</div>
        <ActivityDetailModal
          v-else
          :is-open="true"
          :activity-id="featuredActivity.id"
          @status-changed="fetchActivities"
        />
      </section>

      <section class="activity-card-rail" :aria-label="t('activity.ariaActivities')">
        <ul class="activity-strip">
          <li
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="activity-mini-card"
            :class="[
              miniCardClass(activity),
              !focusMissing && activity.id === featuredActivity?.id
                ? 'activity-mini-card--active'
                : '',
            ]"
            @click="selectActivity(activity.id)"
          >
            <h2 :title="activity.title">{{ miniCardTitle(activity.title) }}</h2>
            <div class="activity-mini-bottom">
              <span>{{ activity.date }}</span>
              <span class="activity-mini-dot"></span>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="activity-empty">{{ t('activity.noActivities') }}</div>

    <EventPage
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @submit="fetchActivities"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import ActivityDetailModal from './ActivityDetailModal.vue'
import EventPage from './EventPage.vue'
import PixelButton from './ui/PixelButton.vue'

const route = useRoute()
const { t } = useI18n()

const filters = computed(() => [
  { key: 'all', text: t('activity.filterAll') },
  { key: 'recruiting', text: t('activity.filterRecruiting') },
  { key: 'joined', text: t('activity.filterJoined') },
  { key: 'confirmed', text: t('activity.filterConfirmed') },
  { key: 'mine', text: t('activity.filterHosting') },
])

const activities = ref([])
const loading = ref(false)
const fetchError = ref('')
const currentFilter = ref('all')
const selectedFeaturedActivityId = ref(null)
const focusRequested = ref(false)
const showCreateModal = ref(false)

// 四個 tab 是各自獨立的狀態/角色 facet，不是互斥分類，同一筆活動可以同時符合多個 tab：
// RECRUITING = 招募中（status 為 recruiting，不分自建或別人的）
// JOINED = 揪團中（已報名、非自己建立、且還沒成團/取消）
// CONFIRMED = 已成團（status 為 confirmed，不分自建或別人的）
// HOSTING = 自己建立的活動（is_creator，不分狀態）
const filterPredicates = {
  mine: (a) => a.is_creator,
  joined: (a) =>
    a.has_joined && !a.is_creator && a.status !== 'confirmed' && a.status !== 'cancelled',
  recruiting: (a) => a.status === 'recruiting',
  confirmed: (a) => a.status === 'confirmed',
}

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') return activities.value
  const predicate = filterPredicates[currentFilter.value]
  if (predicate) return activities.value.filter(predicate)
  return activities.value.filter((a) => a.status === currentFilter.value)
})

const featuredActivity = computed(() => {
  return (
    filteredActivities.value.find((activity) => activity.id === selectedFeaturedActivityId.value) ??
    filteredActivities.value[0] ??
    null
  )
})

// 通知 deep link 指向的活動可能不在列表裡（例如已取消的活動,列表 API 不回傳）——
// 這時不能 fallback 顯示別的活動讓使用者誤以為是通知講的那個,要顯示明確提示
const focusMissing = computed(() => {
  return (
    focusRequested.value &&
    !loading.value &&
    !fetchError.value &&
    !activities.value.some((activity) => activity.id === selectedFeaturedActivityId.value)
  )
})

const filterCounts = computed(() => ({
  all: activities.value.length,
  mine: activities.value.filter(filterPredicates.mine).length,
  joined: activities.value.filter(filterPredicates.joined).length,
  recruiting: activities.value.filter(filterPredicates.recruiting).length,
  confirmed: activities.value.filter(filterPredicates.confirmed).length,
}))

function cardStatus(activity) {
  if (activity.is_creator && activity.status === 'recruiting') return 'mine-recruiting'
  if (activity.is_creator && activity.status === 'confirmed') return 'mine-confirmed'
  if (activity.has_joined && !activity.is_creator && activity.status === 'recruiting')
    return 'joined'
  if (activity.status === 'confirmed') return 'confirmed'
  if (activity.status === 'recruiting') return 'recruiting'
  return 'neutral'
}

function miniCardClass(activity) {
  return `activity-mini-card--${cardStatus(activity)}`
}

function miniCardTitle(title) {
  const text = String(title ?? '')
  return text.length > 13 ? `${text.slice(0, 13)}...` : text
}

async function fetchActivities() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities`, {
      credentials: 'include',
    })
    if (!res.ok) {
      fetchError.value = t('activity.loadFailed')
      return
    }
    const data = await res.json()
    activities.value = data.activities
  } catch {
    fetchError.value = t('activity.connectFailed')
  } finally {
    loading.value = false
  }
}

function selectActivity(id) {
  selectedFeaturedActivityId.value = id
  focusRequested.value = false
}

onMounted(() => {
  // 通知 deep link：/activity?focus=<activityId>，reference.id 可能為整數，一律字串化再比對
  const focus = route.query.focus
  if (focus != null && focus !== '') {
    selectedFeaturedActivityId.value = String(focus)
    focusRequested.value = true
  }
  fetchActivities()
})
</script>

<style scoped>
.activity-gallery-page {
  --activity-page: var(--bujo-surface);
  --activity-surface: var(--bujo-white);
  --activity-ink: var(--bujo-ink);
  --activity-muted: var(--bujo-muted);
  --activity-line: var(--bujo-line);
  --activity-blue-card: var(--bujo-card-blue);
  --activity-green-card: var(--bujo-accent);
  --activity-yellow-card: var(--bujo-card-yellow);
  --activity-pink-card: var(--bujo-card-pink);
  --activity-white-card: var(--bujo-white);
  --activity-blue: #4c8887;
  --activity-green: var(--bujo-accent);
  --activity-pink: var(--bujo-deco-pink);
  --activity-yellow: var(--bujo-card-yellow);
  min-height: 100%;
  height: 100%;
  max-width: 100%;
  padding: clamp(22px, 2.4vw, 34px) clamp(28px, 3.4vw, 48px) clamp(18px, 2vw, 26px);
  display: grid;
  grid-template-rows: auto minmax(390px, 1fr) auto;
  gap: clamp(18px, 2.8vh, 34px);
  overflow: hidden;
  color: var(--activity-ink);
  background:
    radial-gradient(circle, rgb(var(--bujo-line-rgb) / 0.13) 1px, transparent 1px) 0 0 / 24px 24px,
    var(--activity-page);
  font-family: var(--bujo-font-body);
}

.activity-gallery-header {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(420px, 2.25fr) minmax(120px, 1fr);
  gap: clamp(18px, 3vw, 42px);
  align-items: start;
  min-height: clamp(118px, 16vh, 148px);
}

.activity-heading {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  text-align: center;
}

.activity-eyebrow,
.activity-caption {
  margin: 0;
  color: rgb(var(--bujo-ink-rgb) / 0.58);
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.activity-eyebrow {
  margin-bottom: 2px;
  padding-bottom: 6px;
}

.activity-heading h1 {
  margin: 0;
  color: var(--activity-ink);
  font-family: var(--bujo-font-heading);
  font-size: clamp(42px, 5.05vw, 66px);
  line-height: 0.98;
  letter-spacing: 0;
  font-weight: 800;
  white-space: nowrap;
  display: inline-block;
}

.activity-caption {
  margin: 5px 0 14px;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.activity-filter-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
  margin-top: 16px;
  font-family: var(--bujo-font-meta);
}

.activity-filter-scroller {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 7px;
  min-width: 0;
}

.activity-create-button {
  min-height: 28px;
  padding: 4px 11px;
  font-size: 10px;
}

.activity-filter {
  --ticket-bg: transparent;
  display: inline-flex;
  min-height: 30px;
  position: relative;
  align-items: center;
  gap: 7px;
  border: 1px solid transparent;
  background: var(--ticket-bg);
  color: rgb(var(--bujo-ink-rgb) / 0.52);
  font-size: 10px;
  font-weight: 650;
  line-height: 1.08;
  cursor: pointer;
  padding: 6px 9px;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.activity-filter:hover {
  transform: translateY(-1px);
  color: rgb(var(--bujo-ink-rgb) / 0.72);
  border-color: rgb(var(--bujo-line-rgb) / 0.22);
  background: rgb(var(--bujo-white-rgb) / 0.34);
}

.activity-filter b {
  color: rgb(var(--bujo-ink-rgb) / 0.34);
  font-size: 11px;
  font-weight: 650;
}

.activity-filter--active {
  background: rgb(var(--bujo-white-rgb) / 0.62);
  color: rgb(var(--bujo-ink-rgb) / 0.78);
  border-color: rgb(var(--bujo-ink-rgb) / 0.34);
  box-shadow: 1px 2px 0 rgb(var(--bujo-line-rgb) / 0.1);
}

.activity-filter--active b {
  color: var(--bujo-accent);
}

.activity-stage {
  min-height: 0;
  padding: clamp(18px, 3vh, 34px) 0 clamp(20px, 3.8vh, 42px);
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
}

.activity-stage::before {
  position: absolute;
  inset: clamp(18px, 2.8vh, 34px) max(126px, 19vw) clamp(24px, 4vh, 42px);
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.18);
  background:
    linear-gradient(to bottom, rgb(var(--bujo-white-rgb) / 0.36), transparent 42px),
    rgb(var(--bujo-white-rgb) / 0.28);
  box-shadow: 0 10px 18px rgb(var(--bujo-ink-rgb) / 0.025);
  content: '';
}

.activity-stage-sheet {
  position: absolute;
  inset: clamp(26px, 4vh, 42px) max(122px, 18.5vw) clamp(14px, 3vh, 28px);
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.11);
  background: rgb(var(--bujo-white-rgb) / 0.2);
  pointer-events: none;
}

.activity-stage-sheet--back {
  transform: rotate(-0.3deg) translate(-8px, 7px);
}

.activity-stage-sheet--middle {
  transform: rotate(0.24deg) translate(8px, 4px);
}

.activity-stage :deep(.activity-detail-panel) {
  position: relative;
  z-index: 2;
}

.activity-card-rail {
  min-height: 126px;
  padding: 0 0 10px;
  display: grid;
  align-items: center;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.activity-strip {
  display: flex;
  gap: clamp(18px, 1.25vw, 24px);
  overflow-x: auto;
  padding: 8px 0 14px;
  margin: 0;
  list-style: none;
  scroll-snap-type: x proximity;
  scrollbar-width: none;
  touch-action: pan-x;
}

.activity-strip::-webkit-scrollbar {
  display: none;
}

.activity-mini-card {
  --mini-card-hover-bg: var(--activity-white-card);
  position: relative;
  flex: 0 0 clamp(152px, 11.2vw, 176px);
  height: 101px;
  scroll-snap-align: center;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.18);
  border-radius: 1px;
  padding: 13px 13px 11px;
  display: grid;
  align-content: space-between;
  cursor: pointer;
  background:
    linear-gradient(to bottom, rgb(var(--bujo-white-rgb) / 0.2), transparent 30px), #dedfdb;
  transform: translateY(0);
  box-shadow: 5px 6px 10px rgb(var(--bujo-ink-rgb) / 0.08);
  transition:
    background-color 180ms ease,
    transform 160ms ease,
    filter 160ms ease,
    box-shadow 160ms ease;
}

.activity-mini-card::after {
  position: absolute;
  right: 10px;
  bottom: 10px;
  width: 5px;
  height: 5px;
  background: rgb(var(--bujo-ink-rgb) / 0.42);
  opacity: 0.46;
  content: '';
}

.activity-mini-card:hover,
.activity-mini-card--active {
  background: var(--mini-card-hover-bg);
  transform: translateY(-5px);
  filter: saturate(1.02);
  box-shadow: 7px 9px 12px rgb(var(--bujo-ink-rgb) / 0.12);
}

.activity-mini-card--mine-recruiting {
  --mini-card-hover-bg: var(--activity-pink-card);
}

.activity-mini-card--mine-confirmed {
  --mini-card-hover-bg: var(--activity-blue-card);
}

.activity-mini-card--joined {
  --mini-card-hover-bg: var(--activity-blue-card);
}

.activity-mini-card--recruiting {
  --mini-card-hover-bg: var(--activity-green-card);
}

.activity-mini-card--confirmed {
  --mini-card-hover-bg: var(--activity-yellow-card);
}

.activity-mini-card--neutral {
  --mini-card-hover-bg: var(--activity-white-card);
  border: 1px solid var(--activity-line);
}

.activity-mini-card h2 {
  margin: 0;
  color: var(--activity-ink);
  font-size: 16px;
  line-height: 1.12;
  font-weight: 700;
  max-height: 2.24em;
  contain: paint;
  overflow: hidden;
  overflow-wrap: anywhere;
}

.activity-mini-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: rgb(var(--bujo-ink-rgb) / 0.42);
  font-family: 'Space Mono', monospace;
  font-size: 9.5px;
  font-weight: 450;
}

.activity-mini-dot {
  display: none;
}

.activity-state-message,
.activity-empty {
  margin: auto;
  width: min(420px, calc(100vw - 48px));
  border-radius: 1px;
  background: var(--activity-surface);
  padding: 48px;
  text-align: center;
  font-weight: 700;
}

.activity-state-message--error {
  color: var(--bujo-danger);
}

@media (max-width: 900px) {
  .activity-gallery-page {
    min-height: 100%;
    height: 100dvh;
    padding: 18px 16px calc(74px + env(safe-area-inset-bottom));
    grid-template-rows: auto minmax(0, 1fr) auto;
    overflow: hidden;
  }

  .activity-gallery-header {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .activity-heading {
    grid-column: 1;
    grid-row: auto;
    text-align: left;
  }

  .activity-heading h1 {
    white-space: normal;
    font-size: clamp(40px, 13vw, 48px);
    line-height: 0.95;
  }

  .activity-caption {
    margin-bottom: 12px;
  }

  .activity-filter-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    justify-content: flex-start;
    align-items: center;
    gap: 8px;
    width: 100%;
  }

  .activity-filter-scroller {
    flex-wrap: nowrap;
    justify-content: flex-start;
    gap: 8px;
    min-width: 0;
    overflow-x: auto;
    overscroll-behavior-inline: contain;
    scrollbar-width: none;
  }

  .activity-filter-scroller::-webkit-scrollbar {
    display: none;
  }

  .activity-create-button {
    justify-self: end;
    white-space: nowrap;
  }

  .activity-filter {
    flex: 0 0 auto;
    min-height: 28px;
    padding: 5px 8px;
    white-space: nowrap;
  }

  .activity-stage {
    --activity-detail-available-height: 100%;
    position: relative;
    z-index: 3;
    min-height: 0;
    padding: 46px 0 8px;
    place-items: center;
    overflow: visible;
  }

  .activity-stage::before,
  .activity-stage-sheet {
    display: none;
  }

  .activity-stage :deep(.activity-detail-panel) {
    width: min(100%, calc(100vw - 92px));
    max-width: none;
    max-height: var(--activity-detail-available-height);
    min-height: min(250px, var(--activity-detail-available-height));
  }

  .activity-card-rail {
    position: relative;
    z-index: 1;
    margin-top: clamp(42px, 8vh, 68px);
    min-height: 108px;
    padding-bottom: 0;
  }

  .activity-strip {
    padding-bottom: 8px;
  }

  .activity-mini-card {
    flex-basis: 144px;
    height: 101px;
  }
}

@media (max-width: 900px) and (max-height: 700px) {
  .activity-gallery-page {
    gap: 8px;
  }

  .activity-stage {
    padding: 16px 0 4px;
  }

  .activity-card-rail {
    margin-top: 12px;
  }
}
</style>
