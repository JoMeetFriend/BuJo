<template>
  <div class="activity-gallery-page">
    <header class="activity-gallery-header">
      <div class="activity-heading">
        <p class="activity-eyebrow">{{ t('activity.socialIndex') }}</p>
        <h1>{{ t('activity.activityLabel') }}</h1>
      </div>

      <PixelButton type="button" class="activity-create-button" @click="showCreateModal = true">
        {{ t('activity.createButton') }}
      </PixelButton>
    </header>

    <nav class="activity-filter-toolbar" :aria-label="t('activity.ariaFilters')">
      <div class="activity-filter-scroller">
        <div class="activity-filter-group">
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
    </nav>

    <section v-if="loading" class="activity-state-message">{{ t('activity.loading') }}</section>
    <section v-else-if="fetchError" class="activity-state-message activity-state-message--error">
      {{ fetchError }}
    </section>

    <template v-else-if="featuredActivity || focusMissing">
      <div class="activity-content">
        <section class="activity-stage">
          <Transition name="activity-focus" mode="out-in">
            <div v-if="focusMissing" key="focus-missing" class="activity-state-message">
              {{ t('activity.notFound') }}
            </div>
            <div v-else :key="featuredActivity.id" class="activity-focus-frame">
              <div class="activity-paper-stack">
                <span
                  class="activity-stage-sheet activity-stage-sheet--back"
                  aria-hidden="true"
                ></span>
                <span
                  class="activity-stage-sheet activity-stage-sheet--middle"
                  aria-hidden="true"
                ></span>
                <ActivityDetailModal
                  :is-open="true"
                  :activity-id="featuredActivity.id"
                  @status-changed="fetchActivities"
                />
              </div>
            </div>
          </Transition>
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
              <div class="activity-mini-title-row">
                <span
                  class="activity-mini-avatar"
                  :class="{ 'activity-mini-avatar--initial': !creatorAvatarSrc(activity) }"
                  aria-hidden="true"
                >
                  <img
                    v-if="creatorAvatarSrc(activity)"
                    :src="creatorAvatarSrc(activity)"
                    alt=""
                    loading="lazy"
                    @error="handleCreatorAvatarError(activity.id)"
                  />
                  <span v-else>{{ miniCardCreatorInitial(activity) }}</span>
                </span>
                <h2 :title="activity.title">{{ miniCardTitle(activity.title) }}</h2>
              </div>
              <div class="activity-mini-bottom">
                <span>{{ activity.date }}</span>
                <span class="activity-mini-dot"></span>
              </div>
            </li>
          </ul>
        </section>
      </div>
    </template>

    <div v-else class="activity-content activity-content--empty">
      <section class="activity-stage activity-stage--empty">
        <div class="activity-paper-stack activity-paper-stack--empty">
          <span class="activity-stage-sheet activity-stage-sheet--back" aria-hidden="true"></span>
          <span class="activity-stage-sheet activity-stage-sheet--middle" aria-hidden="true"></span>

          <article class="activity-empty" role="status" aria-live="polite">
            <p class="activity-empty-kicker">{{ t('activity.emptyKicker') }}</p>
            <h2>
              {{
                activities.length === 0
                  ? t('activity.emptyAllTitle')
                  : t('activity.emptyFilterTitle')
              }}
            </h2>
            <p class="activity-empty-copy">
              {{
                activities.length === 0 ? t('activity.emptyAllBody') : t('activity.emptyFilterBody')
              }}
            </p>
          </article>
        </div>
      </section>

      <aside class="activity-card-rail activity-card-rail--empty">
        <div class="activity-rail-empty">
          <p class="activity-rail-empty-kicker">{{ t('activity.emptyRailKicker') }}</p>
          <h2>{{ t('activity.emptyRailTitle') }}</h2>
          <p>{{ t('activity.emptyRailBody') }}</p>
        </div>
      </aside>
    </div>

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
import { toAvatarSrc } from '@/utils/avatar'
import { apiFetch } from '@/services/httpClient'

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
const brokenCreatorAvatarIds = ref(new Set())

function creatorAvatarSrc(activity) {
  if (!activity.creator?.avatar_url) return ''
  if (brokenCreatorAvatarIds.value.has(activity.id)) return ''
  return toAvatarSrc(activity.creator.avatar_url)
}

