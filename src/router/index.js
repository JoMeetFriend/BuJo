import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import ActivityView from '../components/ActivityView.vue'
import NotFound from '../components/NotFound.vue'

/*登入頁面*/
import LoginView from '../components/LoginView.vue'
/*註冊頁面*/

import FriendsPage from '../components/FriendsPage.vue'
import AvailabilityPickerModal from '../components/AvailabilityPickerPreview.vue'

const router = createRouter({

  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'calendar-page',
      component: () => import('../components/CalendarMain.vue'),
      // 有meta: { requiresAuth: true }的部分需要登入才看得到頁面
      meta: { requiresAuth: true }
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../components/ProfileEditPage.vue'),
    },

    {
      path: '/friends-page',
      name: 'friends-page',
      component: FriendsPage,
    },

    //登入頁面
    {
      path: '/login',
      component: LoginView,
    },
    //註冊頁面
    {
      path: '/register',
      component: () => import('../components/RegisterViews.vue'),
    },
    {
      path: '/activity',
      name: 'activity',
      component: ActivityView,
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: NotFound,
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
      component: AvailabilityPickerModal,
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
