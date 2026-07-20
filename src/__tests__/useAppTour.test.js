import { computed, ref } from 'vue'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import {
  APP_TOUR_SEEN_VALUE,
  buildDriveSteps,
  getAppTourKey,
  useAppTour,
} from '@/composables/useAppTour'

const tourLabels = {
  'tour.calendarTitle': '行事曆',
  'tour.calendarDesc': '在這裡查看所有揪團跟活動的時間安排，一眼掌握你的行程。',
  'tour.todayCellTitle': '只顯示已成團的活動',
  'tour.todayCellDesc':
    '行事曆只顯示已成團的活動——招募中／投票中的活動即使有候選日期，也不會出現在月曆上，必須由建立者手動確認成團。',
  'tour.activityTitle': '活動',
  'tour.activityDesc': '瀏覽你發起或參加的活動列表，掌握每個活動的最新狀態。',
  'tour.createButtonTitle': '新增活動',
  'tour.createButtonDesc':
    '點這裡新增活動。<br>點行事曆格子新增活動會自動帶入日期。<br>活動頁也一樣的入口可以新增活動。',
  'tour.scenarioGuideTitle': '活動情境說明',
  'tour.scenarioGuideDesc': '建立活動有四種情境：選擇日期 × 時段後，點「？」可以查看相關導覽。',
  'tour.friendsTitle': '朋友',
  'tour.friendsDesc': '管理好友名單、傳送邀請，找到一起揪團的夥伴。',
  'tour.addFriendTitle': '加好友',
  'tour.addFriendDesc': '輸入朋友的 BuJo ID 來交朋友吧！',
  'tour.alertsTitle': '通知',
  'tour.alertsDesc': '加好友、揪團邀請、活動更新都會出現在這裡，別錯過重要訊息。',
  'tour.profileTitle': '個人設定',
  'tour.profileDesc': '編輯顯示名稱、大頭貼，還可以連動 LINE 通知。',
  'tour.prevBtn': '上一步',
  'tour.nextBtn': '下一步',
  'tour.doneBtn': '完成',
  'tour.skipBtn': '跳過導覽',
}
function mockT(key) {
  return tourLabels[key] ?? key
}

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
      const steps = buildDriveSteps(mockT, navigate)
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
      const steps = buildDriveSteps(mockT)
      const friendsStep = steps.find((step) => step.popover.title === '朋友')

      await friendsStep.popover.onNextClick(undefined, friendsStep, { driver: { moveNext } })

      expect(moveNext).toHaveBeenCalledTimes(1)
    })

    test('加好友步驟設定 waitForElement，等待朋友頁面渲染完成', () => {
      const steps = buildDriveSteps(mockT)
      const addFriendStep = steps.find((step) => step.popover.title === '加好友')

      expect(addFriendStep.waitForElement).toBe(1500)
      expect(addFriendStep.popover.description).toBe('輸入朋友的 BuJo ID 來交朋友吧！')
    })

    test('其餘步驟不會意外帶有頁面切換邏輯', () => {
      const steps = buildDriveSteps(mockT, vi.fn())
      const stepsWithoutNav = steps.filter(
        (step) => !['朋友', '新增活動'].includes(step.popover.title),
      )

      stepsWithoutNav.forEach((step) => {
        expect(step.popover.onNextClick).toBeUndefined()
      })
    })
  })

  describe('buildDriveSteps 新增活動彈窗', () => {
    test('新增活動步驟的下一步會點擊當前元素開啟彈窗，並先標記情境一導覽已看過', async () => {
      const onSuppressEventScenarioGuide = vi.fn()
      const moveNext = vi.fn()
      const element = { click: vi.fn() }
      const steps = buildDriveSteps(mockT, undefined, onSuppressEventScenarioGuide)
      const createStep = steps.find((step) => step.popover.title === '新增活動')

      await createStep.popover.onNextClick(element, createStep, { driver: { moveNext } })

      expect(onSuppressEventScenarioGuide).toHaveBeenCalledTimes(1)
      expect(element.click).toHaveBeenCalledTimes(1)
      expect(moveNext).toHaveBeenCalledTimes(1)
      expect(onSuppressEventScenarioGuide.mock.invocationCallOrder[0]).toBeLessThan(
        element.click.mock.invocationCallOrder[0],
      )
    })

    test('沒有提供 onSuppressEventScenarioGuide 時，新增活動步驟仍會正常點擊並前進', async () => {
      const moveNext = vi.fn()
      const element = { click: vi.fn() }
      const steps = buildDriveSteps(mockT)
      const createStep = steps.find((step) => step.popover.title === '新增活動')

      await expect(
        createStep.popover.onNextClick(element, createStep, { driver: { moveNext } }),
      ).resolves.toBeUndefined()

      expect(element.click).toHaveBeenCalledTimes(1)
      expect(moveNext).toHaveBeenCalledTimes(1)
    })

    test('活動情境說明步驟設定 waitForElement，等待彈窗渲染完成', () => {
      const steps = buildDriveSteps(mockT)
      const guideStep = steps.find((step) => step.popover.title === '活動情境說明')

      expect(guideStep.waitForElement).toBe(1500)
      expect(guideStep.popover.description).toBe(
        '建立活動有四種情境：選擇日期 × 時段後，點「？」可以查看相關導覽。',
      )
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
      const scenarioGuideButton = document.createElement('button')
      scenarioGuideButton.setAttribute('data-tour', 'event-scenario-guide-button')
      document.body.appendChild(scenarioGuideButton)
      const addFriendButton = document.createElement('button')
      addFriendButton.setAttribute('data-tour', 'friend-add-button')
      document.body.appendChild(addFriendButton)
    })

    test('五大區塊與行事曆成團說明都有對應錨點時可以正常啟動導覽', () => {
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTour()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
    })

    test('進度顯示為第 1 步／共 9 步，不會因為套用 i18n 被吃成空字串', () => {
      // progressText 用的是 driver.js 自己的 {{current}}/{{total}} 樣板語法（雙大括號）。
      // 這裡故意用「不認識任何 key」的 t 函式（原樣傳回 key），確保 progressText 不是透過
      // t() 翻譯字串帶進來的——如果是，vue-i18n 會把單大括號 {current}/{total} 當成自己的
      // 插值語法吃掉，這裡就會顯示成空字串而不是「1 / 9」。
      const tour = useAppTour(ref('user-123'), {
        storage: createStorage(),
        t: (key) => key,
      })

      tour.startTour()

      expect(document.querySelector('.driver-popover-progress-text').textContent).toBe('1 / 9')
    })

    test('導覽結束（跳過或完成）都會導回跟目錄', () => {
      // driver.js 預設有 400ms 的框選動畫，動畫跑完前 destroy() 不會觸發 onDestroyed；
      // 用 fake timers 把動畫時間跑完，模擬使用者實際點擊時的時間點
      vi.useFakeTimers()
      const navigate = vi.fn().mockResolvedValue(undefined)
      const tour = useAppTour(ref('user-123'), { storage: createStorage(), navigate })

      tour.startTour()
      vi.advanceTimersByTime(500)
      document.querySelector('.bujo-tour-skip-btn').click()

      expect(navigate).toHaveBeenCalledWith('/calendar')
      vi.useRealTimers()
    })

    test('沒有提供 navigate 時，導覽結束不會拋錯', () => {
      vi.useFakeTimers()
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      tour.startTour()
      vi.advanceTimersByTime(500)

      expect(() => document.querySelector('.bujo-tour-skip-btn').click()).not.toThrow()
      vi.useRealTimers()
    })

    test('找不到任何錨點時不拋錯', () => {
      vi.useFakeTimers()
      document.body.innerHTML = ''
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTour()).not.toThrow()

      // 活動情境說明、加好友這兩步都設有 waitForElement，找不到錨點時會依序各等待一輪才放棄；
      // 把時間快轉完，避免遺留的 setTimeout 在測試結束、jsdom 環境清掉後才觸發而噴出例外。
      vi.advanceTimersByTime(3200)
      vi.useRealTimers()
    })
  })

  describe('startTourHint', () => {
    beforeEach(() => {
      const helpButton = document.createElement('button')
      helpButton.setAttribute('data-tour', 'tour-help-button')
      document.body.appendChild(helpButton)
    })

    test('第一次登入只指向「？」按鈕，不會跑完整的多步驟導覽', () => {
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTourHint()).not.toThrow()
      expect(document.body.classList.contains('driver-active')).toBe(true)
      expect(document.querySelectorAll('.driver-popover').length).toBe(1)
    })

    test('關閉提示後會標記導覽已看過，避免下次自動再彈出', () => {
      vi.useFakeTimers()
      const storage = createStorage()
      const tour = useAppTour(ref('user-123'), { storage })

      tour.startTourHint()
      vi.advanceTimersByTime(500)
      document.querySelector('.driver-popover-close-btn').click()

      expect(storage.setItem).toHaveBeenCalledWith('bujo:app-tour:v1:user-123', APP_TOUR_SEEN_VALUE)
      expect(tour.hasSeenTour.value).toBe(true)
      vi.useRealTimers()
    })

    test('找不到「？」按鈕錨點時不拋錯', () => {
      document.body.innerHTML = ''
      const tour = useAppTour(ref('user-123'), { storage: createStorage() })

      expect(() => tour.startTourHint()).not.toThrow()
    })
  })
})
