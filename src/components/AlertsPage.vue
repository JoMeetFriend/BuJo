<template>
  <div class="min-h-screen bg-[var(--bujo-page)] pb-24 text-[var(--bujo-ink)]">
    <header class="alerts-header sticky top-0 z-10 bg-[var(--bujo-page)] px-5 pt-8 pb-4 md:px-14">
      <p class="alerts-eyebrow">SOCIAL INBOX</p>
      <div class="alerts-title-line">
        <h1>ALERTS</h1>
        <span class="alerts-cn-tag">通知</span>
      </div>
    </header>

    <main class="px-5 pt-2 md:px-14 md:py-4">
      <div class="mb-4 flex items-center justify-between gap-3">
        <p v-if="isLoading" class="alerts-status-text">通知讀取中...</p>
        <p v-else-if="error" class="alerts-status-text alerts-status-text--error">{{ error }}</p>
        <p v-else class="alerts-status-text">{{ summaryText }}</p>

        <PixelButton type="button" :disabled="!hasUnread || isLoading" @click="markAllAsRead">
          全部已讀
        </PixelButton>
      </div>

      <div v-if="!isLoading && notifications.length === 0" class="alerts-empty">目前沒有通知</div>

      <ul v-else class="flex flex-col gap-3">
        <li
          v-for="(notification, index) in notifications"
          :key="notification.id"
          class="alerts-swipe-shell"
          :class="{
            'alerts-swipe-shell--dismissing': swipeState(notification.id)?.collapsing,
            'alerts-swipe-shell--entering': initialEntryNotificationIds.has(notification.id),
          }"
          :style="notificationEntryStyle(notification.id, index)"
          :data-notification-id="notification.id"
        >
          <div
            class="alerts-dismiss-affordance"
            :style="dismissAffordanceStyle(notification.id)"
            role="img"
            aria-label="移除通知"
          >
            <div class="alerts-dismiss-icon-wrap">
              <svg
                class="alerts-dismiss-progress-ring"
                viewBox="0 0 48 48"
                aria-hidden="true"
                focusable="false"
              >
                <circle
                  cx="24"
                  cy="24"
                  r="20"
                  pathLength="100"
                  :style="dismissRingStyle(notification.id)"
                />
              </svg>
              <TrashIcon class="alerts-dismiss-icon" aria-hidden="true" />
            </div>
          </div>

          <div class="flex min-w-0 flex-1 flex-col gap-2">
            <div
              class="alerts-item"
              :class="{
                'alerts-item--unread': !notification.isRead,
                'alerts-item--dragging': swipeState(notification.id)?.dragging,
                'alerts-item--dismissing': swipeState(notification.id)?.dismissing,
              }"
              :style="notificationSwipeStyle(notification.id)"
              role="button"
              tabindex="0"
              @click="handleNotificationClick(notification, 'pointer')"
              @keydown.enter.prevent="handleNotificationClick(notification, 'keyboard')"
              @keydown.space.prevent="handleNotificationClick(notification, 'keyboard')"
              @pointerdown="startSwipe(notification, $event)"
              @pointermove="moveSwipe(notification, $event)"
              @pointerup="finishSwipe(notification, $event)"
              @pointercancel="cancelSwipe(notification, $event)"
            >
              <div
                class="notification-icon mt-1"
                :class="[
                  `notification-icon--${notification.category}`,
                  { 'notification-icon--read': notification.isRead },
                ]"
                aria-hidden="true"
              ></div>

              <div class="flex min-w-0 flex-1 flex-col gap-2">
                <div class="flex min-w-0 flex-col gap-[2px]">
                  <p class="alerts-message line-clamp-2">
                    {{ notification.message }}
                  </p>
                  <p class="alerts-time truncate">
                    {{ notification.timeText }}
                  </p>
                </div>

                <div
                  v-if="notification.actions?.length"
                  class="flex flex-wrap gap-2"
                  @click.stop
                  @keydown.stop
                  @pointerdown.stop
                >
                  <button
                    v-if="notification.actions.includes('accept')"
                    type="button"
                    class="alerts-inline-btn alerts-inline-btn--accept"
                    :disabled="isActionBusy(notification.id)"
                    @click="handleFriendshipAction(notification, 'accept')"
                  >
                    接受
                  </button>
                  <button
                    v-if="notification.actions.includes('reject')"
                    type="button"
                    class="alerts-inline-btn alerts-inline-btn--reject"
                    :disabled="isActionBusy(notification.id)"
                    @click="handleFriendshipAction(notification, 'reject')"
                  >
                    拒絕
                  </button>
                </div>
              </div>

              <span
                v-if="!notification.isRead"
                class="alerts-unread-indicator"
                aria-hidden="true"
              ></span>
            </div>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