function handleCreatorAvatarError(activityId) {
  brokenCreatorAvatarIds.value = new Set([...brokenCreatorAvatarIds.value, activityId])
}
const currentFilter = ref('all')
const selectedFeaturedActivityId = ref(null)
const focusRequested = ref(false)
const showCreateModal = ref(false)

// 四個 tab 以使用者任務分流：
// RECRUITING = 可報名的招募中活動（非自己建立、尚未報名、status 為 recruiting）
// JOINED = 揪團中（已報名、非自己建立、且還沒成團/取消）
// CONFIRMED = 已成團（status 為 confirmed，不分自建或別人的）
// HOSTING = 自己建立的活動（is_creator，不分狀態）
const filterPredicates = {
  mine: (a) => a.is_creator,
  joined: (a) =>
    a.has_joined && !a.is_creator && a.status !== 'confirmed' && a.status !== 'cancelled',
  recruiting: (a) => a.status === 'recruiting' && !a.has_joined && !a.is_creator,
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

function miniCardCreatorInitial(activity) {
  const name = activity.creator?.display_name || activity.creator?.name || ''
  return String(name).trim().charAt(0) || '?'
}

async function fetchActivities() {
  loading.value = true
  fetchError.value = ''
  try {
    const res = await apiFetch('/api/activities', {
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
  --activity-rail-width: clamp(190px, 18vw, 240px);
  --activity-column-gap: clamp(18px, 2.2vw, 32px);
  min-height: 100%;
  height: 100%;
  max-width: 100%;
  padding: clamp(22px, 2.4vw, 34px) clamp(28px, 3.4vw, 48px) clamp(18px, 2vw, 26px);
  display: grid;
  grid-template-rows: auto auto minmax(390px, 1fr);
  gap: clamp(12px, 1.8vh, 20px);
  overflow: hidden;
  color: var(--activity-ink);
  background:
    radial-gradient(circle, rgb(var(--bujo-line-rgb) / 0.13) 1px, transparent 1px) 0 0 / 24px 24px,
    var(--activity-page);
  font-family: var(--bujo-font-body);
}

.activity-gallery-header {
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--activity-rail-width);
  gap: var(--activity-column-gap);
  align-items: end;
  min-height: clamp(84px, 12vh, 110px);
}

.activity-heading {
  grid-column: 1;
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

.activity-filter-toolbar {
  min-width: 0;
  min-height: 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--activity-rail-width);
  gap: var(--activity-column-gap);
  align-items: center;
  border-top: 1px solid rgb(var(--bujo-line-rgb) / 0.28);
  border-bottom: 1px solid rgb(var(--bujo-line-rgb) / 0.28);
  padding: 7px 0;
  font-family: var(--bujo-font-meta);
}

.activity-filter-scroller {
  grid-column: 1;
  min-width: 0;
  overflow-x: auto;
  overscroll-behavior-inline: contain;
  scrollbar-width: none;
  touch-action: pan-x;
}

.activity-filter-scroller::-webkit-scrollbar {
  display: none;
}

.activity-filter-group {
  width: max-content;
  min-width: 100%;
  display: flex;
  flex-wrap: nowrap;
  justify-content: center;
  gap: 10px;
}

.activity-create-button {
  grid-column: 2;
  grid-row: 1;
  align-self: end;
  justify-self: end;
  min-height: 40px;
  margin-bottom: 3px;
  padding: 9px 16px;
  font-size: 13px;
  white-space: nowrap;
}

.activity-filter {
  --ticket-bg: transparent;
  display: inline-flex;
  min-height: 40px;
  position: relative;
  align-items: center;
  gap: 9px;
  border: 1px solid transparent;
  background: var(--ticket-bg);
  color: rgb(var(--bujo-ink-rgb) / 0.52);
  font-size: 13px;
  font-weight: 650;
  line-height: 1.08;
  cursor: pointer;
  flex: 0 0 auto;
  padding: 9px 16px;
  white-space: nowrap;
  transition:
    color 160ms ease,
    background-color 160ms ease,
    border-color 160ms ease,
    transform 160ms ease;
}

.activity-filter::after {
  position: absolute;
  right: 14px;
  bottom: 4px;
  left: 14px;
  height: 2px;
  background: currentColor;
  content: '';
  opacity: 0.56;
  transform: scaleX(0);
  transform-origin: left center;
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.activity-filter:focus-visible {
  color: rgb(var(--bujo-ink-rgb) / 0.72);
  border-color: rgb(var(--bujo-line-rgb) / 0.22);
  background: rgb(var(--bujo-white-rgb) / 0.34);
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
}

.activity-filter:focus-visible::after {
  transform: scaleX(0.55);
}

.activity-filter b {
  color: rgb(var(--bujo-ink-rgb) / 0.34);
  font-size: 14px;
  font-weight: 650;
}

.activity-filter--active {
  background: rgb(var(--bujo-white-rgb) / 0.62);
  color: rgb(var(--bujo-ink-rgb) / 0.78);
  border-color: rgb(var(--bujo-ink-rgb) / 0.34);
  box-shadow: 1px 2px 0 rgb(var(--bujo-line-rgb) / 0.1);
}

.activity-filter--active::after {
  transform: scaleX(1);
}

.activity-filter--active b {
  color: var(--bujo-accent);
}

.activity-content {
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(0, 1fr) var(--activity-rail-width);
  gap: var(--activity-column-gap);
  overflow: hidden;
}

.activity-stage {
  min-height: 0;
  padding: clamp(18px, 3vh, 34px) 0 clamp(20px, 3.8vh, 42px);
  display: grid;
  place-items: center;
  position: relative;
  overflow: hidden;
}

.activity-paper-stack {
  position: absolute;
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
  isolation: isolate;
}

.activity-stage-sheet {
  position: absolute;
  inset: 0;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.12);
  background:
    repeating-linear-gradient(
      176deg,
      transparent 0 13px,
      rgb(var(--bujo-line-rgb) / 0.065) 13px 14px
    ),
    rgb(var(--bujo-white-rgb) / 0.22);
  box-shadow: 3px 4px 8px rgb(var(--bujo-ink-rgb) / 0.025);
  pointer-events: none;
}

.activity-stage-sheet--back::before,
.activity-stage-sheet--back::after,
.activity-stage-sheet--middle::after {
  position: absolute;
  z-index: 1;
  width: 11px;
  height: 11px;
  background: currentColor;
  clip-path: polygon(
    50% 0,
    61% 35%,
    98% 35%,
    68% 57%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 57%,
    2% 35%,
    39% 35%
  );
  content: '';
}

.activity-stage-sheet--back::before {
  bottom: 64px;
  left: -38px;
  color: rgb(var(--bujo-ink-rgb) / 0.48);
  transform: rotate(-9deg);
}

.activity-stage-sheet--back::after {
  top: 8px;
  left: 56%;
  color: rgb(222 153 205 / 0.68);
  transform: rotate(8deg);
}

.activity-stage-sheet--back {
  z-index: 0;
  border-color: rgb(var(--bujo-line-rgb) / 0.22);
  background:
    repeating-linear-gradient(
      176deg,
      transparent 0 13px,
      rgb(var(--bujo-line-rgb) / 0.085) 13px 14px
    ),
    rgb(var(--bujo-white-rgb) / 0.28);
  transform: translate(18px, -24px) rotate(2.4deg);
}

.activity-stage-sheet--middle {
  z-index: 1;
  border-color: rgb(var(--bujo-line-rgb) / 0.2);
  background:
    repeating-linear-gradient(
      176deg,
      transparent 0 13px,
      rgb(var(--bujo-line-rgb) / 0.065) 13px 14px
    ),
    rgb(var(--bujo-white-rgb) / 0.34);
  box-shadow: 4px 5px 10px rgb(var(--bujo-ink-rgb) / 0.035);
  transform: translate(-4px, 24px) rotate(-1.5deg);
}

.activity-stage-sheet--middle::after {
  right: 22%;
  bottom: -6px;
  color: rgb(var(--bujo-ink-rgb) / 0.42);
  transform: rotate(11deg);
}

.activity-stage :deep(.activity-detail-panel) {
  position: relative;
  z-index: 2;
}

.activity-focus-frame {
  width: 100%;
  height: 100%;
  min-height: 0;
  display: grid;
  place-items: center;
}

.activity-stage :deep(.activity-focus-enter-active) {
  transition:
    opacity 180ms ease,
    transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.activity-stage :deep(.activity-focus-leave-active) {
  transition:
    opacity 120ms ease,
    transform 120ms cubic-bezier(0.4, 0, 1, 1);
}

.activity-stage :deep(.activity-focus-enter-from) {
  opacity: 0;
  transform: translateY(8px) rotate(0.18deg);
}

.activity-stage :deep(.activity-focus-leave-to) {
  opacity: 0;
  transform: translateY(-6px) rotate(-0.12deg);
}

.activity-card-rail {
  min-width: 0;
  min-height: 0;
  padding: clamp(18px, 3vh, 34px) 0 clamp(20px, 3.8vh, 42px) clamp(14px, 1.4vw, 20px);
  border-left: 1px solid rgb(var(--bujo-line-rgb) / 0.3);
  overflow: hidden;
  position: relative;
  z-index: 2;
}

.activity-strip {
  height: 100%;
  display: grid;
  grid-auto-rows: 104px;
  align-content: start;
  gap: 12px;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior-y: contain;
  padding: 6px 10px 14px 6px;
  margin: 0;
  list-style: none;
  scroll-snap-type: y proximity;
  scrollbar-gutter: stable;
  scrollbar-color: rgb(var(--bujo-ink-rgb) / 0.28) transparent;
  scrollbar-width: thin;
  touch-action: pan-y;
}

.activity-strip::-webkit-scrollbar {
  width: 5px;
}

.activity-strip::-webkit-scrollbar-thumb {
  background: rgb(var(--bujo-ink-rgb) / 0.28);
}

.activity-strip::-webkit-scrollbar-track {
  background: transparent;
}

.activity-mini-card {
  --mini-card-hover-bg: var(--activity-white-card);
  position: relative;
  width: 100%;
  min-height: 104px;
  scroll-snap-align: center;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.18);
  border-radius: 1px;
  padding: 15px 16px 14px;
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

.activity-mini-card::before {
  position: absolute;
  top: 15px;
  left: 0;
  width: 2px;
  height: 22px;
  background: color-mix(in srgb, var(--mini-card-hover-bg) 64%, var(--bujo-ink));
  content: '';
  transform: scaleY(0);
  transform-origin: center top;
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.activity-mini-avatar {
  display: inline-flex;
  flex: 0 0 22px;
  width: 22px;
  height: 22px;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  border: 0;
  border-radius: 999px;
  background: transparent;
  box-shadow: 0 0 0 2px color-mix(in srgb, var(--mini-card-hover-bg) 62%, var(--bujo-ink));
  color: rgb(var(--bujo-ink-rgb) / 0.72);
  font-size: 8px;
  font-weight: 700;
  line-height: 1;
}

.activity-mini-avatar--initial {
  background: color-mix(in srgb, var(--mini-card-hover-bg) 70%, var(--bujo-white));
}

.activity-mini-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-mini-title-row {
  display: flex;
  min-width: 0;
  align-items: center;
  gap: 8px;
}

.activity-mini-card--active {
  background: var(--mini-card-hover-bg);
  filter: saturate(1.02);
  box-shadow: 7px 9px 12px rgb(var(--bujo-ink-rgb) / 0.12);
}

.activity-mini-card--active::before {
  transform: scaleY(1);
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
  min-width: 0;
  color: var(--activity-ink);
  font-size: 16px;
  line-height: 1.12;
  font-weight: 700;
  max-height: 2.24em;
  contain: paint;
  overflow: hidden;
  overflow-wrap: anywhere;
  transform: translateY(1px);
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

.activity-state-message {
  margin: auto;
  width: min(420px, calc(100vw - 48px));
  border-radius: 1px;
  background: var(--activity-surface);
  padding: 48px;
  text-align: center;
  font-weight: 700;
}

.activity-content--empty {
  min-height: 390px;
}

.activity-stage--empty {
  overflow: visible;
}

.activity-empty {
  position: relative;
  z-index: 2;
  width: 100%;
  min-height: 280px;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.2);
  background:
    linear-gradient(180deg, rgb(var(--bujo-white-rgb) / 0.28), transparent 46px),
    rgb(var(--bujo-white-rgb) / 0.84);
  box-shadow: 8px 10px 18px rgb(var(--bujo-ink-rgb) / 0.07);
  padding: clamp(38px, 5vw, 56px);
  display: grid;
  align-content: center;
  text-align: center;
}

.activity-empty-kicker,
.activity-rail-empty-kicker {
  margin: 0;
  color: rgb(var(--bujo-ink-rgb) / 0.48);
  font-family: var(--bujo-font-meta);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.activity-empty-kicker::after {
  width: 42px;
  height: 1px;
  margin: 14px auto 18px;
  display: block;
  background: rgb(var(--bujo-line-rgb) / 0.48);
  content: '';
}

.activity-empty h2,
.activity-rail-empty h2 {
  margin: 0;
  color: var(--activity-ink);
  font-family: var(--bujo-font-heading);
  font-weight: 750;
}

.activity-empty h2 {
  font-size: clamp(23px, 2.2vw, 30px);
  line-height: 1.18;
}

.activity-empty-copy {
  max-width: 260px;
  margin: 14px auto 0;
  color: rgb(var(--bujo-ink-rgb) / 0.58);
  font-size: 13px;
  font-weight: 550;
  line-height: 1.7;
}

.activity-card-rail--empty {
  display: grid;
  align-items: start;
}

.activity-rail-empty {
  margin: 12px 10px 0 6px;
  border-top: 2px solid rgb(var(--bujo-ink-rgb) / 0.52);
  border-bottom: 1px solid rgb(var(--bujo-line-rgb) / 0.25);
  padding: 18px 2px 20px;
}

.activity-rail-empty-kicker {
  margin-bottom: 12px;
}

.activity-rail-empty h2 {
  max-width: 11em;
  font-size: 16px;
  line-height: 1.35;
}

.activity-rail-empty > p:last-child {
  max-width: 15em;
  margin: 10px 0 0;
  color: rgb(var(--bujo-ink-rgb) / 0.5);
  font-size: 11px;
  font-weight: 550;
  line-height: 1.65;
}

.activity-state-message--error {
  color: var(--bujo-danger);
}

@media (hover: hover) and (pointer: fine) {
  .activity-filter:not(.activity-filter--active):hover {
    color: rgb(var(--bujo-ink-rgb) / 0.72);
    border-color: rgb(var(--bujo-line-rgb) / 0.22);
    background: rgb(var(--bujo-white-rgb) / 0.34);
    transform: translateY(-1px);
  }

  .activity-filter:not(.activity-filter--active):hover::after {
    transform: scaleX(0.55);
  }

  .activity-mini-card:hover {
    background: var(--mini-card-hover-bg);
    filter: saturate(1.02);
    box-shadow: 7px 9px 12px rgb(var(--bujo-ink-rgb) / 0.12);
    transform: translateX(-4px);
  }
}

@media (min-width: 901px) {
  .activity-paper-stack {
    position: relative;
    width: min(420px, calc(100% - 40px));
    height: min(520px, calc(100% - 40px));
    min-height: 0;
    max-height: calc(100% - 40px);
    place-items: stretch;
  }

  .activity-stage :deep(.activity-detail-panel) {
    width: 100%;
    height: 100%;
    min-height: 0;
    max-height: 100%;
  }

  .activity-paper-stack--empty {
    width: min(390px, calc(100% - 64px));
    height: auto;
    min-height: min(300px, calc(100% - 72px));
    max-height: calc(100% - 72px);
  }
}

@media (max-width: 900px) {
  .activity-gallery-header {
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 12px;
    min-height: 76px;
  }

  .activity-heading {
    grid-column: 1;
    grid-row: 1;
    text-align: left;
  }

  .activity-heading h1 {
    white-space: normal;
    font-size: clamp(40px, 6vw, 64px);
    line-height: 0.95;
  }

  .activity-caption {
    margin-bottom: 12px;
  }

  .activity-filter-toolbar {
    display: flex;
    gap: 0;
  }

  .activity-filter-scroller {
    min-width: 0;
  }

  .activity-filter-group {
    justify-content: flex-start;
  }

  .activity-create-button {
    grid-column: 2;
    grid-row: 1;
    align-self: end;
    justify-self: end;
    margin-bottom: 2px;
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

  .activity-focus-frame {
    position: relative;
  }

  .activity-paper-stack {
    position: relative;
    inset: auto;
    width: min(100%, calc(100vw - 92px));
    height: min(45dvh, 430px, 100%);
    min-height: min(250px, 45dvh, 100%);
    place-items: stretch;
  }

  .activity-stage-sheet--back {
    transform: translate(9px, -12px) rotate(1.2deg);
  }

  .activity-stage-sheet--middle {
    transform: translate(-3px, 12px) rotate(-0.8deg);
  }

  .activity-stage-sheet--back::before,
  .activity-stage-sheet--back::after,
  .activity-stage-sheet--middle::after {
    width: 8px;
    height: 8px;
  }

  .activity-stage-sheet--back::before {
    right: -4px;
    bottom: 28%;
    left: auto;
  }

  .activity-stage-sheet--back::after {
    top: -4px;
    left: 58%;
  }

  .activity-stage-sheet--middle::after {
    right: 18%;
    bottom: -4px;
  }

  .activity-stage :deep(.activity-detail-panel) {
    width: 100%;
    height: 100%;
    max-width: none;
    min-height: 0;
    max-height: 100%;
  }

  .activity-paper-stack--empty {
    position: relative;
    width: min(390px, calc(100% - 32px));
    height: auto;
    min-height: 250px;
    place-items: stretch;
  }

  .activity-empty {
    min-height: 250px;
  }
}

@media (max-width: 768px) {
  .activity-stage-sheet--back {
    transform: translate(5px, -7px) rotate(0.7deg);
  }

  .activity-stage-sheet--middle {
    transform: translate(-3px, 8px) rotate(-0.5deg);
  }

  .activity-stage-sheet--back::before,
  .activity-stage-sheet--back::after,
  .activity-stage-sheet--middle::after {
    width: 7px;
    height: 7px;
  }

  .activity-stage-sheet--back::before {
    right: -3px;
    bottom: 26%;
  }

  .activity-stage-sheet--back::after {
    top: -3px;
  }

  .activity-stage-sheet--middle::after {
    right: 16%;
    bottom: -3px;
  }

  .activity-content--empty {
    grid-template-columns: minmax(0, 1fr);
  }

  .activity-card-rail--empty {
    display: none;
  }
}

@media (max-width: 767px) {
  .activity-gallery-page {
    min-height: 100%;
    height: 100dvh;
    padding: 18px 16px calc(74px + env(safe-area-inset-bottom));
    grid-template-rows: auto auto minmax(0, 1fr);
    overflow: hidden;
  }

  .activity-content {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(0, 1fr) auto;
    gap: 0;
    overflow: visible;
  }

  .activity-card-rail {
    position: relative;
    z-index: 1;
    min-height: 108px;
    margin-top: clamp(42px, 8vh, 68px);
    padding: 0;
    border-left: 0;
  }

  .activity-content--empty {
    grid-template-rows: minmax(0, 1fr);
  }

  .activity-strip {
    height: auto;
    display: flex;
    gap: clamp(18px, 4vw, 24px);
    overflow-x: auto;
    overflow-y: hidden;
    overscroll-behavior-x: contain;
    padding: 8px 0;
    scroll-snap-type: x proximity;
    scrollbar-width: none;
    touch-action: pan-x;
  }

  .activity-strip::-webkit-scrollbar {
    display: none;
  }

  .activity-mini-card {
    flex: 0 0 144px;
    width: 144px;
    height: 101px;
  }
}

@media (max-width: 767px) and (max-height: 700px) {
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

@media (prefers-reduced-motion: reduce) {
  .activity-filter,
  .activity-filter::after,
  .activity-mini-card,
  .activity-mini-card::before,
  .activity-stage :deep(.activity-focus-enter-active),
  .activity-stage :deep(.activity-focus-leave-active) {
    transition: none;
  }

  .activity-filter:hover,
  .activity-mini-card:hover,
  .activity-stage :deep(.activity-focus-enter-from),
  .activity-stage :deep(.activity-focus-leave-to) {
    opacity: 1;
    transform: none;
  }
}
</style>
