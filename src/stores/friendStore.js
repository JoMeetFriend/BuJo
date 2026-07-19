import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'
import i18n from '@/i18n'

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
      error.value = err.response?.data?.message || i18n.global.t('friendStore.fetchFailed')
    } finally {
      isLoading.value = false
    }
  }

  const removeFriend = async (friendshipId) => {
    try {
      await apiClient.delete(`/api/friendships/${friendshipId}`)
      friends.value = friends.value.filter((f) => f.friendship_id !== friendshipId)
      return { success: true }
    } catch (err) {
      console.error('刪除好友失敗:', err)
      return {
        success: false,
        message: err.response?.data?.message || i18n.global.t('friendStore.deleteFailed'),
      }
    }
  }

  const addFriend = async (targetId) => {
    if (!targetId) return { success: false, message: i18n.global.t('friendStore.invalidUser') }
    try {
      await apiClient.post('/api/friendships/request', { receiver_id: targetId })
      return { success: true }
    } catch (err) {
      console.error('發送好友請求失敗:', err)
      const status = err.response?.status
      const message = err.response?.data?.message || i18n.global.t('friendStore.sendFailed')
      return { success: false, status, message }
    }
  }

  return {
    friends,
    isLoading,
    error,
    fetchFriends,
    addFriend,
    removeFriend,
  }
})
