import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  withCredentials: true,
})

export const useFriendStore = defineStore('friend', () => {
  const friends = ref([])
  const isLoading = ref(false)
  const error = ref(null)

  const fetchFriends = async () => {
    isLoading.value = true
    error.value = null

    try {
      const response = await apiClient.get('/api/friends')
      const data = response.data
      friends.value = Array.isArray(data) ? data : []
    } catch (err) {
      console.error('抓取好友列表失敗:', err)
      error.value = err.response?.data?.message || '無法取得好友資訊，請檢查網路連線'
    } finally {
      isLoading.value = false
    }
  }

  const addFriend = async (targetId) => {
    if (!targetId) return { success: false, message: '無效的使用者' }
    try {
      await apiClient.post('/api/friends/request', { target_id: targetId })
      return { success: true }
    } catch (err) {
      console.error('發送好友請求失敗:', err)
      const status = err.response?.status
      const message = err.response?.data?.message || '發送失敗，請重試'
      return { success: false, status, message }
    }
  }

  return {
    friends,
    isLoading,
    error,
    fetchFriends,
    addFriend,
  }
})
