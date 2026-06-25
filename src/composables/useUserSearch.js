import { ref } from 'vue'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  timeout: 5000,
  withCredentials: true,
})

export function useUserSearch() {
  const searchResults = ref([])
  const isSearching = ref(false)
  const error = ref(null)

  const searchUsers = async (keyword) => {
    const sanitizedKeyword = keyword?.trim() || ''
    if (!sanitizedKeyword || sanitizedKeyword.length > 50) {
      searchResults.value = []
      return
    }

    isSearching.value = true
    error.value = null

    try {
      const response = await apiClient.get('/api/users/search', {
        params: { q: sanitizedKeyword },
      })

      searchResults.value = (response.data || []).map((user) => ({
        id: String(user.id),
        display_name: String(user.display_name || '未命名'),
        avatar_url: /^https?:\/\//.test(user.avatar_url) ? user.avatar_url : null,
      }))
    } catch (err) {
      console.error('搜尋失敗:', err)
      if (err.response?.status === 401) {
        error.value = '登入已過期，請重新登入'
      } else {
        error.value = '搜尋發生錯誤'
      }
      searchResults.value = []
    } finally {
      isSearching.value = false
    }
  }

  const clearSearch = () => {
    searchResults.value = []
    error.value = null
  }

  return { searchResults, isSearching, error, searchUsers, clearSearch }
}
