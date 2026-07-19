import { computed, ref } from 'vue'
import { afterEach, describe, expect, test, vi } from 'vitest'
import {
  EVENT_SCENARIO_GUIDE_SEEN_VALUE,
  buildGuideSteps,
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

  test('key 帶情境代號，跟 app tour 的 key 不會互相影響', () => {
    const storage = createStorage()
    const guide = useEventScenarioGuide(ref('user-123'), ref('a'), { storage })

    expect(guide.storageKey.value).toBe('bujo:event-scenario-guide:v1:user-123:a')
    expect(guide.hasSeenGuide.value).toBe(false)
  })

  test('markSeen 寫入 seen 值並立即反映在 hasSeenGuide', () => {
    const storage = createStorage()
    const guide = useEventScenarioGuide(ref('user-123'), ref('a'), { storage })

    guide.markSeen()

    expect(storage.setItem).toHaveBeenCalledWith(
      'bujo:event-scenario-guide:v1:user-123:a',
      EVENT_SCENARIO_GUIDE_SEEN_VALUE,
    )
    expect(guide.hasSeenGuide.value).toBe(true)
  })

  test('已存在 seen 值或沒有 user ID 時 hasSeenGuide 反映對應狀態', () => {
    const key = getEventScenarioGuideKey('user-123', 'a')
    const storage = createStorage({ [key]: EVENT_SCENARIO_GUIDE_SEEN_VALUE })

    expect(useEventScenarioGuide(ref('user-123'), ref('a'), { storage }).hasSeenGuide.value).toBe(
      true,
    )
    expect(useEventScenarioGuide(ref(null), ref('a'), { storage }).hasSeenGuide.value).toBe(false)
  })

  test('同裝置不同 user ID 使用各自的 key', () => {
    const userId = ref('user-123')
    const storage = createStorage()
    const guide = useEventScenarioGuide(
      computed(() => userId.value),
      ref('a'),
      { storage },
    )

    guide.markSeen()
    expect(guide.hasSeenGuide.value).toBe(true)

    userId.value = 'user-456'
    expect(guide.storageKey.value).toBe('bujo:event-scenario-guide:v1:user-456:a')
    expect(guide.hasSeenGuide.value).toBe(false)
  })

  test('同一個使用者，看過情境一不代表看過情境二——各情境獨立追蹤', () => {
    const userId = ref('user-123')
    const scenarioKey = ref('a')
    const storage = createStorage()
    const guide = useEventScenarioGuide(userId, scenarioKey, { storage })

    guide.markSeen()
    expect(guide.hasSeenGuide.value).toBe(true)

    scenarioKey.value = 'b'
    expect(guide.storageKey.value).toBe('bujo:event-scenario-guide:v1:user-123:b')
    expect(guide.hasSeenGuide.value).toBe(false)

    scenarioKey.value = 'a'
    expect(guide.hasSeenGuide.value).toBe(true)
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
    const guide = useEventScenarioGuide(ref('user-123'), ref('a'), { storage })

    expect(() => guide.hasSeenGuide.value).not.toThrow()
    expect(guide.hasSeenGuide.value).toBe(false)
    expect(() => guide.markSeen()).not.toThrow()
  })

  describe('startGuide', () => {
    test('有對應錨點時可以正常啟動說明（情境一）', () => {
      ;['event-scenario-toggles', 'event-deadline-block', 'event-deadline-offset-button'].forEach(
        (selector) => {
          const anchor = document.createElement('button')
          anchor.setAttribute('data-tour', selector)
          document.body.appendChild(anchor)
        },
      )

      const guide = useEventScenarioGuide(ref('user-123'), ref('a'), { storage: createStorage() })

      expect(() => guide.startGuide()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('有對應錨點時可以正常啟動說明（情境二，含可投票時段錨點）', () => {
      ;[
        'event-scenario-toggles',
        'event-time-window',
        'event-deadline-block',
        'event-deadline-offset-button',
      ].forEach((selector) => {
        const anchor = document.createElement('button')
        anchor.setAttribute('data-tour', selector)
        document.body.appendChild(anchor)
      })

      const guide = useEventScenarioGuide(ref('user-123'), ref('b'), { storage: createStorage() })

      expect(() => guide.startGuide()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('有對應錨點時可以正常啟動說明（情境三，含候選日期錨點）', () => {
      ;[
        'event-scenario-toggles',
        'event-candidate-dates',
        'event-deadline-block',
        'event-deadline-offset-button',
      ].forEach((selector) => {
        const anchor = document.createElement('button')
        anchor.setAttribute('data-tour', selector)
        document.body.appendChild(anchor)
      })

      const guide = useEventScenarioGuide(ref('user-123'), ref('c'), { storage: createStorage() })

      expect(() => guide.startGuide()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('找不到錨點時不拋錯', () => {
      const guide = useEventScenarioGuide(ref('user-123'), ref('a'), { storage: createStorage() })

      expect(() => guide.startGuide()).not.toThrow()
    })

    test('連續呼叫 startGuide 會先關掉前一個，不會疊出兩層 popover', () => {
      const anchor = document.createElement('button')
      anchor.setAttribute('data-tour', 'event-scenario-toggles')
      document.body.appendChild(anchor)

      const guide = useEventScenarioGuide(ref('user-123'), ref('a'), { storage: createStorage() })

      guide.startGuide()
      guide.startGuide()

      expect(document.querySelectorAll('.driver-popover').length).toBe(1)
    })
  })

  describe('buildGuideSteps', () => {
    test('情境一只講開關區塊，情境二多了可投票時段、情境三多了候選日期', () => {
      const scenarioASteps = buildGuideSteps('a')
      const scenarioBSteps = buildGuideSteps('b')
      const scenarioCSteps = buildGuideSteps('c')

      expect(scenarioASteps.some((step) => step.popover.title === '可投票時段')).toBe(false)
      expect(scenarioBSteps.some((step) => step.popover.title === '可投票時段')).toBe(true)
      expect(scenarioCSteps.some((step) => step.popover.title === '候選日期')).toBe(true)
      expect(scenarioCSteps.some((step) => step.popover.title === '可投票時段')).toBe(false)
    })

    test('報名截止與成團確認、報名截止時間這兩步，所有情境都共用', () => {
      ;['a', 'b', 'c'].forEach((scenarioKey) => {
        const steps = buildGuideSteps(scenarioKey)
        const titles = steps.map((step) => step.popover.title)

        expect(titles).toContain('報名截止與成團確認')
        expect(titles).toContain('報名截止時間')
      })
    })

    test('報名截止時間步驟會在顯示前展開截止時間選單', () => {
      const openDeadlineEditor = vi.fn()
      const steps = buildGuideSteps('a', openDeadlineEditor)
      const offsetStep = steps.find((step) => step.popover.title === '報名截止時間')

      expect(offsetStep.onHighlightStarted).toBeTypeOf('function')
      offsetStep.onHighlightStarted()

      expect(openDeadlineEditor).toHaveBeenCalledTimes(1)
    })

    test('沒有提供 openDeadlineEditor 時不會拋錯', () => {
      const steps = buildGuideSteps('a')
      const offsetStep = steps.find((step) => step.popover.title === '報名截止時間')

      expect(() => offsetStep.onHighlightStarted()).not.toThrow()
    })

    test('其餘步驟不會意外帶有展開選單的邏輯', () => {
      const steps = buildGuideSteps('a', vi.fn())
      const otherSteps = steps.filter((step) => step.popover.title !== '報名截止時間')

      otherSteps.forEach((step) => {
        expect(step.onHighlightStarted).toBeUndefined()
      })
    })

    test('未知情境代號會退回情境一的開場步驟', () => {
      const steps = buildGuideSteps('unknown-scenario')

      expect(steps.some((step) => step.popover.title === '可投票時段')).toBe(false)
    })
  })
})
