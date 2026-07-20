<template>
  <div class="app-shell relative flex bg-[var(--bujo-page)] overflow-hidden text-[var(--bujo-ink)]">
    <LoadingPage v-if="!authStore.initialized || !minDisplayElapsed" />

    <AppSidebar
      v-if="showSidebar"
      :isOpen="sidebarOpen"
      :filters="filters"
      @toggle-filter="toggleFilter"
      @open-tour="startAppTour"
    />

    <SidebarToggleButton
      v-if="showSidebar"
      class="hidden md:flex"
      :class="
        sidebarOpen
          ? 'app-sidebar-toggle app-sidebar-toggle--open'
          : 'app-sidebar-toggle app-sidebar-toggle--closed'
      "
      @click="sidebarOpen = !sidebarOpen"
    />

    <main
      class="flex-1 min-w-0 flex flex-col"
      :class="[
        isCalendarPage || isAuthPage ? 'overflow-hidden' : 'overflow-auto',
        {
          'pb-20':
            route.path !== '/activity' &&
            !isCalendarPage &&
            !isAuthPage &&
            !isLandingPage &&
            !isNotFoundPage,
        },
      ]"
    >
      <RouterView v-slot="{ Component }">
        <component :is="Component" :sidebarOpen="sidebarOpen" :filters="filters" />
      </RouterView>
    </main>

    <LineNotificationOnboardingModal
      v-if="showLineNotificationOnboarding"
      :user="authStore.user"
      @link-start="rememberOnboardingReturnPath"
      @complete="markLineNotificationOnboardingSeen"
    />
  </div>
</template>

<script setup>
import { RouterView, useRoute, useRouter } from 'vue-router'
import { ref, computed, onMounted, watch, nextTick } from 'vue'
import AppSidebar from './components/AppSidebar.vue'
import SidebarToggleButton from './components/ui/SidebarToggleButton.vue'
import LineNotificationOnboardingModal from './components/LineNotificationOnboardingModal.vue'
import LoadingPage from './components/ui/LoadingPage.vue'
import { useAuthStore } from './stores/auth'
import {
  rememberLineNotificationOnboardingReturnPath,
  useLineNotificationOnboarding,
} from './composables/useLineNotificationOnboarding'
import { useI18n } from 'vue-i18n'
import { useAppTour } from './composables/useAppTour'
import { markEventScenarioGuideSeen } from './composables/useEventScenarioGuide'

// 載入畫面至少顯示這麼久，避免 authStore 初始化太快時畫面閃一下就消失
const MIN_LOADING_DISPLAY_MS = 1600

const route = useRoute()
const router = useRouter()
const authStore = useAuthStore()
const sidebarOpen = ref(true)
const filters = ref({ formedByMe: true, formedByOthers: true })
const minDisplayElapsed = ref(false)

onMounted(() => {
  setTimeout(() => {
    minDisplayElapsed.value = true
  }, MIN_LOADING_DISPLAY_MS)
})

const isNotFoundPage = computed(() => route.name === 'not-found')
const showSidebar = computed(
  () => !['/login', '/register', '/'].includes(route.path) && !isNotFoundPage.value,
)
const isAuthPage = computed(() => ['/login', '/register'].includes(route.path))
const isLandingPage = computed(() => route.path === '/')
const isCalendarPage = computed(() => route.name === 'calendar-page')
const onboardingUserId = computed(() => authStore.user?.id ?? authStore.user?.uid ?? '')
const {
  shouldShow: hasUnseenLineNotificationOnboarding,
  markSeen: markLineNotificationOnboardingSeen,
} = useLineNotificationOnboarding(onboardingUserId)

const { t } = useI18n()
const {
  hasSeenTour: hasSeenAppTour,
  startTour: startAppTour,
  startTourHint: startAppTourHint,
} = useAppTour(onboardingUserId, {
  navigate: (path) => router.push(path),
  t,
  // 主導覽自己開了新增活動彈窗要介紹「？」按鈕時，先標記情境一的彈窗導覽已看過，
  // 避免彈窗一開兩邊導覽疊在一起
  onSuppressEventScenarioGuide: () => markEventScenarioGuideSeen(onboardingUserId.value, 'a'),
})

// LINE 提醒彈窗要排在新手導覽提示之後才出現：第一次登入的使用者要先看過「？」按鈕在哪，
// 才輪到 LINE 提醒，避免兩個彈窗同時搶畫面
const showLineNotificationOnboarding = computed(
  () =>
    authStore.initialized &&
    Boolean(authStore.user) &&
    Boolean(onboardingUserId.value) &&
    Boolean(route.meta.requiresAuth) &&
    hasUnseenLineNotificationOnboarding.value &&
    hasSeenAppTour.value,
)
// 新手導覽的預設首頁是行事曆頁（登入/註冊後的導向目標），只在那裡自動提示一次；
// 第一次登入不直接跑完整導覽，只指出「？」按鈕在哪，完整導覽留給使用者自己點開
const shouldAutoStartAppTour = computed(
  () =>
    authStore.initialized &&
    minDisplayElapsed.value &&
    Boolean(authStore.user) &&
    Boolean(onboardingUserId.value) &&
    isCalendarPage.value &&
    !hasSeenAppTour.value,
)
watch(
  shouldAutoStartAppTour,
  async (shouldStart) => {
    if (!shouldStart) return
    await nextTick()
    startAppTourHint()
  },
  { immediate: true },
)

function toggleFilter(key) {
  filters.value[key] = !filters.value[key]
}

function rememberOnboardingReturnPath() {
  rememberLineNotificationOnboardingReturnPath(route.fullPath)
}
</script>

<style scoped>
.app-shell {
  height: 100vh;
  height: 100dvh;
}

.app-sidebar-toggle {
  position: absolute;
  top: 22px;
  z-index: 20;
  transition: left 300ms cubic-bezier(0.4, 0, 0.2, 1);
}

.app-sidebar-toggle--open {
  left: 156px;
}

.app-sidebar-toggle--closed {
  left: 16px;
}
</style>
