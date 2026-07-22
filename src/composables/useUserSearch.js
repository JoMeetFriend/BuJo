import { ref } from 'vue'
import axios from 'axios'
import i18n from '@/i18n'
import { apiClient } from '@/services/httpClient'

export function useUserSearch() {
  const searchResults = ref([])
  const isSearching = ref(false)
  const error = ref(null)
  const hasSearched = ref(false)

  let abortController = null

  const searchUsers = async (keyword) => {
    const sanitizedKeyword = keyword?.trim() || ''
    if (sanitizedKeyword.length !== 5 || !/^[a-f0-9]{5}$/.test(sanitizedKeyword)) {
      if (abortController) abortController.abort()
      searchResults.value = []
      hasSearched.value = false
      return
    }

    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()
    const thisController = abortController

    isSearching.value = true
    error.value = null
    hasSearched.value = false

    try {
      const response = await apiClient.get('/api/users/search', {
        params: { q: sanitizedKeyword },
        signal: abortController.signal,
      })

      searchResults.value = (response.data || []).map((user) => ({
        id: String(user.id),
        display_name: String(user.display_name || i18n.global.t('common.unnamed')),
        avatar_url: /^https?:\/\//.test(user.avatar_url) ? user.avatar_url : null,
      }))

      hasSearched.value = true
    } catch (err) {
      if (axios.isCancel(err)) {
        return
      }
      console.error('搜尋失敗:', err)
      if (err.response?.status === 401) {
        error.value = i18n.global.t('composable.userSearchExpired')
      } else {
        error.value = i18n.global.t('composable.userSearchError')
      }
      searchResults.value = []
      hasSearched.value = true
    } finally {
      if (thisController === abortController) {
        isSearching.value = false
      }
    }
  }

  const clearSearch = () => {
    if (abortController) abortController.abort()
    searchResults.value = []
    isSearching.value = false
    error.value = null
    hasSearched.value = false
  }

  return { searchResults, isSearching, error, hasSearched, searchUsers, clearSearch }
}