import axios from 'axios'
import { TrashIcon } from '@heroicons/vue/24/outline'
import { computed, onMounted, reactive, ref } from 'vue'
import { useRouter } from 'vue-router'
import PixelButton from './ui/PixelButton.vue'
import { useNotificationStore } from '@/stores/notificationStore'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  withCredentials: true,
})

const notificationStore = useNotificationStore()
const router = useRouter()

const notifications = ref([])
const isLoading = ref(false)
const error = ref(null)
const busyNotificationIds = ref(new Set())
const initialEntryNotificationIds = ref(new Set())
const hasLoadedInitialNotifications = ref(false)
const swipeStates = reactive({})
const activeSwipeId = ref(null)

const SWIPE_LOCK_DISTANCE = 10
const SWIPE_AXIS_RATIO = 1.25
const SWIPE_DISMISS_RATIO = 0.65
const SWIPE_ANIMATION_MS = 220
const ENTRY_STAGGER_MS = 60
const ENTRY_STAGGER_MAX_INDEX = 7

const hasUnread = computed(() => notifications.value.some((notification) => !notification.isRead))
const summaryText = computed(() => {
  if (notifications.value.length === 0) return '0 則通知'
  const unreadCount = notifications.value.filter((notification) => !notification.isRead).length
  return unreadCount > 0 ? `${unreadCount} 則未讀` : '已全部讀取'
})

onMounted(() => {
  fetchNotifications()
})

async function fetchNotifications() {
  isLoading.value = true
  error.value = null

  try {
    const response = await apiClient.get('/api/notifications')
    const nextNotifications = Array.isArray(response.data?.notifications)
      ? response.data.notifications.map(normalizeNotification)
      : []
    notifications.value = nextNotifications

    if (hasLoadedInitialNotifications.value) {
      initialEntryNotificationIds.value = new Set()
    } else {
      initialEntryNotificationIds.value = new Set(
        nextNotifications.map((notification) => notification.id),
      )
      hasLoadedInitialNotifications.value = true
    }
  } catch (err) {
    console.error('取得通知失敗:', err)
    error.value = err.response?.data?.message || '無法取得通知'
    notifications.value = []
  } finally {
    isLoading.value = false
    notificationStore.setUnreadCount(
      notifications.value.filter((notification) => !notification.isRead).length,
    )
  }
}

async function markAsRead(notification) {
  if (!notification || notification.isRead) return

  try {
    await apiClient.patch(`/api/notifications/${notification.id}/read`)
    notification.isRead = true
    notificationStore.setUnreadCount(notificationStore.unreadCount - 1)
  } catch (err) {
    console.error('標記通知已讀失敗:', err)
    error.value = err.response?.data?.message || '無法標記已讀'
  }
}

async function handleNotificationClick(notification, activationSource) {
  const state = swipeState(notification.id)
  if (state?.dismissing) return
  if (activationSource === 'pointer' && state?.suppressNextPointerClick) {
    state.suppressNextPointerClick = false
    return
  }
  // markAsRead 自行吞錯（只設 error.value），失敗不阻擋導頁
  await markAsRead(notification)
  const reference = notification.reference
  if (reference?.type === 'activity' && reference.id != null) {
    router.push({ path: '/activity', query: { focus: String(reference.id) } })
  }
}

function canDismiss(notification) {
  if (!notification || isActionBusy(notification.id)) return false
  return !notification.actions?.some((action) => action === 'accept' || action === 'reject')
}

function swipeState(notificationId) {
  return swipeStates[notificationId]
}

function createSwipeState() {
  return {
    pointerId: null,
    startX: 0,
    startY: 0,
    width: 0,
    offset: 0,
    axis: 'pending',
    dragging: false,
    dismissing: false,
    collapsing: false,
    suppressNextPointerClick: false,
  }
}

