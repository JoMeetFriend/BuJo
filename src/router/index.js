import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
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
      path: '/login',
      component: () => import('../components/LoginView.vue'),
    }
  ],
})

export default router



