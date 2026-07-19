import { computed, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import { APP_TOUR_SEEN_VALUE, getAppTourKey, useAppTour } from '@/composables/useAppTour'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  }
}

describe('useAppTour', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.className = ''
  })

  test('使用版本化 per-user key，尚未看過時 hasSeenTour 為 false', () => {
    const storage = createStorage()
    const tour = useAppTour(ref('user-123'), { storage })

    expect(tour.storageKey.value).toBe('bujo:app-tour:v1:user-123')
    expect(tour.hasSeenTour.value).toBe(false)
  })

  test('markSeen 寫入 seen 值並立即反映在 hasSeenTour', () => {
    const storage = createStorage()
    const tour = useAppTour(ref('user-123'), { storage })

    tour.markSeen()

    expect(storage.setItem).toHaveBeenCalledWith('bujo:app-tour:v1:user-123', APP_TOUR_SEEN_VALUE)
    expect(tour.hasSeenTour.value).toBe(true)
  })

  test('已存在 seen 值或沒有 user ID 時 hasSeenTour 反映對應狀態', () => {
    const key = getAppTourKey('user-123')
    const storage = createStorage({ [key]: APP_TOUR_SEEN_VALUE })

    expect(useAppTour(ref('user-123'), { storage }).hasSeenTour.value).toBe(true)
    expect(useAppTour(ref(null), { storage }).hasSeenTour.value).toBe(false)
  })

  test('同裝置不同 user ID 使用各自的 key', () => {
    const userId = ref('user-123')
    const storage = createStorage()
    const tour = useAppTour(
      computed(() => userId.value),
      { storage },
    )

    tour.markSeen()
    expect(tour.hasSeenTour.value).toBe(true)

    userId.value = 'user-456'
    expect(tour.storageKey.value).toBe('bujo:app-tour:v1:user-456')
    expect(tour.hasSeenTour.value).toBe(false)
  })

  test('localStorage 讀寫拋錯時不崩潰', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError')
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError')
      }),
    }
    const tour = useAppTour(ref('user-123'), { storage })

    expect(() => tour.hasSeenTour.value).not.toThrow()
    expect(tour.hasSeenTour.value).toBe(false)
    expect(() => tour.markSeen()).not.toThrow()
  })

  describe('startTour', () => {
    beforeEach(() => {
      ;['calendar', 'activity', 'friends', 'alerts', 'profile'].forEach((key) => {
        const el = document.createElement('button')
        el.setAttribute('data-tour', `nav-${key}`)
        document.body.appendChild(el)
      })
      const todayCell = document.createElement('div')
      todayCell.setAttribute('data-tour', 'calendar-today-cell')
      document.body.appendChild(todayCell)
    })

    test('五大區塊與行事曆成團說明都有對應錨點時可以正常啟動導覽', () => {
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTour()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('找不到任何錨點時不拋錯', () => {
      document.body.innerHTML = ''
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTour()).not.toThrow()
    })
  })
})
