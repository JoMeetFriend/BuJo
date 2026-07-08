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
      <div class="mb-4 flex max-w-3xl items-center justify-between gap-3">
        <p v-if="isLoading" class="alerts-status-text">通知讀取中...</p>
        <p v-else-if="error" class="alerts-status-text alerts-status-text--error">{{ error }}</p>
        <p v-else class="alerts-status-text">{{ summaryText }}</p>

        <PixelButton type="button" :disabled="!hasUnread || isLoading" @click="markAllAsRead">
          全部已讀
        </PixelButton>
      </div>

      <div v-if="!isLoading && notifications.length === 0" class="alerts-empty max-w-3xl">
        目前沒有通知
      </div>

      <ul v-else class="flex max-w-3xl flex-col gap-3">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="alerts-item"
          :class="{ 'alerts-item--unread': !notification.isRead }"
          role="button"
          tabindex="0"
          @click="markAsRead(notification)"
          @keydown.enter.prevent="markAsRead(notification)"
          @keydown.space.prevent="markAsRead(notification)"
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
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
import axios from 'axios'
import { computed, onMounted, ref } from 'vue'
import PixelButton from './ui/PixelButton.vue'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  withCredentials: true,
})

const notifications = ref([])
const isLoading = ref(false)
const error = ref(null)
const busyNotificationIds = ref(new Set())

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
    notifications.value = Array.isArray(response.data?.notifications)
      ? response.data.notifications.map(normalizeNotification)
      : []
  } catch (err) {
    console.error('取得通知失敗:', err)
    error.value = err.response?.data?.message || '無法取得通知'
    notifications.value = []
  } finally {
    isLoading.value = false
  }
}

async function markAsRead(notification) {
  if (!notification || notification.isRead) return

  try {
    await apiClient.patch(`/api/notifications/${notification.id}/read`)
    notification.isRead = true
  } catch (err) {
    console.error('標記通知已讀失敗:', err)
    error.value = err.response?.data?.message || '無法標記已讀'
  }
}

async function markAllAsRead() {
  if (!hasUnread.value) return

  try {
    await apiClient.patch('/api/notifications/read-all')
    notifications.value = notifications.value.map((notification) => ({
      ...notification,
      isRead: true,
    }))
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
  min-height: 68px;
  cursor: pointer;
  align-items: flex-start;
  gap: 12px;
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  padding: 12px;
  transition:
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.alerts-item:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-surface-muted);
}

.alerts-item--unread {
  border-left: 3px solid var(--bujo-accent);
  padding-left: 10px;
}

.alerts-message {
  margin: 0;
  color: var(--bujo-ink);
  font-family: var(--bujo-font-body);
  font-size: 14px;
  font-weight: 600;
  line-height: 1.4;
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
</style>
