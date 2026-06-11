import { createRouter, createWebHistory } from 'vue-router'
import FriendsPage from '../components/FriendsPage.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/friends-page',
      name: 'friends-page',
      component: FriendsPage,
    },
  ],
})

export default router
