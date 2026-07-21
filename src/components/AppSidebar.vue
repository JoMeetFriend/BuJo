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
          :data-tour="`nav-${item.key}`"
          class="bujo-sidebar-link group"
          :class="{
            'is-active': route.path === item.to,
          }"
        >
          <span class="bujo-sidebar-active-line" aria-hidden="true"></span>
          <span class="bujo-nav-icon-wrap">
            <span class="bujo-nav-icon" :style="{ backgroundColor: item.color }" aria-hidden="true">
              <component :is="item.icon" class="bujo-nav-icon-svg" />
            </span>
            <span
              v-if="item.key === 'alerts' && notificationStore.unreadCount > 0"
              class="bujo-nav-badge"
              :aria-label="t('sidebar.ariaUnreadCount')"
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
      <!-- 語言切換與新手導覽：固定在 CALENDAR FILTER 那條線上面，靠左對齊 -->
      <div class="bujo-sidebar-tool-stack">
        <button
          type="button"
          class="bujo-sidebar-language-button"
          :aria-label="t('common.ariaToggleLanguage')"
          @click="toggleLanguage"
        >
          {{ locale === 'zh-TW' ? t('common.langEn') : 'CH' }}
        </button>
        <AppTourHelpButton v-if="isCalendarPage" @click="emit('open-tour')" />
      </div>

      <!-- 篩選按鈕 -->
      <div v-if="isCalendarPage" class="bujo-sidebar-filter whitespace-nowrap">
        <div class="bujo-sidebar-filter-title">{{ t('sidebar.filterTitle') }}</div>
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
        data-tour="nav-profile"
        :aria-label="t('sidebar.ariaOpenProfile')"
        @click="showProfileModal = true"
      >
        <img
          v-if="userAvatarSrc"
          :src="userAvatarSrc"
          :alt="authStore.user?.display_name || t('sidebar.meFallback')"
          class="w-8 h-8 object-cover shrink-0"
        />
        <span v-else class="profile-pixel-face profile-pixel-face--small" aria-hidden="true"></span>
        <span>{{ authStore.user?.display_name || t('sidebar.meFallback') }}</span>
      </button>
    </div>
  </aside>

  <!-- 手機版底部導覽列 + 篩選抽屜 -->
  <div class="md:hidden">
    <!-- 新手導覽問號：手機版沒有側邊欄可以嵌，浮在畫面右上角 -->
    <AppTourHelpButton v-if="isCalendarPage" floating calendar-aligned @click="emit('open-tour')" />
    <!-- 篩選抽屜 -->
    <div v-if="isCalendarPage && drawerOpen" class="bujo-mobile-filter-tray">
      <div class="bujo-mobile-filter-header">
        <span>{{ t('sidebar.filterTitle') }}</span>
        <button
          type="button"
          class="bujo-mobile-filter-close"
          @click="drawerOpen = false"
          :aria-label="t('sidebar.ariaCloseFilter')"
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
        :aria-label="drawerOpen ? t('sidebar.ariaCloseFilter') : t('sidebar.ariaOpenFilter')"
      >
        {{ drawerOpen ? '▾' : '▴' }}
      </button>

      <RouterLink
        v-for="item in navItems"
        :key="item.label"
        :to="item.to"
        :data-tour="`nav-${item.key}`"
        class="bujo-mobile-nav-link"
        :class="{ 'is-active': route.path === item.to }"
        @click="drawerOpen = false"
        :aria-label="item.label"
      >
        <span class="bujo-nav-icon-wrap">
          <span class="bujo-nav-icon" :style="{ backgroundColor: item.color }" aria-hidden="true">
            <component :is="item.icon" class="bujo-nav-icon-svg" />
          </span>
          <span
            v-if="item.key === 'alerts' && notificationStore.unreadCount > 0"
            class="bujo-nav-badge"
            :aria-label="t('sidebar.ariaUnreadCount')"
          >
            {{ alertBadgeText }}
          </span>
        </span>
      </RouterLink>
      <!-- 個人帳號按鈕 -->
      <button
        type="button"
        class="bujo-mobile-profile"
        data-tour="nav-profile"
        :class="{ 'btn-bounce-green': profileBtnBouncing }"
        @click="profileBtnBouncing = true"
        @animationend="onProfileAnimEnd"
        :aria-label="t('sidebar.ariaMobileProfile')"
      >
        <img
          v-if="userAvatarSrc"
          :src="userAvatarSrc"
          :alt="authStore.user?.display_name || t('sidebar.meFallback')"
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
import { useI18n } from 'vue-i18n'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  CalendarDaysIcon,
  PencilSquareIcon,
  UserGroupIcon,
  BellAlertIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import { useNotificationStore } from '@/stores/notificationStore'