function ensureSwipeState(notificationId) {
  swipeStates[notificationId] ||= createSwipeState()
  return swipeStates[notificationId]
}

function startSwipe(notification, event) {
  if (event.button !== 0 || (activeSwipeId.value && activeSwipeId.value !== notification.id)) {
    return
  }

  const state = ensureSwipeState(notification.id)
  state.suppressNextPointerClick = false
  if (!canDismiss(notification) || state.dismissing) return

  state.pointerId = event.pointerId
  state.startX = event.clientX
  state.startY = event.clientY
  state.width = event.currentTarget.clientWidth
  state.offset = 0
  state.axis = 'pending'
  state.dragging = false
  activeSwipeId.value = notification.id
  event.currentTarget.setPointerCapture?.(event.pointerId)
}

function moveSwipe(notification, event) {
  const state = swipeState(notification.id)
  if (!state || state.pointerId !== event.pointerId || state.dismissing) return

  const deltaX = event.clientX - state.startX
  const deltaY = event.clientY - state.startY
  const absoluteX = Math.abs(deltaX)
  const absoluteY = Math.abs(deltaY)

  if (state.axis === 'pending') {
    if (Math.max(absoluteX, absoluteY) < SWIPE_LOCK_DISTANCE) return

    if (absoluteX >= absoluteY * SWIPE_AXIS_RATIO) {
      state.axis = 'horizontal'
      state.dragging = true
      state.suppressNextPointerClick = true
    } else {
      state.axis = 'vertical'
      state.offset = 0
      return
    }
  }

  if (state.axis !== 'horizontal') return

  event.preventDefault()
  state.offset = Math.max(-state.width, Math.min(0, deltaX))
}

function finishSwipe(notification, event) {
  const state = swipeState(notification.id)
  if (!state || state.pointerId !== event.pointerId || state.dismissing) return

  event.currentTarget.releasePointerCapture?.(event.pointerId)
  state.pointerId = null
  activeSwipeId.value = null

  if (state.axis === 'horizontal' && Math.abs(state.offset) >= state.width * SWIPE_DISMISS_RATIO) {
    void dismissNotification(notification, state)
    return
  }

  resetSwipeState(state)
}

function cancelSwipe(notification, event) {
  const state = swipeState(notification.id)
  if (!state || state.pointerId !== event.pointerId || state.dismissing) return

  event.currentTarget.releasePointerCapture?.(event.pointerId)
  activeSwipeId.value = null
  resetSwipeState(state)
}

function resetSwipeState(state) {
  state.pointerId = null
  state.offset = 0
  state.axis = 'pending'
  state.dragging = false
  state.dismissing = false
  state.collapsing = false
}

function notificationSwipeStyle(notificationId) {
  const state = swipeState(notificationId)
  return { transform: `translateX(${state?.offset || 0}px)` }
}

function notificationEntryStyle(notificationId, index) {
  if (!initialEntryNotificationIds.value.has(notificationId)) return undefined

  return {
    '--alerts-enter-delay': `${Math.min(index, ENTRY_STAGGER_MAX_INDEX) * ENTRY_STAGGER_MS}ms`,
  }
}

function dismissAffordanceStyle(notificationId) {
  const progress = dismissProgress(notificationId)
  return { '--dismiss-progress': progress }
}

function dismissRingStyle(notificationId) {
  return { strokeDashoffset: 100 * (1 - dismissProgress(notificationId)) }
}

function dismissProgress(notificationId) {
  const state = swipeState(notificationId)
  const dismissDistance = (state?.width || 0) * SWIPE_DISMISS_RATIO
  return dismissDistance > 0 ? Math.min(1, Math.abs(state?.offset || 0) / dismissDistance) : 0
}

async function dismissNotification(notification, state) {
  state.dragging = false
  state.dismissing = true
  state.collapsing = true
  state.offset = -state.width
  error.value = null

  try {
    await Promise.all([
      apiClient.patch(`/api/notifications/${notification.id}/dismiss`),
      waitForSwipeAnimation(),
    ])
    notifications.value = notifications.value.filter((item) => item.id !== notification.id)
    if (!notification.isRead) {
      notificationStore.setUnreadCount(Math.max(0, notificationStore.unreadCount - 1))
    }
    delete swipeStates[notification.id]
  } catch (err) {
    console.error('移除通知失敗:', err)
    resetSwipeState(state)
    error.value = '無法移除通知'
  }
}

