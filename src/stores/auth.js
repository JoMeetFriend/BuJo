import { defineStore } from 'pinia'
import { ref } from 'vue'

const API = import.meta.env.VITE_API_URL

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const initialized = ref(false)

  async function fetchMe() {
    try {
      const res = await fetch(`${API}/api/auth/me`, { credentials: 'include' })
      user.value = res.ok ? (await res.json()).user : null
    } catch {
      user.value = null
    } finally {
      initialized.value = true
    }
  }

  async function logout() {
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' })
    } finally {
      user.value = null
    }
  }

  function setUser(userData) {
    user.value = userData
    initialized.value = true
  }

  function clearUser() {
    user.value = null
  }

  return { user, initialized, fetchMe, logout, setUser, clearUser }
})