import bujoLogoUrl from '@/assets/bujo-logo.svg'
import { toAvatarSrc } from '@/utils/avatar'
import ProfileAccountModal from './ProfileAccountModal.vue'
import AppTourHelpButton from './AppTourHelpButton.vue'

defineProps({ isOpen: Boolean, filters: Object })
const emit = defineEmits(['toggle-filter', 'open-tour'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const notificationStore = useNotificationStore()
const { t, locale } = useI18n()
const isCalendarPage = computed(() => route.path === '/calendar')
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

const navItems = computed(() => [
  {
    key: 'calendar',
    label: t('sidebar.calendar'),
    to: '/calendar',
    icon: CalendarDaysIcon,
    color: 'var(--bujo-card-pink)',
  },
  {
    key: 'activity',
    label: t('sidebar.activity'),
    to: '/activity',
    icon: PencilSquareIcon,
    color: 'var(--bujo-card-blue)',
  },
  {
    key: 'friends',
    label: t('sidebar.friends'),
    to: '/friends-page',
    icon: UserGroupIcon,
    color: '#c9b8e8',
  },
  {
    key: 'alerts',
    label: t('sidebar.navAlerts'),
    to: '/alerts',
    icon: BellAlertIcon,
    color: 'var(--bujo-accent)',
  },
])

const filterItems = computed(() => [
  { key: 'formedByMe', label: t('sidebar.filterFormedByMe'), color: 'var(--bujo-accent)' },
  {
    key: 'formedByOthers',
    label: t('sidebar.filterFormedByOthers'),
    color: 'var(--bujo-card-blue)',
  },
])

function onProfileAnimEnd() {
  profileBtnBouncing.value = false
  showProfileModal.value = true
}

function toggleLanguage() {
  const newLocale = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  localeStore.setLocale(newLocale, { global: { locale } })
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

.bujo-nav-icon-wrap {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
}

.bujo-nav-icon {
  display: grid;
  width: 26px;
  height: 26px;
  place-items: center;
  border-radius: 50%;
  color: var(--bujo-ink);
  transition: transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-nav-icon-svg {
  width: 16px;
  height: 16px;
}

.bujo-sidebar-link:hover .bujo-nav-icon,
.bujo-sidebar-link.is-active .bujo-nav-icon,
.bujo-mobile-nav-link:hover .bujo-nav-icon,
.bujo-mobile-nav-link.is-active .bujo-nav-icon {
  transform: scale(1.08);
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

.bujo-sidebar-filter {
  border-top: 1px solid var(--bujo-line);
  padding-top: 18px;
  display: grid;
  gap: 8px;
}

.bujo-sidebar-tool-stack {
  display: inline-flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 10px;
}

.bujo-sidebar-language-button {
  display: flex;
  width: 26px;
  height: 26px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bujo-ink);
  border-radius: 999px;
  background: var(--bujo-surface);
  color: var(--bujo-ink);
  box-shadow: 0 2px 0 var(--bujo-ink);
  cursor: pointer;
  font-family: var(--bujo-font-body);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 100ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-sidebar-language-button:hover {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.bujo-sidebar-language-button:active {
  box-shadow: 0 1px 0 var(--bujo-ink);
  transform: translate(1px, 1px);
}

.bujo-sidebar-language-button:focus-visible {
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
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
  bottom: 100%;
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
  overflow: hidden;
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
