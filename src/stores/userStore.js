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
      errorMsg.value = err.message
      return false
    } finally {
      isLoading.value = false
      setTimeout(() => {
        successMsg.value = ''
        errorMsg.value = ''
      }, 4000)
    }
  }

  return { isLoading, errorMsg, successMsg, updateName }
})
