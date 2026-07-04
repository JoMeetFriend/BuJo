<template>
  <!-- 桌機版側邊欄 -->
  <aside
    class="hidden md:flex flex-col justify-between bg-[var(--bujo-page)] border-r border-[var(--bujo-line)] transition-all duration-300 overflow-hidden"
    :class="isOpen ? 'w-[210px] px-5 py-6' : 'w-0 px-0 py-6'"
  >
    <div>
      <!-- Logo -->
      <div class="flex items-center gap-3 mb-12 whitespace-nowrap">
        <div class="bujo-sidebar-logo-mark shrink-0"></div>
        <span class="font-[plex-sans-tc] text-[var(--bujo-ink)] text-[17px] font-bold tracking-normal"
          >BuJo</span
        >
      </div>

      <!-- 導覽項目 -->
      <nav class="flex flex-col gap-1">
        <RouterLink
          v-for="item in navItems"
          :key="item.label"
          :to="item.to"
          class="bujo-sidebar-link group"
          :class="{ 'is-active': route.path === item.to || (item.to === '/' && route.path === '/') }"
        >
          <span class="bujo-sidebar-active-line" aria-hidden="true"></span>
          <span class="bujo-nav-object" :class="`bujo-nav-object--${item.icon}`" aria-hidden="true">
            <span></span>
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
      <RouterLink
        to="/profile/edit"
        class="bujo-sidebar-profile whitespace-nowrap"
      >
        <img
          v-if="userAvatarSrc"
          :src="userAvatarSrc"
          :alt="authStore.user?.display_name || 'Me'"
          class="w-8 h-8 object-cover shrink-0"
        />
        <span
          v-else
          class="profile-pixel-face profile-pixel-face--small"
          aria-hidden="true"
        ></span>
        <span>ME</span>
      </RouterLink>
    </div>
  </aside>

  <!-- 手機版底部導覽列 + 篩選抽屜 -->
  <div class="md:hidden">
    <!-- 篩選抽屜 -->
    <div
      v-if="isCalendarPage && drawerOpen"
      class="fixed bottom-0 left-0 right-0 bg-[var(--bujo-page)] border-t border-[var(--bujo-line)] px-6 pt-4 flex flex-col gap-3 z-50 pb-[82px]"
    >
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

    <!-- 導覽列 -->
    <nav
      class="fixed bottom-0 left-0 right-0 bg-[var(--bujo-page)] border-t border-[var(--bujo-line)] flex justify-around items-center py-3 z-50"
    >
      <!-- 箭頭按鈕：僅月曆頁顯示 -->
      <button
        v-if="isCalendarPage"
        @click="drawerOpen = !drawerOpen"
        class="absolute left-1/2 -translate-x-1/2 bottom-full w-9 h-6 bg-[var(--bujo-page)] border border-[var(--bujo-line)] border-b-0 flex items-center justify-center text-[var(--bujo-ink)] text-[10px] font-[space-mono]"
      >
        {{ drawerOpen ? '▼' : '▲' }}
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
        <span class="bujo-nav-object" :class="`bujo-nav-object--${item.icon}`" aria-hidden="true">
          <span></span>
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
import { ref, computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { toAvatarSrc } from '@/utils/avatar'
import ProfileAccountModal from './ProfileAccountModal.vue'

defineProps({ isOpen: Boolean, filters: Object })
const emit = defineEmits(['toggle-filter'])

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const isCalendarPage = computed(() => route.path === '/')
const userAvatarSrc = computed(() => toAvatarSrc(authStore.user?.avatar_url))

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
.bujo-sidebar-logo-mark {
  width: 20px;
  height: 20px;
  border: 2px solid var(--bujo-ink);
  background: var(--bujo-accent);
  box-shadow: -5px 5px 0 var(--bujo-card-yellow);
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
  transition: color 160ms cubic-bezier(.2, .8, .2, 1);
}

.bujo-sidebar-label {
  font-family: "Space Mono", monospace;
  font-size: 12px;
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
  transform: scaleY(.55);
  transform-origin: center;
  transition:
    opacity 160ms cubic-bezier(.2, .8, .2, 1),
    transform 160ms cubic-bezier(.2, .8, .2, 1),
    background-color 160ms cubic-bezier(.2, .8, .2, 1);
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

.bujo-nav-object {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
  color: currentColor;
}

.bujo-nav-object::before,
.bujo-nav-object::after,
.bujo-nav-object span::before,
.bujo-nav-object span::after {
  position: absolute;
  content: '';
  box-sizing: border-box;
  transition:
    background-color 160ms cubic-bezier(.2, .8, .2, 1),
    border-color 160ms cubic-bezier(.2, .8, .2, 1),
    transform 160ms cubic-bezier(.2, .8, .2, 1);
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
  opacity: .72;
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
  background:
    radial-gradient(circle at 2px 2px, transparent 0 2px, var(--bujo-surface) 2px 4px) 0 0 / 6px 6px;
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
  font-family: "Space Mono", monospace;
  font-size: 10px;
  line-height: 1;
}

.bujo-filter-button {
  display: inline-flex;
  align-items: center;
  gap: 9px;
  width: fit-content;
  color: var(--bujo-ink);
  font-family: "Space Mono", monospace;
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  transition: opacity 160ms cubic-bezier(.2, .8, .2, 1);
}

.bujo-filter-button.is-muted {
  opacity: .38;
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
  color: var(--bujo-ink);
  font-family: "Space Mono", monospace;
  font-size: 12px;
  font-weight: 700;
  text-decoration: none;
}

.bujo-mobile-nav-link {
  display: grid;
  place-items: center;
  width: 48px;
  height: 42px;
  color: var(--bujo-muted-strong);
  transition: color 160ms cubic-bezier(.2, .8, .2, 1);
}

.bujo-mobile-nav-link.is-active,
.bujo-mobile-nav-link:hover {
  color: var(--bujo-ink);
}

.bujo-mobile-profile {
  display: flex;
  height: 42px;
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
