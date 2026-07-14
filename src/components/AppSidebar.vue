<template>
  <!-- 桌機版側邊欄 -->
  <aside
    class="hidden md:flex flex-col justify-between bg-[#f3f5ef] border-r border-[var(--bujo-line)] transition-all duration-300 overflow-hidden"
    :class="isOpen ? 'w-[210px] px-5 py-6' : 'w-0 px-0 py-6'"
  >
    <div>
      <!-- Logo -->
      <div class="bujo-sidebar-brand mb-12 whitespace-nowrap">
        <img :src="bujoLogoUrl" alt="BuJo" class="bujo-sidebar-logo" />
      </div>

      <!-- 導覽項目 -->
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="bujo-sidebar-link group"
          :class="{
            'is-active': route.path === item.to || (item.to === '/' && route.path === '/'),
          }"
        >
          <span class="bujo-sidebar-active-line" aria-hidden="true"></span>
          <span class="bujo-nav-object-wrap">
            <span
              class="bujo-nav-object"
              :class="`bujo-nav-object--${item.icon}`"
              aria-hidden="true"
            >
              <span></span>
            </span>
            <span
              v-if="item.icon === 'alerts' && notificationStore.unreadCount > 0"
              class="bujo-nav-badge"
              aria-label="未讀通知數"
            >
              {{ alertBadgeText }}
            </span>
          </span>
          <span class="bujo-sidebar-label">{{ item.label }}</span>
        </RouterLink>
      </nav>
    </div>

    <!-- 下半：篩選 + 用戶 -->
    <div class="flex flex-col gap-5">
      <!-- 篩選按鈕 -->
      <div v-if="isCalendarPage" class="bujo-sidebar-filter whitespace-nowrap">
        <div class="bujo-sidebar-filter-title">CALENDAR FILTER</div>
        <button
          v-for="item in filterItems"
          :key="item.key"
          @click="emit('toggle-filter', item.key)"
          class="bujo-filter-button"
          :class="{ 'is-muted': !filters[item.key] }"
        >
          <span class="bujo-filter-swatch" :style="{ backgroundColor: item.color }"></span>
          <span>{{ item.label }}</span>
        </button>
      </div>

      <!-- 用戶 -->
      <button
        type="button"
        class="bujo-sidebar-profile whitespace-nowrap"
        aria-label="開啟側邊欄個人帳號"
        @click="showProfileModal = true"
      >
        <img
          v-if="userAvatarSrc"
          :src="userAvatarSrc"
          :alt="authStore.user?.display_name || 'Me'"
          class="w-8 h-8 object-cover shrink-0"
        />
        <span v-else class="profile-pixel-face profile-pixel-face--small" aria-hidden="true"></span>
        <span>ME</span>
      </button>
    </div>
  </aside>

  <!-- 手機版底部導覽列 + 篩選抽屜 -->
  <div class="md:hidden">
    <!-- 篩選抽屜 -->
    <div v-if="isCalendarPage && drawerOpen" class="bujo-mobile-filter-tray">
      <div class="bujo-mobile-filter-header">
        <span>CALENDAR FILTER</span>
        <button
          type="button"
          class="bujo-mobile-filter-close"
          @click="drawerOpen = false"
          aria-label="收合篩選"
        >
          ▾
        </button>
      </div>
      <div class="bujo-mobile-filter-grid">
        <button
          v-for="item in filterItems"
          :key="item.key"
          @click="emit('toggle-filter', item.key)"
          class="bujo-mobile-filter-chip"
          :class="{ 'is-muted': !filters[item.key] }"
        >
          <span class="bujo-filter-swatch" :style="{ backgroundColor: item.color }"></span>
          <span>{{ item.label }}</span>
        </button>
      </div>
    </div>

    <!-- 導覽列 -->
    <nav class="bujo-mobile-nav-bar">
      <!-- 箭頭按鈕：僅月曆頁顯示 -->
      <button
        v-if="isCalendarPage"
        @click="drawerOpen = !drawerOpen"
        class="bujo-mobile-filter-toggle"
        :class="{ 'is-open': drawerOpen }"
        :aria-label="drawerOpen ? '收合篩選' : '展開篩選'"
      >
        {{ drawerOpen ? '▾' : '▴' }}
      </button>

      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        class="bujo-mobile-nav-link"
        :class="{ 'is-active': route.path === item.to || (item.to === '/' && route.path === '/') }"
        @click="drawerOpen = false"
        :aria-label="item.label"
      >
        <span class="bujo-nav-object-wrap">
          <span class="bujo-nav-object" :class="`bujo-nav-object--${item.icon}`" aria-hidden="true">
            <span></span>
          </span>
          <span
            v-if="item.icon === 'alerts' && notificationStore.unreadCount > 0"
            class="bujo-nav-badge"
            aria-label="未讀通知數"
          >
            {{ alertBadgeText }}
          </span>
        </span>
      </RouterLink>
      <!-- 個人帳號按鈕 -->
      <button
        type="button"
        class="bujo-mobile-profile"
        :class="{ 'btn-bounce-green': profileBtnBouncing }"
        @click="profileBtnBouncing = true"
        @animationend="onProfileAnimEnd"
        aria-label="開啟個人帳號"
      >
        <img
          v-if="userAvatarSrc"
          :src="userAvatarSrc"
          :alt="authStore.user?.display_name || 'Me'"
          class="w-full h-full object-cover"
        />
        <span v-else class="profile-pixel-face profile-pixel-face--small" aria-hidden="true"></span>
      </button>
    </nav>
  </div>
  <ProfileAccountModal
    v-if="showProfileModal"
    :user="authStore.user"
    @close="showProfileModal = false"
    @logout="handleLogout"
  />
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useNotificationStore } from '@/stores/notificationStore'
import bujoLogoUrl from '@/assets/bujo-logo.svg'
import { toAvatarSrc } from '@/utils/avatar'
import ProfileAccountModal from './ProfileAccountModal.vue'

