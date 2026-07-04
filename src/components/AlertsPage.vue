<template>
  <div class="min-h-screen bg-[#FEF7E8] pb-24 text-[#4A5040]">
    <header
      class="sticky top-0 z-10 flex items-baseline gap-4 bg-[#FEF7E8] px-5 pt-8 pb-4 md:px-14"
    >
      <h1 class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl">通知</h1>
      <span class="font-['Press_Start_2P'] text-[#9DBD86] text-base tracking-widest"> ALERTS </span>
    </header>

    <main class="px-5 pt-2 md:px-14 md:py-4">
      <div class="mb-3 flex max-w-3xl items-center justify-between gap-3">
        <p v-if="isLoading" class="font-[cubic11] text-xs text-[#9DBD86]">通知讀取中...</p>
        <p v-else-if="error" class="font-[cubic11] text-xs text-[#B35C44]">{{ error }}</p>
        <p v-else class="font-[cubic11] text-xs text-[#9DBD86]">{{ summaryText }}</p>

        <button
          type="button"
          class="w-fit border-2 border-[#4A5040] bg-[#87C06D] px-2.5 py-1.5 font-[cubic11] text-[11px] font-black leading-none text-white shadow-[2px_2px_0px_#4A5040] transition-colors hover:bg-[#69AD76] disabled:cursor-not-allowed disabled:border-[#9DBD86] disabled:bg-[#DCE8D2] disabled:text-[#9DBD86] disabled:shadow-none"
          :disabled="!hasUnread || isLoading"
          @click="markAllAsRead"
        >
          全部已讀
        </button>
      </div>

      <div
        v-if="!isLoading && notifications.length === 0"
        class="max-w-3xl border-2 border-[#9DBD86] bg-white p-5 font-[cubic11] text-sm text-[#9DBD86]"
      >
        目前沒有通知
      </div>

      <ul v-else class="flex max-w-3xl flex-col gap-3">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="flex min-h-[68px] cursor-pointer items-start gap-3 border-[2px] bg-white p-3 transition-colors hover:bg-[#FBFFF7]"
          :class="
            notification.isRead ? 'border-[#9DBD86]' : 'border-[#87C06D] border-l-[8px] pl-[6px]'
          "
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
              <p
                class="line-clamp-2 font-[cubic11] text-sm font-semibold leading-snug text-[#4A5040]"
              >
                {{ notification.message }}
              </p>
              <p class="truncate font-[cubic11] text-xs text-[#9DBD86]">
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
                class="border-2 border-[#4A5040] bg-[#87C06D] px-2.5 py-1 font-[cubic11] text-[11px] font-black text-white shadow-[2px_2px_0px_#4A5040] disabled:cursor-not-allowed disabled:bg-[#DCE8D2] disabled:text-[#9DBD86] disabled:shadow-none"
                :disabled="isActionBusy(notification.id)"
                @click="handleFriendshipAction(notification, 'accept')"
              >
                接受
              </button>
              <button
                v-if="notification.actions.includes('reject')"
                type="button"
                class="border-2 border-[#4A5040] bg-white px-2.5 py-1 font-[cubic11] text-[11px] font-black text-[#4A5040] shadow-[2px_2px_0px_#4A5040] disabled:cursor-not-allowed disabled:border-[#9DBD86] disabled:text-[#9DBD86] disabled:shadow-none"
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
.notification-icon {
  position: relative;
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border: 2px solid #4a5040;
  background: #def4cd;
}

.notification-icon::before {
  position: absolute;
  inset: 6px;
  content: '';
}

.notification-icon--activity {
  color: #f2a65a;
}

.notification-icon--activity::before {
  background:
    linear-gradient(currentColor 0 0) 5px 2px / 4px 26px no-repeat,
    linear-gradient(currentColor 0 0) 9px 2px / 16px 4px no-repeat,
    linear-gradient(currentColor 0 0) 9px 6px / 12px 4px no-repeat,
    linear-gradient(currentColor 0 0) 9px 10px / 16px 4px no-repeat;
}

.notification-icon--friend {
  color: #87c06d;
}

.notification-icon--friend::before {
  background:
    linear-gradient(currentColor 0 0) 4px 3px / 7px 7px no-repeat,
    linear-gradient(currentColor 0 0) 17px 3px / 7px 7px no-repeat,
    linear-gradient(currentColor 0 0) 2px 13px / 11px 13px no-repeat,
    linear-gradient(currentColor 0 0) 15px 13px / 11px 13px no-repeat;
}

.notification-icon--read {
  color: #9dbd86;
  background: #f6f4ec;
}
</style>
