<template>
  <div class="activity-gallery-page">
    <header class="activity-gallery-header">
      <button class="activity-menu-button" type="button" @click="emit('toggle-sidebar')">☰</button>

      <div class="activity-heading">
        <p class="activity-eyebrow">SOCIAL ACTIVITY INDEX</p>
        <h1>BuJo Activity</h1>
        <p class="activity-caption">( rooms becoming visible / friends in motion )</p>
        <div class="activity-filter-row">
          <div class="activity-filter-scroller" aria-label="activity filters">
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
            + CREATE
          </PixelButton>
        </div>
      </div>

      <p class="activity-note">
        small rooms<br />
        open with one click<br />
        keep the plan moving
      </p>
    </header>

    <section v-if="loading" class="activity-state-message">載入中...</section>
    <section v-else-if="fetchError" class="activity-state-message activity-state-message--error">
      {{ fetchError }}
    </section>

    <template v-else-if="featuredActivity">
      <section class="activity-stage">
        <span class="activity-stage-sheet activity-stage-sheet--back" aria-hidden="true"></span>
        <span class="activity-stage-sheet activity-stage-sheet--middle" aria-hidden="true"></span>
        <div class="activity-ghost activity-ghost--left">room<br />index</div>
        <div class="activity-ghost activity-ghost--right">friends<br />active</div>
        <ActivityDetailModal
          :is-open="true"
          :activity-id="featuredActivity.id"
          :class="focusCardClass(featuredActivity)"
          @status-changed="fetchActivities"
        />
      </section>

      <section class="activity-card-rail" aria-label="activities">
        <ul class="activity-strip">
          <li
            v-for="activity in filteredActivities"
            :key="activity.id"
            class="activity-mini-card"
            :class="[
              miniCardClass(activity),
              activity.id === featuredActivity.id ? 'activity-mini-card--active' : '',
            ]"
            @click="selectActivity(activity.id)"
          >
            <h2>{{ activity.title }}</h2>
            <div class="activity-mini-bottom">
              <span>{{ activity.date }}</span>
              <span class="activity-mini-dot"></span>
            </div>
          </li>
        </ul>
      </section>
    </template>

    <div v-else class="activity-empty">目前沒有相關活動</div>

    <EventPage
      :is-open="showCreateModal"
      @close="showCreateModal = false"
      @submit="fetchActivities"
    />
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import ActivityDetailModal from './ActivityDetailModal.vue'
import EventPage from './EventPage.vue'
import PixelButton from './ui/PixelButton.vue'

const emit = defineEmits(['toggle-sidebar'])

const filters = [
  { key: 'recruiting', text: 'RECRUITING' },
  { key: 'joined', text: 'JOINED' },
  { key: 'confirmed', text: 'CONFIRMED' },
  { key: 'mine', text: 'HOSTING' },
  { key: 'all', text: 'ALL' },
]

const activities = ref([])
const loading = ref(false)
const fetchError = ref('')
const currentFilter = ref('all')
const selectedFeaturedActivityId = ref(null)
const showCreateModal = ref(false)

const filteredActivities = computed(() => {
  if (currentFilter.value === 'all') return activities.value
  if (currentFilter.value === 'mine') return activities.value.filter((a) => a.is_creator)
  if (currentFilter.value === 'joined') {
    return activities.value.filter(
      (a) => a.has_joined && !a.is_creator && a.status === 'recruiting',
    )
  }
  if (currentFilter.value === 'recruiting') {
    return activities.value.filter((a) => a.status === 'recruiting' && !a.is_creator)
  }
  if (currentFilter.value === 'confirmed') {
    return activities.value.filter(
      (a) => a.status === 'confirmed' && (a.has_joined || a.is_creator),
    )
  }
  return activities.value.filter((a) => a.status === currentFilter.value)
})

const featuredActivity = computed(() => {
  return (
    filteredActivities.value.find((activity) => activity.id === selectedFeaturedActivityId.value) ??
    filteredActivities.value[0] ??
    null
  )
})

