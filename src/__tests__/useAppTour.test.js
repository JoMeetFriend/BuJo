import { computed, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  APP_TOUR_SEEN_VALUE,
  buildDriveSteps,
  getAppTourKey,
  useAppTour,
} from '@/composables/useAppTour'

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

  describe('buildDriveSteps 跨頁導覽', () => {
    test('朋友步驟的下一步會先呼叫 navigate 切到朋友頁面，再前進到下一步', async () => {
      const navigate = vi.fn().mockResolvedValue(undefined)
      const moveNext = vi.fn()
      const steps = buildDriveSteps(navigate)
      const friendsStep = steps.find((step) => step.popover.title === '朋友')

      await friendsStep.popover.onNextClick(undefined, friendsStep, { driver: { moveNext } })

      expect(navigate).toHaveBeenCalledWith('/friends-page')
      expect(moveNext).toHaveBeenCalledTimes(1)
      expect(navigate.mock.invocationCallOrder[0]).toBeLessThan(
        moveNext.mock.invocationCallOrder[0],
      )
    })

    test('沒有提供 navigate 時，朋友步驟仍會直接前進，不會卡住', async () => {
      const moveNext = vi.fn()
      const steps = buildDriveSteps()
      const friendsStep = steps.find((step) => step.popover.title === '朋友')

      await friendsStep.popover.onNextClick(undefined, friendsStep, { driver: { moveNext } })

      expect(moveNext).toHaveBeenCalledTimes(1)
    })

    test('加好友步驟設定 waitForElement，等待朋友頁面渲染完成', () => {
      const steps = buildDriveSteps()
      const addFriendStep = steps.find((step) => step.popover.title === '加好友')

      expect(addFriendStep.waitForElement).toBe(1500)
      expect(addFriendStep.popover.description).toBe('輸入朋友的 BuJo ID 來交朋友吧！')
    })

    test('其餘步驟不會意外帶有頁面切換邏輯', () => {
      const steps = buildDriveSteps(vi.fn())
      const stepsWithoutNav = steps.filter((step) => step.popover.title !== '朋友')

      stepsWithoutNav.forEach((step) => {
        expect(step.popover.onNextClick).toBeUndefined()
      })
    })
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
      const createButton = document.createElement('button')
      createButton.setAttribute('data-tour', 'calendar-create-button')
      document.body.appendChild(createButton)
      const addFriendButton = document.createElement('button')
      addFriendButton.setAttribute('data-tour', 'friend-add-button')
      document.body.appendChild(addFriendButton)
    })

    test('五大區塊與行事曆成團說明都有對應錨點時可以正常啟動導覽', () => {
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTour()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('找不到任何錨點時不拋錯', () => {
      vi.useFakeTimers()
      document.body.innerHTML = ''
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTour()).not.toThrow()

      // 加好友步驟設有 waitForElement，找不到錨點時會等待後才放棄；把時間快轉完，
      // 避免遺留的 setTimeout 在測試結束、jsdom 環境清掉後才觸發而噴出例外。
      vi.advanceTimersByTime(1600)
      vi.useRealTimers()
    })
  })
})