function waitForSwipeAnimation() {
  return new Promise((resolve) => window.setTimeout(resolve, SWIPE_ANIMATION_MS))
}

async function markAllAsRead() {
  if (!hasUnread.value) return

  try {
    await apiClient.patch('/api/notifications/read-all')
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      isRead: true,
    }))
    notificationStore.setUnreadCount(0)
  } catch (err) {
    console.error('全部已讀失敗:', err)
    error.value = err.response?.data?.message || '無法全部已讀'
  }
}

async function handleFriendshipAction(notification, action) {
  const friendshipId = notification.reference?.id
  if (!friendshipId || !['accept', 'reject'].includes(action)) return

  setActionBusy(notification.id, true)
  error.value = null

  try {
    await apiClient.post(`/api/friendships/${friendshipId}/${action}`)
    await apiClient.patch(`/api/notifications/${notification.id}/read`)
    await fetchNotifications()
  } catch (err) {
    console.error('處理好友邀請失敗:', err)
    error.value = err.response?.data?.message || '無法處理好友邀請'
  } finally {
    setActionBusy(notification.id, false)
  }
}

function normalizeNotification(notification) {
  return {
    id: String(notification.id),
    type: String(notification.type || ''),
    category: notification.category || 'general',
    message: notification.message || '你有一則新通知',
    timeText: notification.timeText || '',
    isRead: Boolean(notification.isRead),
    createdAt: notification.createdAt || null,
    reference: notification.reference || null,
    actions: Array.isArray(notification.actions) ? notification.actions : [],
  }
}

function isActionBusy(notificationId) {
  return busyNotificationIds.value.has(notificationId)
}

function setActionBusy(notificationId, isBusy) {
  const next = new Set(busyNotificationIds.value)
  if (isBusy) {
    next.add(notificationId)
  } else {
    next.delete(notificationId)
  }
  busyNotificationIds.value = next
}
</script>

