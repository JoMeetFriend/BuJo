<template>
  <div class="min-h-screen bg-[#FEF7E8] pb-24 text-[#4A5040]">
    <header
      class="sticky top-0 z-10 flex items-baseline gap-4 bg-[#FEF7E8] px-5 pt-8 pb-4 md:px-14"
    >
      <h1 class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl">通知</h1>
      <span class="font-['Press_Start_2P'] text-[#9DBD86] text-base tracking-widest"> ALERTS </span>
    </header>

    <main class="px-5 pt-2 md:px-14 md:py-4">
      <div class="mb-3 flex max-w-3xl justify-start">
        <button
          type="button"
          class="w-fit border-2 border-[#4A5040] bg-[#87C06D] px-2.5 py-1.5 font-[cubic11] text-[11px] font-black leading-none text-white shadow-[2px_2px_0px_#4A5040] transition-colors hover:bg-[#69AD76] disabled:cursor-not-allowed disabled:border-[#9DBD86] disabled:bg-[#DCE8D2] disabled:text-[#9DBD86] disabled:shadow-none"
          :disabled="!hasUnread"
          @click="markAllAsRead"
        >
          全部已讀
        </button>
      </div>

      <ul class="flex max-w-3xl flex-col gap-3">
        <li
          v-for="notification in notifications"
          :key="notification.id"
          class="flex min-h-[68px] cursor-pointer items-center gap-3 border-[2px] bg-white p-3 transition-colors hover:bg-[#FBFFF7]"
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
            class="notification-icon"
            :class="[
              `notification-icon--${notification.category}`,
              { 'notification-icon--read': notification.isRead },
            ]"
            aria-hidden="true"
          ></div>

          <div class="flex min-w-0 flex-1 flex-col gap-[2px]">
            <p
              class="line-clamp-2 font-[cubic11] text-sm font-semibold leading-snug text-[#4A5040]"
            >
              {{ notification.message }}
            </p>
            <p class="truncate font-[cubic11] text-xs text-[#9DBD86]">
              {{ notification.timeText }}
            </p>
          </div>
        </li>
      </ul>
    </main>
  </div>
</template>

<script setup>
import { computed, ref } from 'vue'

const notifications = ref([
  {
    id: 'activity-formed-1',
    category: 'activity',
    message: '你報名的 象山日出 已成團，6/10 早上 06:00 出發！',
    timeText: '10 分鐘前',
    isRead: false,
  },
  {
    id: 'friend-accepted-1',
    category: 'friend',
    message: '語安 接受了你的好友邀請',
    timeText: '1 小時前',
    isRead: true,
  },
])

const hasUnread = computed(() => notifications.value.some((notification) => !notification.isRead))

function markAsRead(notification) {
  notification.isRead = true
}

function markAllAsRead() {
  notifications.value.forEach((notification) => {
    notification.isRead = true
  })
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
