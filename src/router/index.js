import { createRouter, createWebHistory } from 'vue-router'
import EventView from '../components/EventView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/event',
      name: 'event',
      component: EventView,
    },
  ],
})

export default router
