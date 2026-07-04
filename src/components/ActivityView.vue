<template>
  <div class="activity-gallery-page">
    <header class="activity-gallery-header">
      <div class="activity-brand">
        <span class="activity-pixel-mark"></span>
        <span>BuJo</span>
      </div>

      <button class="activity-menu-button" type="button" @click="emit('toggle-sidebar')">☰</button>

      <div class="activity-heading">
        <h1>Activity</h1>
        <div class="activity-filter-row">

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

          <PixelButton type="button" class="activity-create-button" @click="showCreateModal = true">
            + CREATE
          </PixelButton>
        </div>
      </div>

      <p class="activity-note">
        Social activity index<br />
        click a card below<br />
        to open the room
      </p>
    </header>

    <section v-if="loading" class="activity-state-message">載入中...</section>
    <section v-else-if="fetchError" class="activity-state-message activity-state-message--error">
      {{ fetchError }}
    </section>

    <template v-else-if="featuredActivity">
      <section class="activity-stage">
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
  gap: clamp(26px, 3.8vh, 46px);
  overflow: hidden;
  color: var(--activity-ink);
  background: var(--activity-page);
  font-family: "IBM Plex Sans TC", "PingFang TC", sans-serif;
}

.activity-gallery-header {
  display: grid;
  grid-template-columns: minmax(120px, 1fr) minmax(420px, 2.6fr) minmax(150px, 1fr);
  gap: clamp(18px, 3vw, 42px);
  align-items: start;
  min-height: clamp(132px, 18vh, 170px);
}

.activity-brand {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 16px;
  font-weight: 700;
}

.activity-pixel-mark {
  width: 25px;
  height: 25px;
  background: var(--bujo-card-yellow);
  border: 2px solid var(--activity-ink);
  box-shadow: 4px 4px 0 var(--activity-ink);
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

.activity-heading h1 {
  margin: 0 0 22px;
  color: var(--activity-ink);
  font-size: clamp(62px, 8.2vw, 122px);
  line-height: 0.92;
  letter-spacing: 0;
  font-weight: 900;
  white-space: nowrap;
  display: inline-block;
  transform: scaleY(0.84);
  transform-origin: center bottom;
  -webkit-text-stroke: 0.45px currentColor;
  text-rendering: geometricPrecision;
}

.activity-filter-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  align-items: start;
  gap: 8px 22px;
  font-family: "Space Mono", monospace;
}

.activity-create-button {
  min-height: 26px;
  padding: 3px 11px;
  font-size: 11px;
  background: transparent !important;
  color: var(--activity-ink) !important;
  border-color: var(--activity-ink) !important;
  box-shadow: none !important;
}

.activity-create-button:hover {
  background: var(--activity-ink) !important;
  color: var(--activity-surface) !important;
}

.activity-filter {
  display: inline-grid;
  grid-template-columns: 1fr;
  gap: 1px;
  align-items: start;
  justify-items: start;
  border: 0;
  background: transparent;
  color: var(--activity-ink);
  font-size: 10px;
  line-height: 1.08;
  cursor: pointer;
  padding: 0;
  opacity: 0.78;
  transition:
    opacity 160ms ease,
    color 160ms ease;
}

.activity-filter:hover {
  opacity: 1;
}

.activity-filter b {
  font-size: 13px;
  font-weight: 700;
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
  font-family: "Space Mono", monospace;
  font-size: 11px;
  line-height: 1.2;
  color: var(--activity-muted);
}

.activity-stage {
  min-height: 0;
  padding: clamp(28px, 5.2vh, 68px) 0 clamp(34px, 5.6vh, 76px);
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
}

.activity-ghost {
  position: absolute;
  color: rgba(var(--bujo-ink-rgb), 0.055);
  font-family: "Space Mono", monospace;
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
  flex: 0 0 clamp(152px, 11.2vw, 176px);
  height: 101px;
  scroll-snap-align: center;
  border-radius: 1px;
  padding: 13px 13px 11px;
  display: grid;
  align-content: space-between;
  cursor: pointer;
  background: #dedfdb;
  transform: translateY(0);
  box-shadow: 5px 6px 10px rgba(var(--bujo-ink-rgb), 0.08);
  transition:
    background-color 180ms ease,
    transform 160ms ease,
    filter 160ms ease,
    box-shadow 160ms ease;
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
  font-family: "Space Mono", monospace;
  font-size: 10px;
  font-weight: 400;
}

.activity-mini-dot {
  width: 6px;
  height: 6px;
  background: currentColor;
  flex: 0 0 auto;
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
    height: auto;
    padding: 18px 16px;
    grid-template-rows: auto auto auto;
    overflow-y: auto;
  }

  .activity-gallery-header {
    grid-template-columns: 1fr;
    gap: 16px;
  }

  .activity-brand,
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
    font-size: 56px;
  }

  .activity-filter-row {
    justify-content: flex-start;
    gap: 12px 14px;
  }

  .activity-note {
    justify-self: start;
    text-align: left;
  }

  .activity-stage {
    min-height: 400px;
    place-items: center;
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
