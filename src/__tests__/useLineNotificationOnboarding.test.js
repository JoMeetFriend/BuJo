import { computed, ref } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import {
  LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY,
  LINE_NOTIFICATION_ONBOARDING_SEEN_VALUE,
  consumeLineNotificationOnboardingReturnPath,
  getLineNotificationOnboardingKey,
  rememberLineNotificationOnboardingReturnPath,
  useLineNotificationOnboarding,
} from '@/composables/useLineNotificationOnboarding'

function createStorage(initial = {}) {
  const values = new Map(Object.entries(initial))
  return {
    getItem: vi.fn((key) => values.get(key) ?? null),
    setItem: vi.fn((key, value) => values.set(key, value)),
    removeItem: vi.fn((key) => values.delete(key)),
  }
}

describe('useLineNotificationOnboarding', () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  test('使用版本化 per-user key，完成後寫入 seen 並立即停止顯示', () => {
    const storage = createStorage()
    const onboarding = useLineNotificationOnboarding(ref('user-123'), { storage })

    expect(onboarding.storageKey.value).toBe('bujo:line-notification-guide:v1:user-123')
    expect(onboarding.shouldShow.value).toBe(true)

    onboarding.markSeen()

    expect(storage.setItem).toHaveBeenCalledWith(
      'bujo:line-notification-guide:v1:user-123',
      LINE_NOTIFICATION_ONBOARDING_SEEN_VALUE,
    )
    expect(onboarding.shouldShow.value).toBe(false)
  })

  test('已存在 seen 值或沒有 user ID 時不顯示', () => {
    const key = getLineNotificationOnboardingKey('user-123')
    const storage = createStorage({ [key]: 'seen' })

    expect(useLineNotificationOnboarding(ref('user-123'), { storage }).shouldShow.value).toBe(false)
    expect(useLineNotificationOnboarding(ref(null), { storage }).shouldShow.value).toBe(false)
  })

  test('同裝置不同 user ID 使用各自的 key', () => {
    const userId = ref('user-123')
    const storage = createStorage()
    const onboarding = useLineNotificationOnboarding(
      computed(() => userId.value),
      { storage },
    )

    onboarding.markSeen()
    expect(onboarding.shouldShow.value).toBe(false)

    userId.value = 'user-456'
    expect(onboarding.storageKey.value).toBe('bujo:line-notification-guide:v1:user-456')
    expect(onboarding.shouldShow.value).toBe(true)
  })

  test('localStorage 讀寫拋錯時不崩潰並以目前 session 去重', () => {
    const storage = {
      getItem: vi.fn(() => {
        throw new Error('SecurityError')
      }),
      setItem: vi.fn(() => {
        throw new Error('QuotaExceededError')
      }),
    }
    const onboarding = useLineNotificationOnboarding(ref('user-123'), {
      storage,
      handledUserIds: new Set(),
    })

    expect(() => onboarding.shouldShow.value).not.toThrow()
    expect(onboarding.shouldShow.value).toBe(true)
    expect(() => onboarding.markSeen()).not.toThrow()
    expect(onboarding.shouldShow.value).toBe(false)
  })

  test('動作完成前 markSeen 可同步更新狀態', () => {
    const onboarding = useLineNotificationOnboarding(ref('user-123'), {
      storage: createStorage(),
    })
    const observations = []

    onboarding.markSeen()
    observations.push(onboarding.shouldShow.value)

    expect(observations).toEqual([false])
  })

  test('OAuth 前暫存站內返回頁，callback 後讀取並清除', () => {
    const storage = createStorage()

    rememberLineNotificationOnboardingReturnPath('/calendar?view=month', storage)

    expect(storage.setItem).toHaveBeenCalledWith(
      LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY,
      '/calendar?view=month',
    )
    expect(consumeLineNotificationOnboardingReturnPath(storage)).toBe('/calendar?view=month')
    expect(storage.removeItem).toHaveBeenCalledWith(LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY)
    expect(consumeLineNotificationOnboardingReturnPath(storage)).toBe('')
  })

  test('不接受外部或 malformed 返回路徑', () => {
    const storage = createStorage({
      [LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY]: '//example.com/phishing',
    })

    rememberLineNotificationOnboardingReturnPath('https://example.com', storage)

    expect(storage.setItem).not.toHaveBeenCalled()
    expect(consumeLineNotificationOnboardingReturnPath(storage)).toBe('')
  })
})
