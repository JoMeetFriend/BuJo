import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const useAuthStore = defineStore('auth', () => {
  const user = ref(JSON.parse(localStorage.getItem('user') || 'null'))

  const isLoggedIn = computed(() => !!user.value)

  function login(userData) {
    user.value = userData
    localStorage.setItem('user', JSON.stringify(userData))
  }

  async function logout() {
    try {
      await fetch(`${import.meta.env.VITE_API_URL}/api/auth/logout`, {
        method: 'POST',
        credentials: 'include',
      })
    } catch {
      // API 失敗仍繼續清除本地狀態
    }
    user.value = null
    localStorage.removeItem('user')
  }

  return { user, isLoggedIn, login, logout }
})

export { useAuthStore }
