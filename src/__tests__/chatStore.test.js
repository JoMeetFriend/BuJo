import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useChatStore } from '@/stores/chatStore'
import { useAuthStore } from '@/stores/auth'

vi.mock('@/i18n', () => {
  const t = (key) => {
    const map = {
      'chat.sendRateLimit': 'Too fast',
      'chat.sendFailed': 'Failed to send',
      'chat.networkError': 'Network error',
      'chat.fetchFailed': 'Load failed',
    }
    return map[key] || key
  }
  return { default: { global: { t } } }
})

globalThis.fetch = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  useAuthStore().setUser({ id: 'user-1', display_name: 'Alice', avatar_url: '/alice.png' })
})

describe('useChatStore', () => {
  describe('fetchJoinedActivities', () => {
    it('只保留 has_joined 的活動', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          activities: [
            { id: 'a1', has_joined: true, chat_id: 'c1', title: 'A', creator: {} },
            { id: 'a2', has_joined: false, title: 'B', creator: {} },
          ],
        }),
      })
      const store = useChatStore()

      await store.fetchJoinedActivities()

      expect(store.joinedActivities).toHaveLength(1)
      expect(store.joinedActivities[0].id).toBe('a1')
    })

    it('設定 chatRoomMap 讓 addIncomingMessage 能透過 chat_id 找到 activity', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({
          activities: [{ id: 'a1', has_joined: true, chat_id: 'c1', title: 'A', creator: {} }],
        }),
      })
      const store = useChatStore()
      await store.fetchJoinedActivities()

      store.addIncomingMessage({ id: 'm1', sender: { id: 'user-2' }, chat_id: 'c1' })

      expect(store.messages.a1).toHaveLength(1)
      expect(store.messages.a1[0].id).toBe('m1')
    })

    it('API 失敗時不拋錯', async () => {
      fetch.mockRejectedValue(new Error('network error'))
      const store = useChatStore()

      await expect(store.fetchJoinedActivities()).resolves.toBeUndefined()
      expect(store.joinedActivities).toEqual([])
    })
  })

  describe('fetchMessages', () => {
    it('首次載入時反轉訊息順序', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [{ id: 'm1' }, { id: 'm2' }], next_cursor: null }),
      })
      const store = useChatStore()

      await store.fetchMessages('a1')

      expect(store.messages.a1).toHaveLength(2)
      expect(store.messages.a1[0].id).toBe('m2')
      expect(store.messages.a1[1].id).toBe('m1')
    })

    it('載入更多時 prepend 舊訊息', async () => {
      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'm2' }], next_cursor: 'cursor-1' }),
      })
      const store = useChatStore()
      await store.fetchMessages('a1')

      fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ data: [{ id: 'm1' }], next_cursor: null }),
      })
      await store.fetchMessages('a1', { before: 'cursor-1' })

      expect(store.messages.a1).toHaveLength(2)
      expect(store.messages.a1[0].id).toBe('m1')
      expect(store.messages.a1[1].id).toBe('m2')
    })
  })

  describe('sendMessage', () => {
    it('建立 pending 訊息並在成功後取代', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'real-1', content: 'hello', sender: { id: 'user-1' }, created_at: new Date().toISOString() }),
      })
      const store = useChatStore()
      store.messages.a1 = []

      const result = await store.sendMessage('a1', 'hello')

      expect(result).toBe(true)
      expect(store.messages.a1).toHaveLength(1)
      expect(store.messages.a1[0].id).toBe('real-1')
      expect(store.messages.a1[0]._localId).toBeUndefined()
    })

    it('429 時顯示 rate limit 錯誤', async () => {
      fetch.mockResolvedValue({ ok: false, status: 429 })
      const store = useChatStore()
      store.messages.a1 = []

      await store.sendMessage('a1', 'hello')

      const failed = store.messages.a1[0]
      expect(failed._status).toBe('failed')
      expect(failed._error).toBe('Too fast')
    })

    it('非 2xx 時顯示傳送失敗', async () => {
      fetch.mockResolvedValue({ ok: false, status: 500 })
      const store = useChatStore()
      store.messages.a1 = []

      await store.sendMessage('a1', 'hello')

      const failed = store.messages.a1[0]
      expect(failed._status).toBe('failed')
      expect(failed._error).toBe('Failed to send')
    })

    it('網路錯誤時顯示 networkError', async () => {
      fetch.mockRejectedValue(new Error('network'))
      const store = useChatStore()
      store.messages.a1 = []

      await store.sendMessage('a1', 'hello')

      const failed = store.messages.a1[0]
      expect(failed._status).toBe('failed')
      expect(failed._error).toBe('Network error')
    })

    it('isSending 為 true 時略過第二次發送', async () => {
      const store = useChatStore()
      store.isSending = true

      const result = await store.sendMessage('a1', 'hello')

      expect(result).toBe(false)
      expect(fetch).not.toHaveBeenCalled()
    })
  })

  describe('retryMessage', () => {
    it('重送失敗的訊息', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ id: 'real-1', content: 'hello', sender: { id: 'user-1' }, created_at: new Date().toISOString() }),
      })
      const store = useChatStore()
      store.messages.a1 = [{ _localId: 'local-1', _status: 'failed', content: 'hello', sender: { id: 'user-1' } }]

      const result = await store.retryMessage('a1', 'local-1')

      expect(result).toBe(true)
      expect(store.messages.a1[0]._status).toBeUndefined()
      expect(store.messages.a1[0].id).toBe('real-1')
    })
  })

  describe('addIncomingMessage', () => {
    it('不重複加入自己發送的訊息', () => {
      const store = useChatStore()
      store.messages.a1 = []

      store.addIncomingMessage({ id: 'm1', content: 'hi', sender: { id: 'user-1' }, activity_id: 'a1' })

      expect(store.messages.a1).toHaveLength(0)
    })

    it('加入他人的訊息並計算未讀', () => {
      const store = useChatStore()

      store.addIncomingMessage({ id: 'm1', content: 'hi', sender: { id: 'user-2' }, activity_id: 'a1' })

      expect(store.messages.a1).toHaveLength(1)
      expect(store.unreadCounts.a1).toBe(1)
    })

    it('不重複加入相同 id 的訊息', () => {
      const store = useChatStore()
      store.messages.a1 = [{ id: 'm1', content: 'hi', sender: {} }]

      store.addIncomingMessage({ id: 'm1', content: 'hi', sender: { id: 'user-2' }, activity_id: 'a1' })

      expect(store.messages.a1).toHaveLength(1)
    })
  })

  describe('removeRoom', () => {
    it('刪除活動及其相關資料', () => {
      const store = useChatStore()
      store.joinedActivities = [{ id: 'a1', title: 'A' }]
      store.messages.a1 = [{ id: 'm1' }]
      store.unreadCounts.a1 = 3
      store.currentActivityId = 'a1'

      store.removeRoom('a1')

      expect(store.joinedActivities).toHaveLength(0)
      expect(store.messages.a1).toBeUndefined()
      expect(store.currentActivityId).toBeNull()
    })
  })

  describe('selectActivity', () => {
    it('選擇活動時清除未讀並在沒有訊息時 fetch', async () => {
      fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ data: [], next_cursor: null }),
      })
      const store = useChatStore()

      store.selectActivity('a1')

      expect(store.currentActivityId).toBe('a1')
      expect(store.unreadCounts.a1).toBe(0)
      expect(fetch).toHaveBeenCalled()
    })
  })

  describe('totalUnread', () => {
    it('加總所有未讀數', () => {
      const store = useChatStore()
      store.unreadCounts = { a1: 3, a2: 5 }

      expect(store.totalUnread).toBe(8)
    })
  })
})
