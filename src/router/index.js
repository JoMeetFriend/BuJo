import { createRouter, createWebHistory } from 'vue-router'
import CalendarMain from '../components/CalendarMain.vue'
import EventPage from '../components/EventPage.vue'
import ProfileEditPage from '../components/ProfileEditPage.vue'

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
      component: CalendarMain,
    },
    {
      path: '/eventPage',
      name: 'eventPage',
      component: EventPage,
    },
    {
      path: '/profileEditPage',
      name: 'profileEditPage',
      component: ProfileEditPage,
    },

  ],
})

export default router
