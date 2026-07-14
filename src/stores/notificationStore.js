import { ref } from 'vue'
import { defineStore } from 'pinia'
import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  timeout: 5000,
  withCredentials: true,
})

export const useNotificationStore = defineStore('notification', () => {
  const unreadCount = ref(0)

  const fetchUnreadCount = async () => {
    try {
      const response = await apiClient.get('/api/notifications/unread-count')
      const count = Number(response.data?.unreadCount)
      setUnreadCount(Number.isFinite(count) ? count : 0)
    } catch (err) {
      console.error('取得未讀通知數失敗:', err)
    }
  }

  const setUnreadCount = (count) => {
    unreadCount.value = Math.max(0, count)
  }

  return {
    unreadCount,
    fetchUnreadCount,
    setUnreadCount,
  }
})