defineProps({ isOpen: Boolean, filters: Object })
const emit = defineEmits(['toggle-filter'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const notificationStore = useNotificationStore()
const isCalendarPage = computed(() => route.path === '/')
const userAvatarSrc = computed(() => toAvatarSrc(authStore.user?.avatar_url))

// 未讀數更新時機：掛載、瀏覽器分頁回到可見（如從 LINE 推播返回）、App 內換頁
function refetchUnreadCountWhenVisible() {
  if (document.visibilityState === 'visible') {
    notificationStore.fetchUnreadCount()
  }
}

onMounted(() => {
  notificationStore.fetchUnreadCount()
  document.addEventListener('visibilitychange', refetchUnreadCountWhenVisible)
})

onUnmounted(() => {
  document.removeEventListener('visibilitychange', refetchUnreadCountWhenVisible)
})

watch(
  () => route.fullPath,
  () => {
    notificationStore.fetchUnreadCount()
  },
)

const alertBadgeText = computed(() =>
  notificationStore.unreadCount > 9 ? '9+' : String(notificationStore.unreadCount),
)

const drawerOpen = ref(false)
const profileBtnBouncing = ref(false)
const showProfileModal = ref(false)

const navItems = [
  { label: 'CALENDAR', to: '/', icon: 'calendar' },
  { label: 'ACTIVITY', to: '/activity', icon: 'activity' },
  { label: 'FRIENDS', to: '/friends-page', icon: 'friends' },
  { label: 'ALERTS', to: '/alerts', icon: 'alerts' },
]

const filterItems = [
  { key: 'joined', label: 'JOINING', color: 'var(--bujo-card-blue)' },
  { key: 'formed', label: 'FORMED', color: 'var(--bujo-accent)' },
  { key: 'personal', label: 'PERSONAL', color: 'var(--bujo-card-yellow)' },
]

function onProfileAnimEnd() {
  profileBtnBouncing.value = false
  showProfileModal.value = true
}

async function handleLogout() {
  showProfileModal.value = false
  await authStore.logout()
  router.push('/login')
}
</script>

<style scoped>
.bujo-sidebar-brand {
  display: flex;
  align-items: center;
}

.bujo-sidebar-logo {
  display: block;
  width: 118px;
  height: auto;
}

.bujo-sidebar-link {
  position: relative;
  display: grid;
  grid-template-columns: 28px 1fr;
  align-items: center;
  gap: 13px;
  min-height: 52px;
  padding: 8px 0 8px 15px;
  color: var(--bujo-muted-strong);
  text-decoration: none;
  white-space: nowrap;
  transition: color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-sidebar-label {
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  letter-spacing: 0;
}

.bujo-sidebar-active-line {
  position: absolute;
  left: 0;
  top: 15px;
  width: 1px;
  height: 22px;
  background: var(--bujo-ink);
  opacity: 0;
  transform: scaleY(0.55);
  transform-origin: center;
  transition:
    opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-sidebar-link:hover,
.bujo-sidebar-link.is-active {
  color: var(--bujo-ink);
}

.bujo-sidebar-link:hover .bujo-sidebar-active-line,
.bujo-sidebar-link.is-active .bujo-sidebar-active-line {
  opacity: 1;
  transform: scaleY(1);
}

.bujo-sidebar-link.is-active .bujo-sidebar-active-line {
  background: var(--bujo-accent);
  width: 2px;
}

.bujo-nav-object-wrap {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
}

.bujo-nav-object {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
  color: currentColor;
}

.bujo-nav-badge {
  position: absolute;
  top: -7px;
  right: -9px;
  z-index: 2;
  display: inline-flex;
  min-width: 18px;
  height: 18px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  border: 1px solid var(--bujo-surface);
  background: var(--bujo-notification);
  box-shadow: 2px 2px 0 rgb(var(--bujo-ink-rgb) / 0.14);
  padding: 0 4px;
  color: var(--bujo-white);
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.bujo-nav-object::before,
.bujo-nav-object::after,
.bujo-nav-object span::before,
.bujo-nav-object span::after {
  position: absolute;
  content: '';
  box-sizing: border-box;
  transition:
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-nav-object--calendar::before {
  left: 4px;
  top: 5px;
  width: 17px;
  height: 18px;
  border: 1.5px solid currentColor;
  background: var(--bujo-surface);
}

.bujo-nav-object--calendar::after {
  left: 7px;
  top: 9px;
  width: 11px;
  height: 1.5px;
  background: currentColor;
  box-shadow:
    0 5px 0 currentColor,
    0 10px 0 currentColor;
  opacity: 0.72;
}

.bujo-nav-object--calendar span::before {
  right: 2px;
  top: 2px;
  width: 7px;
  height: 7px;
  background: var(--bujo-accent);
  border: 1px solid var(--bujo-ink);
}

.bujo-nav-object--activity::before {
  left: 3px;
  top: 8px;
  width: 20px;
  height: 13px;
  border: 1.5px solid currentColor;
  background: var(--bujo-surface);
  transform: rotate(-3deg);
}

.bujo-nav-object--activity::after {
  left: 7px;
  top: 4px;
  width: 17px;
  height: 13px;
  border: 1.5px solid currentColor;
  background: var(--bujo-card-yellow);
  transform: rotate(4deg);
}

.bujo-nav-object--activity span::before {
  left: 11px;
  top: 12px;
  z-index: 1;
  width: 7px;
  height: 1.5px;
  background: currentColor;
  box-shadow: 0 4px 0 currentColor;
}

.bujo-nav-object--friends::before {
  left: 6px;
  top: 4px;
  width: 15px;
  height: 18px;
  border: 1.5px solid currentColor;
  background: var(--bujo-card-pink);
}

.bujo-nav-object--friends::after {
  left: 3px;
  top: 8px;
  width: 20px;
  height: 14px;
  background: radial-gradient(circle at 2px 2px, transparent 0 2px, var(--bujo-surface) 2px 4px) 0
    0 / 6px 6px;
  z-index: -1;
}

.bujo-nav-object--friends span::before {
  left: 10px;
  top: 9px;
  width: 7px;
  height: 7px;
  border-radius: 50%;
  border: 1.5px solid currentColor;
}

.bujo-nav-object--friends span::after {
  left: 8px;
  top: 17px;
  width: 11px;
  height: 5px;
  border: 1.5px solid currentColor;
  border-top: 0;
  border-radius: 0 0 8px 8px;
}

.bujo-nav-object--alerts::before {
  left: 5px;
  top: 7px;
  width: 18px;
  height: 14px;
  border: 1.5px solid currentColor;
  background: var(--bujo-surface);
}

.bujo-nav-object--alerts::after {
  left: 8px;
  top: 3px;
  width: 14px;
  height: 11px;
  border: 1.5px solid currentColor;
  background: var(--bujo-card-blue);
  transform: rotate(5deg);
}

.bujo-nav-object--alerts span::before {
  left: 9px;
  top: 13px;
  width: 10px;
  height: 1.5px;
  background: currentColor;
  z-index: 1;
}

.bujo-sidebar-link:hover .bujo-nav-object--activity::after,
.bujo-sidebar-link.is-active .bujo-nav-object--activity::after,
.bujo-mobile-nav-link:hover .bujo-nav-object--activity::after,
.bujo-mobile-nav-link.is-active .bujo-nav-object--activity::after {
  transform: rotate(0deg) translateY(-1px);
}

.bujo-sidebar-link:hover .bujo-nav-object--alerts::after,
.bujo-sidebar-link.is-active .bujo-nav-object--alerts::after,
.bujo-mobile-nav-link:hover .bujo-nav-object--alerts::after,
.bujo-mobile-nav-link.is-active .bujo-nav-object--alerts::after {
  transform: rotate(0deg) translateY(-1px);
}

.bujo-sidebar-filter {
  border-top: 1px solid var(--bujo-line);
  padding-top: 18px;
  display: grid;
  gap: 8px;
}

.bujo-sidebar-filter-title {
  margin-bottom: 2px;
  color: var(--bujo-muted);
  font-family: 'Space Mono', monospace;
  font-size: 14px;
  line-height: 1;
}

.bujo-filter-button {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  width: fit-content;
  color: var(--bujo-ink);
  font-family: 'Space Mono', monospace;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
  transition: opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-filter-button.is-muted {
  opacity: 0.38;
}

.bujo-filter-swatch {
  width: 8px;
  height: 8px;
  border: 1px solid var(--bujo-ink);
}

.bujo-sidebar-profile {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  width: fit-content;
  border: 0;
  background: transparent;
  color: var(--bujo-ink);
  cursor: pointer;
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  text-decoration: none;
}

.bujo-mobile-nav-bar {
  position: fixed;
  right: 0;
  bottom: 0;
  left: 0;
  z-index: 50;
  display: flex;
  height: 62px;
  align-items: center;
  justify-content: space-around;
  border-top: 1px solid rgb(var(--bujo-line-rgb) / 0.68);
  background:
    radial-gradient(circle, rgb(var(--bujo-line-rgb) / 0.12) 1px, transparent 1px) 0 0 / 22px 22px,
    rgb(var(--bujo-surface-rgb, 251 251 248) / 0.96);
  box-shadow: 0 -10px 24px rgb(var(--bujo-ink-rgb) / 0.045);
}

.bujo-mobile-nav-bar::before {
  position: absolute;
  inset: 0 14px auto;
  height: 1px;
  background: rgb(var(--bujo-white-rgb) / 0.8);
  content: '';
}

.bujo-mobile-filter-toggle {
  position: absolute;
  bottom: calc(100% - 1px);
  left: 50%;
  display: grid;
  width: 30px;
  height: 22px;
  place-items: center;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.72);
  border-bottom: 0;
  background: var(--bujo-surface);
  color: var(--bujo-ink);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  line-height: 1;
  transform: translateX(-50%);
}

.bujo-mobile-filter-toggle.is-open {
  background: var(--bujo-white);
}

.bujo-mobile-filter-tray {
  position: fixed;
  right: 12px;
  bottom: 74px;
  left: 12px;
  z-index: 49;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.66);
  background:
    linear-gradient(to bottom, rgb(var(--bujo-white-rgb) / 0.72), transparent 34px),
    var(--bujo-surface);
  box-shadow:
    0 10px 18px rgb(var(--bujo-ink-rgb) / 0.055),
    -5px 5px 0 rgb(var(--bujo-line-rgb) / 0.08);
  padding: 12px;
}

.bujo-mobile-filter-tray::before {
  position: absolute;
  right: 8px;
  bottom: -7px;
  left: 8px;
  height: 7px;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.22);
  border-top: 0;
  background: rgb(var(--bujo-white-rgb) / 0.42);
  content: '';
}

.bujo-mobile-filter-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  color: rgb(var(--bujo-ink-rgb) / 0.58);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.08em;
}

.bujo-mobile-filter-close {
  display: grid;
  width: 28px;
  height: 22px;
  place-items: center;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.62);
  background: var(--bujo-surface-muted);
  color: var(--bujo-ink);
  line-height: 1;
}

.bujo-mobile-filter-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 7px;
}

.bujo-mobile-filter-chip {
  display: flex;
  min-width: 0;
  min-height: 36px;
  align-items: center;
  justify-content: center;
  gap: 6px;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.72);
  background: rgb(var(--bujo-white-rgb) / 0.58);
  color: var(--bujo-ink);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  line-height: 1;
  transition:
    opacity 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-mobile-filter-chip.is-muted {
  border-style: dashed;
  background: transparent;
  opacity: 0.46;
}

.bujo-mobile-nav-link {
  position: relative;
  display: grid;
  place-items: center;
  width: 48px;
  height: 44px;
  color: var(--bujo-muted-strong);
  transition:
    color 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-mobile-nav-link.is-active,
.bujo-mobile-nav-link:hover {
  background: rgb(var(--bujo-white-rgb) / 0.44);
  color: var(--bujo-ink);
}

.bujo-mobile-nav-link.is-active::after {
  position: absolute;
  right: 12px;
  bottom: 4px;
  left: 12px;
  height: 2px;
  background: var(--bujo-accent);
  content: '';
}

.bujo-mobile-profile {
  display: flex;
  height: 44px;
  width: 48px;
  align-items: center;
  justify-content: center;
  border: 0;
  background: transparent;
  color: var(--bujo-ink);
  transition: transform 120ms ease-out;
}

.bujo-mobile-profile:active {
  transform: translate(1px, 1px);
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
  }
  40% {
    transform: translate(1px, 1px);
  }
  100% {
    transform: translate(0, 0);
  }
}
.btn-bounce-green {
  animation: pixel-bounce-green 0.16s ease-out;
}
</style>
