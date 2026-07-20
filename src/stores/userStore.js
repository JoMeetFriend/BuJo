import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useAuthStore } from './auth'
import i18n from '@/i18n'

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
      showError(i18n.global.t('userStore.nameEmpty'))
      return false
    }
    if (trimmedName.length > 50) {
      showError(i18n.global.t('userStore.nameTooLong'))
      return false
    }
    if (trimmedName === authStore.user?.display_name) {
      showError(i18n.global.t('userStore.nameUnchanged'))
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
      if (!res.ok) throw new Error(data.message || i18n.global.t('userStore.nameUpdateFailed'))

      authStore.setUser({
        ...authStore.user,
        ...data.user,
      })
      successMsg.value = i18n.global.t('userStore.nameUpdateSuccess')
      return true
    } catch (err) {
      let errorMessage = err.message

      if (errorMessage === 'Failed to fetch' || errorMessage === 'Network request failed') {
        errorMessage = i18n.global.t('common.networkError')
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
      return { success: false, error: i18n.global.t('userStore.bioTooLong') }
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
      if (!res.ok) throw new Error(data.message || i18n.global.t('userStore.bioUpdateFailed'))

      authStore.setUser({
        ...authStore.user,
        ...data.user,
      })

      return { success: true }
    } catch (err) {
      let errorMessage = err.message

      if (errorMessage === 'Failed to fetch' || errorMessage === 'Network request failed') {
        errorMessage = i18n.global.t('common.networkError')
      }

      return { success: false, error: errorMessage }
    }
  }

  return { isLoading, errorMsg, successMsg, updateName, updateBio }
})
