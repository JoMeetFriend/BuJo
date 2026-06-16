import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const useAuthStore = defineStore('auth', () => {
  const token = ref(localStorage.getItem('token') || null)
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))
  
  // 是否已登入
  const isLoggedIn = computed(() => !!token.value)
  
  // 登入（存 token 和使用者資料）
  function login(newToken, userData) {
    token.value = newToken
    user.value = userData
    // 存到 localStorage，這樣重新整理頁面還是登入狀態
    localStorage.setItem('token', newToken)
    localStorage.setItem('user', JSON.stringify(userData))
  }
  
  // 登出
  function logout() {
    token.value = null
    user.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
  }
  
  return { token, user, isLoggedIn, login, logout }
})

export { useAuthStore }