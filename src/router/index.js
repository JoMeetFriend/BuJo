import { createRouter, createWebHistory } from 'vue-router'
import CalendarMain from '../components/CalendarMain.vue'

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
    }
  ],
})

export default router
