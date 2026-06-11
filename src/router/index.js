import { createRouter, createWebHistory } from 'vue-router'
import NotFound from '../components/NotFound.vue'

const routes = [
  {
    path: '/404',
    name: 'not-found-test',
    component: NotFound,
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'not-found',
    component: NotFound,
  },
]

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: routes,
})

export default router
