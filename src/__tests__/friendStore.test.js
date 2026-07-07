import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import { useFriendStore } from '@/stores/friendStore'

vi.mock('axios', () => {
  const apiClient = { get: vi.fn(), post: vi.fn() }
  return { default: { create: vi.fn(() => apiClient) } }
})

const apiClient = axios.create()

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useFriendStore', () => {
  describe('fetchFriends', () => {
    it('抓取成功時把好友列表寫入 state', async () => {
      apiClient.get.mockResolvedValue({ data: [{ id: 'friend-1' }] })
      const store = useFriendStore()

      await store.fetchFriends()

      expect(apiClient.get).toHaveBeenCalledWith('/api/friends')
      expect(store.friends).toEqual([{ id: 'friend-1' }])
      expect(store.isLoading).toBe(false)
      expect(store.error).toBeNull()
    })

    it('後端回傳非陣列時 friends 保持為空陣列', async () => {
      apiClient.get.mockResolvedValue({ data: null })
      const store = useFriendStore()

      await store.fetchFriends()

      expect(store.friends).toEqual([])
    })

    it('抓取失敗時設定 error 訊息', async () => {
      apiClient.get.mockRejectedValue({ response: { data: { message: '未授權' } } })
      const store = useFriendStore()

      await store.fetchFriends()

      expect(store.error).toBe('未授權')
      expect(store.friends).toEqual([])
      expect(store.isLoading).toBe(false)
    })

    it('抓取失敗且後端沒有回傳訊息時使用預設錯誤訊息', async () => {
      apiClient.get.mockRejectedValue(new Error('network down'))
      const store = useFriendStore()

      await store.fetchFriends()

      expect(store.error).toBe('無法取得好友資訊，請檢查網路連線')
    })
  })

  describe('addFriend', () => {
    it('沒有 targetId 時直接回傳失敗，不呼叫 API', async () => {
      const store = useFriendStore()

      const result = await store.addFriend(null)

      expect(result).toEqual({ success: false, message: '無效的使用者' })
      expect(apiClient.post).not.toHaveBeenCalled()
    })

    it('送出好友邀請成功', async () => {
      apiClient.post.mockResolvedValue({})
      const store = useFriendStore()

      const result = await store.addFriend('user-2')

      expect(apiClient.post).toHaveBeenCalledWith('/api/friendships/request', { receiver_id: 'user-2' })
      expect(result).toEqual({ success: true })
    })

    it('送出好友邀請失敗時回傳後端錯誤訊息與狀態碼', async () => {
      apiClient.post.mockRejectedValue({ response: { status: 409, data: { message: '已經是好友' } } })
      const store = useFriendStore()

      const result = await store.addFriend('user-2')

      expect(result).toEqual({ success: false, status: 409, message: '已經是好友' })
    })
  })
})