const filterCounts = computed(() => ({
  all: activities.value.length,
  mine: activities.value.filter((a) => a.is_creator).length,
  joined: activities.value.filter((a) => a.has_joined && !a.is_creator && a.status === 'recruiting')
    .length,
  recruiting: activities.value.filter((a) => a.status === 'recruiting' && !a.is_creator).length,
  confirmed: activities.value.filter(
    (a) => a.status === 'confirmed' && (a.has_joined || a.is_creator),
  ).length,
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

function focusCardClass(activity) {
  return `activity-focus-card--${cardStatus(activity)}`
}

function miniCardClass(activity) {
  return `activity-mini-card--${cardStatus(activity)}`
}

async function fetchActivities() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities`, {
      credentials: 'include',
    })
    if (!res.ok) {
      fetchError.value = '無法載入活動'
      return
    }
    const data = await res.json()
    activities.value = data.activities
  } catch {
    fetchError.value = '無法連線到伺服器'
  } finally {
    loading.value = false
  }
}

function selectActivity(id) {
  selectedFeaturedActivityId.value = id
}

onMounted(fetchActivities)
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
  grid-template-columns: minmax(120px, 1fr) minmax(420px, 2.4fr) minmax(150px, 1fr);
  gap: clamp(18px, 3vw, 42px);
  align-items: start;
  min-height: clamp(118px, 16vh, 148px);
}

.activity-menu-button {
  grid-column: 1;
  grid-row: 1;
  margin-top: 30px;
  width: 38px;
  height: 38px;
  border: 1px solid var(--activity-line);
  background: var(--activity-surface);
  color: var(--activity-ink);
  display: grid;
  place-items: center;
  font-weight: 700;
  cursor: pointer;
  transition:
    background-color 160ms ease,
    color 160ms ease,
    transform 160ms ease;
}

.activity-menu-button:hover {
  background: var(--activity-ink);
  color: var(--activity-surface);
}

.activity-menu-button:active {
  transform: translateY(1px);
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
}

.activity-heading h1 {
  margin: 0;
  color: var(--activity-ink);
  font-family: var(--bujo-font-heading);
  font-size: clamp(48px, 6.2vw, 82px);
  line-height: 0.96;
  letter-spacing: 0;
  font-weight: 800;
  white-space: nowrap;
  display: inline-block;
}

.activity-caption {
  margin: 6px 0 16px;
  font-weight: 400;
  letter-spacing: 0.04em;
}

.activity-filter-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: center;
  gap: 7px;
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
  min-height: 26px;
  padding: 3px 11px;
  font-size: 11px;
}

.activity-filter {
  display: inline-flex;
  min-height: 30px;
  align-items: center;
  gap: 7px;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.58);
  background: rgb(var(--bujo-white-rgb) / 0.48);
  color: var(--activity-ink);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.08;
  cursor: pointer;
  padding: 5px 8px;
  opacity: 0.72;
  transition:
    opacity 160ms ease,
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.activity-filter:hover {
  opacity: 1;
  transform: translateY(-1px);
}

.activity-filter b {
  color: var(--activity-muted);
  font-size: 13px;
  font-weight: 700;
}

.activity-filter--active {
  border-color: var(--activity-ink);
  background: var(--activity-surface);
  opacity: 1;
}

.activity-filter--active b {
  color: var(--bujo-accent);
}

.activity-note {
  grid-column: 3;
  grid-row: 1;
  margin: 0;
  justify-self: end;
  text-align: right;
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  line-height: 1.2;
  color: var(--activity-muted);
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
  inset: clamp(12px, 2vh, 24px) max(120px, 18vw) clamp(18px, 3vh, 30px);
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.34);
  background:
    linear-gradient(to bottom, rgb(var(--bujo-white-rgb) / 0.62), transparent 42px),
    rgb(var(--bujo-surface-rgb, 251 251 248) / 0.78);
  box-shadow: 0 14px 26px rgb(var(--bujo-ink-rgb) / 0.045);
  content: '';
}

.activity-stage-sheet {
  position: absolute;
  inset: clamp(20px, 3vh, 34px) max(112px, 17vw) clamp(8px, 2vh, 18px);
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.2);
  background: rgb(var(--bujo-white-rgb) / 0.42);
  pointer-events: none;
}

.activity-stage-sheet--back {
  transform: rotate(-0.55deg) translate(-12px, 10px);
}

.activity-stage-sheet--middle {
  transform: rotate(0.45deg) translate(12px, 5px);
}

.activity-stage :deep(.activity-detail-panel) {
  position: relative;
  z-index: 2;
}

.activity-ghost {
  position: absolute;
  z-index: 1;
  color: rgba(var(--bujo-ink-rgb), 0.22);
  font-family: var(--bujo-font-meta);
  font-size: 12px;
  line-height: 1.25;
  font-weight: 400;
  pointer-events: none;
  user-select: none;
}

.activity-ghost--left {
  left: max(36px, 7vw);
  top: 35%;
}

.activity-ghost--right {
  right: max(42px, 8vw);
  top: 45%;
  text-align: right;
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
  box-shadow: 5px 6px 10px rgba(var(--bujo-ink-rgb), 0.08);
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
  width: 6px;
  height: 6px;
  background: currentColor;
  opacity: 0.62;
  content: '';
}

.activity-mini-card:hover,
.activity-mini-card--active {
  background: var(--mini-card-hover-bg);
  transform: translateY(-5px);
  filter: saturate(1.02);
  box-shadow: 7px 9px 12px rgba(var(--bujo-ink-rgb), 0.12);
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
  line-height: 1.08;
  font-weight: 700;
}

.activity-mini-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--activity-muted);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 400;
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
  color: #dc2626;
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

  .activity-menu-button,
  .activity-heading,
  .activity-note {
    grid-column: 1;
    grid-row: auto;
  }

  .activity-menu-button {
    margin-top: 0;
  }

  .activity-heading {
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

  .activity-note {
    display: none;
  }

  .activity-stage {
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

  .activity-ghost {
    display: none;
  }

  .activity-mini-card {
    flex-basis: 144px;
    height: 101px;
  }
}
</style>
