import { createRouter, createWebHistory } from 'vue-router'
import EventView from '../components/EventView.vue'
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
      name: 'calendar',
      redirect: '/calendar',
    },
    {
      path: '/calendar',
      name: 'calendar-page',
      component: () => import('../components/CalendarMain.vue'),
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
      path: '/event',
      name: 'event',
      component: EventView,
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

export default router
