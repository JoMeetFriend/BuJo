import { ref } from 'vue'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  withCredentials: true,
})

export function useAddressSearch() {
  const searchResults = ref([])
  const isSearching = ref(false)
  const error = ref(null)

  let abortController = null

  const searchAddress = async (keyword) => {
    const sanitizedKeyword = keyword?.trim() || ''
    if (sanitizedKeyword.length < 2) {
      if (abortController) abortController.abort()
      searchResults.value = []
      return
    }

    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()
    const thisController = abortController

    isSearching.value = true
    error.value = null

    try {
      const response = await apiClient.get('/api/places/autocomplete', {
        params: { q: sanitizedKeyword },
        signal: abortController.signal,
      })

      searchResults.value = response.data?.results || []
    } catch (err) {
      if (axios.isCancel(err)) {
        return
      }
      console.error('地址搜尋失敗:', err)
      error.value = '地址搜尋發生錯誤'
      searchResults.value = []
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
  }

  return { searchResults, isSearching, error, searchAddress, clearSearch }
}
