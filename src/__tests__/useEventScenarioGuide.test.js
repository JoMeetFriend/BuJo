import { computed, ref } from 'vue'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  EVENT_SCENARIO_GUIDE_SEEN_VALUE,
  getEventScenarioGuideKey,
  useEventScenarioGuide,
} from '@/composables/useEventScenarioGuide'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  }
}

describe('useEventScenarioGuide', () => {
  afterEach(() => {
    document.body.innerHTML = ''
    document.body.className = ''
  })

  test('使用獨立版本化 per-user key，跟 app tour 的 key 不會互相影響', () => {
    const storage = createStorage()
    const guide = useEventScenarioGuide(ref('user-123'), { storage })

    expect(guide.storageKey.value).toBe('bujo:event-scenario-guide:v1:user-123')
    expect(guide.hasSeenGuide.value).toBe(false)
  })

  test('markSeen 寫入 seen 值並立即反映在 hasSeenGuide', () => {
    const storage = createStorage()
    const guide = useEventScenarioGuide(ref('user-123'), { storage })

    guide.markSeen()

    expect(storage.setItem).toHaveBeenCalledWith(
      'bujo:event-scenario-guide:v1:user-123',
      EVENT_SCENARIO_GUIDE_SEEN_VALUE,
    )
    expect(guide.hasSeenGuide.value).toBe(true)
  })

  test('已存在 seen 值或沒有 user ID 時 hasSeenGuide 反映對應狀態', () => {
    const key = getEventScenarioGuideKey('user-123')
    const storage = createStorage({ [key]: EVENT_SCENARIO_GUIDE_SEEN_VALUE })

    expect(useEventScenarioGuide(ref('user-123'), { storage }).hasSeenGuide.value).toBe(true)
    expect(useEventScenarioGuide(ref(null), { storage }).hasSeenGuide.value).toBe(false)
  })

  test('同裝置不同 user ID 使用各自的 key', () => {
    const userId = ref('user-123')
    const storage = createStorage()
    const guide = useEventScenarioGuide(
      computed(() => userId.value),
      { storage },
    )

    guide.markSeen()
    expect(guide.hasSeenGuide.value).toBe(true)

    userId.value = 'user-456'
    expect(guide.storageKey.value).toBe('bujo:event-scenario-guide:v1:user-456')
    expect(guide.hasSeenGuide.value).toBe(false)
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
    const guide = useEventScenarioGuide(ref('user-123'), { storage })

    expect(() => guide.hasSeenGuide.value).not.toThrow()
    expect(guide.hasSeenGuide.value).toBe(false)
    expect(() => guide.markSeen()).not.toThrow()
  })

  describe('startGuide', () => {
    test('有對應錨點時可以正常啟動說明', () => {
      const anchor = document.createElement('div')
      anchor.setAttribute('data-tour', 'event-scenario-block')
      document.body.appendChild(anchor)

      const guide = useEventScenarioGuide(ref('user-123'), { storage: createStorage() })

      expect(() => guide.startGuide()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('找不到錨點時不拋錯', () => {
      const guide = useEventScenarioGuide(ref('user-123'), { storage: createStorage() })

      expect(() => guide.startGuide()).not.toThrow()
    })
  })
})
