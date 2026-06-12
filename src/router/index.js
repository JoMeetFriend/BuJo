import { createRouter, createWebHistory } from 'vue-router'

/*登入頁面*/
import LoginView from "../components/LoginView.vue"
/*註冊頁面*/
import RegisterViews from "../components/RegisterViews.vue"

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    //登入頁面
    {
      path: '/login',
      component: LoginView
    },
    //註冊頁面
    {
      path: '/register',
      component: RegisterViews
    }
  ],
})

export default router



