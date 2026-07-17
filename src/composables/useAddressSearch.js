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
  const hasSearched = ref(false)

  let abortController = null

  const searchAddress = async (keyword, { global = false } = {}) => {
    const sanitizedKeyword = keyword?.trim() || ''
    if (sanitizedKeyword.length < 2) {
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
      const response = await apiClient.get('/api/places/autocomplete', {
        params: { q: sanitizedKeyword, global: global || undefined },
        signal: abortController.signal,
      })

      searchResults.value = response.data?.results || []
      hasSearched.value = true
    } catch (err) {
      if (axios.isCancel(err)) {
        return
      }
      console.error('地址搜尋失敗:', err)
      error.value = '地址搜尋發生錯誤'
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

  return { searchResults, isSearching, error, hasSearched, searchAddress, clearSearch }
}
