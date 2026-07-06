import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { useAuthStore } from '@/stores/auth'

globalThis.fetch = vi.fn()

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('useAuthStore', () => {
  describe('fetchMe', () => {
    it('後端回傳成功時設定 user 並標記 initialized', async () => {
      const user = { id: 'user-1', display_name: 'Alice' }
      fetch.mockResolvedValue({ ok: true, json: async () => ({ user }) })
      const store = useAuthStore()

      await store.fetchMe()

      expect(store.user).toEqual(user)
      expect(store.initialized).toBe(true)
    })

    it('後端回傳非 ok 時 user 為 null', async () => {
      fetch.mockResolvedValue({ ok: false, json: async () => ({}) })
      const store = useAuthStore()

      await store.fetchMe()

      expect(store.user).toBeNull()
      expect(store.initialized).toBe(true)
    })

    it('fetch 拋錯時 user 為 null 且不會往外拋出例外', async () => {
      fetch.mockRejectedValue(new Error('network error'))
      const store = useAuthStore()

      await expect(store.fetchMe()).resolves.toBeUndefined()
      expect(store.user).toBeNull()
      expect(store.initialized).toBe(true)
    })
  })

  describe('logout', () => {
    it('登出成功後清除 user', async () => {
      fetch.mockResolvedValue({ ok: true })
      const store = useAuthStore()
      store.setUser({ id: 'user-1' })

      await store.logout()

      expect(fetch).toHaveBeenCalledWith(
        expect.stringContaining('/api/auth/logout'),
        expect.objectContaining({ method: 'POST', credentials: 'include' }),
      )
      expect(store.user).toBeNull()
    })

    it('登出 API 失敗時仍會清除本地 user 狀態', async () => {
      fetch.mockRejectedValue(new Error('network error'))
      const store = useAuthStore()
      store.setUser({ id: 'user-1' })

      await expect(store.logout()).rejects.toThrow('network error')
      expect(store.user).toBeNull()
    })
  })

  describe('setUser / clearUser', () => {
    it('setUser 會設定 user 並標記 initialized', () => {
      const store = useAuthStore()

      store.setUser({ id: 'user-1' })

      expect(store.user).toEqual({ id: 'user-1' })
      expect(store.initialized).toBe(true)
    })

    it('clearUser 只清除 user，不影響 initialized', () => {
      const store = useAuthStore()
      store.setUser({ id: 'user-1' })

      store.clearUser()

      expect(store.user).toBeNull()
      expect(store.initialized).toBe(true)
    })
  })
})