<style scoped>
.alerts-eyebrow {
  margin: 0 0 2px;
  color: var(--bujo-muted-strong);
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.alerts-title-line {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.alerts-title-line h1 {
  margin: 0;
  color: var(--bujo-ink);
  font-family: var(--bujo-font-heading);
  font-size: clamp(40px, 6vw, 64px);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: 0;
}

.alerts-cn-tag {
  color: var(--bujo-muted);
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.04em;
}

.alerts-status-text {
  font-family: 'Space Mono', monospace;
  font-size: 12px;
  color: var(--bujo-muted-strong);
}

.alerts-status-text--error {
  color: #dc2626;
}

.alerts-empty {
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  padding: 20px;
  font-size: 14px;
  color: var(--bujo-muted-strong);
}

.alerts-item {
  display: flex;
  cursor: pointer;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--bujo-line);
  border-radius: 0;
  background: var(--bujo-surface);
  padding: 12px;
  transition:
    border-color 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.alerts-item:has(.alerts-inline-btn) {
  min-height: 68px;
}

.alerts-swipe-shell {
  position: relative;
  max-height: 320px;
  overflow: hidden;
  transition: max-height 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.alerts-swipe-shell--dismissing {
  max-height: 0;
}

.alerts-swipe-shell--entering {
  animation: alerts-notification-enter 400ms cubic-bezier(0.2, 0.8, 0.2, 1) both;
  animation-delay: var(--alerts-enter-delay, 0ms);
}

@keyframes alerts-notification-enter {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.alerts-dismiss-affordance {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: flex-end;
  background: rgb(239 68 68 / var(--dismiss-progress, 0));
  color: white;
  padding-right: 24px;
  pointer-events: none;
}

.alerts-dismiss-icon-wrap {
  position: relative;
  display: grid;
  width: 48px;
  height: 48px;
  place-items: center;
}

.alerts-dismiss-progress-ring {
  position: absolute;
  inset: 0;
  width: 48px;
  height: 48px;
  transform: rotate(-90deg);
}

.alerts-dismiss-progress-ring circle {
  fill: none;
  stroke: currentColor;
  stroke-width: 3;
  stroke-dasharray: 100;
  stroke-linecap: round;
}

.alerts-dismiss-icon {
  position: relative;
  width: 23px;
  height: 23px;
  opacity: var(--dismiss-progress, 0);
}

.alerts-item {
  position: relative;
  z-index: 1;
  width: 100%;
  touch-action: pan-y;
}

.alerts-item--dragging {
  transition: none;
}

.alerts-item--dismissing {
  pointer-events: none;
}

.alerts-item:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-surface-muted);
}

.alerts-item--unread {
  border-color: color-mix(in srgb, var(--bujo-accent) 70%, var(--bujo-line));
  border-left: 3px solid var(--bujo-accent);
  background: color-mix(in srgb, var(--bujo-accent) 18%, var(--bujo-surface));
  padding-left: 10px;
}

.alerts-item--unread:hover {
  border-color: var(--bujo-accent);
  background: color-mix(in srgb, var(--bujo-accent) 24%, var(--bujo-surface));
}

.alerts-message {
  margin: 0;
  color: var(--bujo-muted-strong);
  font-family: var(--bujo-font-body);
  font-size: 14px;
  font-weight: 500;
  line-height: 1.4;
  transition:
    color 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
    font-weight 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.alerts-item--unread .alerts-message {
  color: var(--bujo-ink);
  font-weight: 700;
}

.alerts-time {
  margin: 0;
  color: var(--bujo-muted-strong);
  font-family: 'Space Mono', monospace;
  font-size: 11px;
}

.alerts-inline-btn {
  border: 1px solid var(--bujo-ink);
  background: transparent;
  padding: 5px 12px;
  font-family: var(--bujo-font-body);
  font-size: 11px;
  font-weight: 700;
  color: var(--bujo-ink);
  cursor: pointer;
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.alerts-inline-btn--accept:hover:not(:disabled) {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.alerts-inline-btn--reject {
  border-color: var(--bujo-line);
  color: var(--bujo-muted-strong);
}

.alerts-inline-btn--reject:hover:not(:disabled) {
  border-color: var(--bujo-ink);
  color: var(--bujo-ink);
}

.alerts-inline-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.notification-icon {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface-muted);
  color: var(--bujo-ink);
  transition:
    border-color 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 450ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 450ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.notification-icon::before {
  position: absolute;
  inset: 6px;
  content: '';
}

.notification-icon--activity::before {
  background:
    linear-gradient(currentColor 0 0) 5px 2px / 4px 26px no-repeat,
    linear-gradient(currentColor 0 0) 9px 2px / 16px 4px no-repeat,
    linear-gradient(currentColor 0 0) 9px 6px / 12px 4px no-repeat,
    linear-gradient(currentColor 0 0) 9px 10px / 16px 4px no-repeat;
}

.notification-icon--friend::before {
  background:
    linear-gradient(currentColor 0 0) 4px 3px / 7px 7px no-repeat,
    linear-gradient(currentColor 0 0) 17px 3px / 7px 7px no-repeat,
    linear-gradient(currentColor 0 0) 2px 13px / 11px 13px no-repeat,
    linear-gradient(currentColor 0 0) 15px 13px / 11px 13px no-repeat;
}

.notification-icon--read {
  color: var(--bujo-muted);
  background: var(--bujo-surface);
  border-color: var(--bujo-line-soft);
}

.alerts-item--unread .notification-icon {
  border-color: var(--bujo-accent);
  background: color-mix(in srgb, var(--bujo-accent) 24%, var(--bujo-surface));
  color: color-mix(in srgb, var(--bujo-accent), var(--bujo-ink) 45%);
}

.alerts-unread-indicator {
  width: 9px;
  height: 9px;
  flex: none;
  align-self: center;
  margin-right: 8px;
  border-radius: 0;
  background: var(--bujo-accent);
  animation: alerts-unread-pulse 2.4s ease-in-out infinite;
}

@keyframes alerts-unread-pulse {
  0%,
  100% {
    opacity: 1;
  }

  50% {
    opacity: 0.45;
  }
}

@media (prefers-reduced-motion: reduce) {
  .alerts-swipe-shell--entering {
    animation: none;
  }

  .alerts-swipe-shell,
  .alerts-item {
    transition-duration: 1ms;
  }

  .alerts-unread-indicator {
    animation: none;
  }
}
</style>
