import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { useNotificationStore } from '@/stores/notificationStore'

vi.mock('axios', () => {
  const apiClient = { get: vi.fn(), interceptors: { request: { use: vi.fn() } } }
  return { default: { create: vi.fn(() => apiClient) } }
})

const apiClient = axios.create()

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useNotificationStore', () => {
  describe('fetchUnreadCount', () => {
    it('抓取成功時以專用端點的 unreadCount 更新未讀數', async () => {
      apiClient.get.mockResolvedValue({ data: { unreadCount: 2 } })
      const store = useNotificationStore()

      await store.fetchUnreadCount()

      expect(apiClient.get).toHaveBeenCalledWith('/api/notifications/unread-count')
      expect(store.unreadCount).toBe(2)
    })

    it('後端回應格式異常時未讀數為 0', async () => {
      apiClient.get.mockResolvedValue({ data: null })
      const store = useNotificationStore()
      store.setUnreadCount(3)

      await store.fetchUnreadCount()

      expect(store.unreadCount).toBe(0)
    })

    it('抓取失敗時保留原本的未讀數', async () => {
      apiClient.get.mockRejectedValue(new Error('network down'))
      const store = useNotificationStore()
      store.setUnreadCount(3)

      await store.fetchUnreadCount()

      expect(store.unreadCount).toBe(3)
    })
  })

  describe('setUnreadCount', () => {
    it('可以直接覆寫未讀數', () => {
      const store = useNotificationStore()

      store.setUnreadCount(5)

      expect(store.unreadCount).toBe(5)
    })

    it('未讀數不會低於 0', () => {
      const store = useNotificationStore()

      store.setUnreadCount(-1)

      expect(store.unreadCount).toBe(0)
    })
  })
})
