import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'

const API = import.meta.env.VITE_API_URL

export const useUserStore = defineStore('userAction', () => {
  const authStore = useAuthStore()
  const isLoading = ref(false)
  const errorMsg = ref('')
  const successMsg = ref('')

  const updateName = async (newName) => {
    const showError = (msg) => {
      errorMsg.value = msg
      setTimeout(() => {
        errorMsg.value = ''
      }, 4000)
    }

    const trimmedName = newName.trim()
    if (!trimmedName) {
      showError('顯示名稱不可為空白')
      return false
    }
    if (trimmedName.length > 50) {
      showError('顯示名稱不可超過 50 個字元')
      return false
    }
    if (trimmedName === authStore.user?.display_name) {
      showError('名稱未變更')
      return false
    }

    isLoading.value = true
    errorMsg.value = ''
    successMsg.value = ''

    try {
      const res = await fetch(`${API}/api/users/me/name`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ display_name: trimmedName }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || '名稱更新失敗')

      authStore.setUser({
        ...authStore.user,
        ...data.user,
      })
      successMsg.value = '名稱更新成功'
      return true
    } catch (err) {
      let errorMessage = err.message

      if (errorMessage === 'Failed to fetch' || errorMessage === 'Network request failed') {
        errorMessage = '網路連線異常，請檢查您的網路或稍後再試。'
      }

      errorMsg.value = errorMessage
      return false
    } finally {
      isLoading.value = false
      setTimeout(() => {
        successMsg.value = ''
        errorMsg.value = ''
      }, 4000)
    }
  }

  const updateBio = async (newBio) => {
    const trimmedBio = newBio ? newBio.trim() : ''

    if (trimmedBio.length > 150) {
      return { success: false, error: '簡介不可超過 150 個字元' }
    }

    if (trimmedBio === (authStore.user?.bio || '')) {
      return { success: true }
    }

    try {
      const res = await fetch(`${API}/api/users/me/bio`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ bio: trimmedBio }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.message || '簡介更新失敗')

      authStore.setUser({
        ...authStore.user,
        ...data.user,
      })

      return { success: true }
    } catch (err) {
      let errorMessage = err.message

      if (errorMessage === 'Failed to fetch' || errorMessage === 'Network request failed') {
        errorMessage = '網路連線異常，請檢查您的網路或稍後再試。'
      }

      return { success: false, error: errorMessage }
    }
  }

  return { isLoading, errorMsg, successMsg, updateName, updateBio }
})
