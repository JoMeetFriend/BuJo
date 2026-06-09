import { createRouter, createWebHistory } from 'vue-router'

/*登入頁面*/
import LoginView from "../component/LoginView.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    //登入頁面
    {
      path: '/login',
      component: LoginView
    }
  ],
})

export default router



