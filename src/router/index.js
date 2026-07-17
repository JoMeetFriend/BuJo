import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'landing',
      component: () => import('../components/LandingPage.vue'),
    },
    {
      path: '/calendar',
      name: 'calendar-page',
      component: () => import('../components/CalendarMain.vue'),
      // 有meta: { requiresAuth: true }的部分需要登入才看得到頁面
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../components/ProfileEditPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/friends-page',
      name: 'friends-page',
      component: () => import('../components/FriendsPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/login',
      component: () => import('../components/LoginView.vue'),
    },
    {
      path: '/register',
      component: () => import('../components/RegisterViews.vue'),
    },
    {
      path: '/activity',
      name: 'activity',
      component: () => import('../components/ActivityView.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('../components/NotFound.vue'),
    },
    {
      path: '/friends/new',
      name: 'friend-add',
      component: () => import('../components/FriendAddModal.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/events/new',
      name: 'event-new',
      component: () => import('../components/EventPage.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/availability-picker',
      name: 'availability-picker',
      component: () => import('../components/AvailabilityPickerPreview.vue'),
      meta: { requiresAuth: true },
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: () => import('../components/AlertsPage.vue'),
      meta: { requiresAuth: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const authStore = useAuthStore()
  // 第一次載入一定要確認；之後只在進入需要登入的頁面時重新跟後端確認，
  // 避免 cookie 過期或被後端強制登出後，分頁只要沒重新整理就一直被當成已登入
  if (!authStore.initialized || to.meta.requiresAuth) {
    // 只有第一次載入才需要先確認後端沒在 Render 冷啟動中；之後的請求後端已經醒著
    if (!authStore.initialized) {
      await authStore.waitForBackend()
    }
    await authStore.fetchMe()
  }

  const guestOnly = to.path === '/login' || to.path === '/register'
  if (guestOnly && authStore.user) return '/calendar'

  // 已登入使用者訪問行銷首頁時直接導向行事曆，避免看到訪客用的 landing page
  if (to.path === '/' && authStore.user) return '/calendar'

  if (to.meta.requiresAuth && !authStore.user) return '/login'

  return true
})

export default router
