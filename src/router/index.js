import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar-page',
      component: () => import('../components/CalendarMain.vue'),
      // 有meta: { requiresAuth: true }的部分需要登入才看得到頁面
      meta: { requiresAuth: true },
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../components/ProfileEditPage.vue'),
    },
    {
      path: '/friends-page',
      name: 'friends-page',
      component: () => import('../components/FriendsPage.vue'),
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
    },
    {
      path: '/events/new',
      name: 'event-new',
      component: () => import('../components/EventPage.vue'),
    },
    {
      path: '/availability-picker',
      name: 'availability-picker',
      component: () => import('../components/AvailabilityPickerPreview.vue'),
    },
    {
      path: '/alerts',
      name: 'alerts',
      component: () => import('../components/AlertsPage.vue'),
    },
  ],
})

// 有meta: { requiresAuth: true }的部分需要登入才看得到頁面
router.beforeEach((to, from, next) => {
  const authStore = useAuthStore()
  if (to.meta.requiresAuth && !authStore.isLoggedIn) {
    next('/login')
  } else {
    next()
  }
})

export default router
