import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
})

export const useFriendStore = defineStore('friend', () => {
  const friends = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchFriends = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/friends')

      friends.value = response.data
    } catch (err) {
      console.error('抓取好友列表失敗:', err)
      error.value = err.response?.data?.message || '無法取得好友資訊，請檢查網路連線'
    } finally {
      isLoading.value = false
    }
  }

  return {
    friends,
    isLoading,
    error,
    fetchFriends,
  }
})
