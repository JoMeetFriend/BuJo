import { createRouter, createWebHistory } from 'vue-router'
import FriendsPage from '../components/FriendsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: { name: 'friend-add' },
      redirect: '/calendar',
    },
    {
      path: '/calendar',
      name: 'calendar',
      component: () => import('../components/CalendarMain.vue'),
    },
    {
      path: '/profile/edit',
      name: 'profile-edit',
      component: () => import('../components/ProfileEditPage.vue'),
    },
    {
      path: '/events/new',
      name: 'event-new',
      component: () => import('../components/EventPage.vue'),
    },
    {
      path: '/friends-page',
      name: 'friends-page',
      component: FriendsPage,
    },
    {
      path: '/friends/new',
      name: 'friend-add',
      component: () => import('../components/FriendAddModal.vue'),
    },
    //登入頁面
    {
      path: '/login',
      component: () => import('../components/LoginView.vue'),
    },
  ],
})

export default router
