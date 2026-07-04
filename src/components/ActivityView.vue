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
          <PixelButton type="button" class="activity-create-button" @click="showCreateModal = true">
            ＋ 揪一團
          </PixelButton>

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
  { key: 'recruiting', text: '揪團中' },
  { key: 'joined', text: '已報名' },
  { key: 'confirmed', text: '已成團' },
  { key: 'mine', text: '我建立的' },
  { key: 'all', text: '全部' },
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
  --activity-page: #f3f4ef;
  --activity-surface: #fbfbf8;
  --activity-ink: #202420;
  --activity-muted: #5a605a;
  --activity-line: #9da197;
  --activity-blue-card: #a5dcfb;
  --activity-green-card: #b3e0d3;
  --activity-pink-card: #f5c2f1;
  --activity-white-card: #ffffff;
  --activity-blue: #3f98c8;
  --activity-green: #36a67e;
  --activity-pink: #d95fa8;
  --activity-yellow: #e8db89;
  min-height: 100%;
  height: 100%;
  max-width: 100%;
  padding: 24px 28px 18px;
  display: grid;
  grid-template-rows: auto minmax(0, 1fr) auto;
  gap: 16px;
  overflow: hidden;
  color: var(--activity-ink);
  background:
    linear-gradient(rgba(231, 232, 225, 0.52) 1px, transparent 1px),
    linear-gradient(90deg, rgba(231, 232, 225, 0.52) 1px, transparent 1px), var(--activity-page);
  background-size: 28px 28px;
  font-family: 'Noto Sans TC', 'PingFang TC', Arial, sans-serif;
}

.activity-gallery-header {
  display: grid;
  grid-template-columns: 150px minmax(0, 1fr) 150px;
  gap: 20px;
  align-items: start;
}

.activity-brand {
  grid-column: 1;
  grid-row: 1;
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 17px;
  font-weight: 950;
}

.activity-pixel-mark {
  width: 26px;
  height: 26px;
  background: var(--activity-yellow);
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
  display: grid;
  place-items: center;
  font-weight: 950;
  cursor: pointer;
}

.activity-heading {
  grid-column: 2;
  grid-row: 1;
  min-width: 0;
  text-align: center;
}

.activity-heading h1 {
  margin: -8px 0 12px;
  color: var(--activity-ink);
  font-size: clamp(54px, 7.8vw, 112px);
  line-height: 0.84;
  letter-spacing: 0;
  font-weight: 950;
  white-space: nowrap;
}

.activity-filter-row {
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 14px 20px;
  font-family: 'Courier New', monospace;
}

.activity-create-button {
  min-height: 30px;
  padding: 4px 10px;
  font-size: 12px;
}

.activity-filter {
  display: inline-grid;
  grid-template-columns: auto auto;
  gap: 6px;
  align-items: start;
  border: 0;
  background: transparent;
  color: var(--activity-ink);
  font-size: 13px;
  line-height: 1.05;
  cursor: pointer;
  padding: 0;
}

.activity-filter b {
  font-size: 15px;
  font-weight: 950;
}

.activity-filter--active b {
  color: var(--activity-green);
}

.activity-note {
  grid-column: 3;
  grid-row: 1;
  margin: 0;
  justify-self: end;
  text-align: right;
  font-family: 'Courier New', monospace;
  font-size: 12px;
  line-height: 1.2;
  color: var(--activity-muted);
}

.activity-stage {
  min-height: 0;
  padding-top: 22px;
  display: grid;
  place-items: start center;
  position: relative;
  overflow: hidden;
}

.activity-ghost {
  position: absolute;
  color: rgba(32, 36, 32, 0.045);
  font-size: clamp(44px, 7vw, 100px);
  line-height: 0.82;
  font-weight: 950;
  pointer-events: none;
  user-select: none;
}

.activity-ghost--left {
  left: max(24px, 8vw);
  top: 72px;
}

.activity-ghost--right {
  right: max(24px, 8vw);
  bottom: 38px;
  text-align: right;
}

.activity-card-rail {
  min-height: 122px;
  padding: 0 0 6px;
  display: grid;
  align-items: center;
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.activity-strip {
  display: flex;
  gap: 16px;
  overflow-x: auto;
  padding: 8px 0 10px;
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
  flex: 0 0 180px;
  height: 96px;
  scroll-snap-align: center;
  border-radius: 12px;
  padding: 12px;
  display: grid;
  align-content: space-between;
  cursor: pointer;
  transform: translateY(0);
  transition:
    transform 160ms ease,
    filter 160ms ease;
}

.activity-mini-card:hover,
.activity-mini-card--active {
  transform: translateY(-4px);
  filter: saturate(1.05);
}

.activity-mini-card--joined {
  background: var(--activity-pink-card);
}

.activity-mini-card--recruiting {
  background: var(--activity-blue-card);
}

.activity-mini-card--confirmed {
  background: var(--activity-green-card);
}

.activity-mini-card--neutral {
  background: var(--activity-white-card);
  border: 1px solid var(--activity-line);
}

.activity-mini-card h2 {
  margin: 0;
  color: var(--activity-ink);
  font-size: 17px;
  line-height: 1.05;
  font-weight: 950;
}

.activity-mini-bottom {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  color: var(--activity-muted);
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
}

.activity-mini-dot {
  width: 7px;
  height: 7px;
  background: currentColor;
  flex: 0 0 auto;
}

.activity-state-message,
.activity-empty {
  margin: auto;
  width: min(420px, calc(100vw - 48px));
  border-radius: 18px;
  background: var(--activity-surface);
  padding: 48px;
  text-align: center;
  font-weight: 850;
}

.activity-state-message--error {
  color: #dc2626;
}

@media (max-width: 900px) {
  .activity-gallery-page {
    padding: 18px 16px;
    grid-template-rows: auto auto auto;
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
    min-height: 390px;
    place-items: start center;
  }

  .activity-ghost {
    display: none;
  }

  .activity-mini-card {
    flex-basis: 156px;
  }
}
</style>
