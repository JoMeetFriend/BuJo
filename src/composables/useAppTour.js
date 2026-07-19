import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/assets/driver-tour-theme.css'
import { computed, nextTick, ref, unref } from 'vue'

export const APP_TOUR_KEY_PREFIX = 'bujo:app-tour:v1:'
export const APP_TOUR_SEEN_VALUE = 'seen'

export function getAppTourKey(userId) {
  return `${APP_TOUR_KEY_PREFIX}${String(userId)}`
}

function getBrowserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

// 桌機版側邊欄與手機版底部導覽列同時存在於 DOM，只有其中一個透過 CSS 顯示；
// 用 offsetParent 找出目前實際可見的那個，driver.js 才能正確定位框選範圍。
function resolveTourElement(selector) {
  const candidates = document.querySelectorAll(`[data-tour="${selector}"]`)
  for (const el of candidates) {
    if (el.offsetParent !== null) return el
  }
  return candidates[0] ?? null
}

const TOUR_STEPS = [
  {
    selector: 'nav-calendar',
    popover: {
      title: '行事曆',
      description: '在這裡查看所有揪團跟活動的時間安排，一眼掌握你的行程。',
    },
  },
  {
    selector: 'calendar-today-cell',
    popover: {
      title: '只顯示已成團的活動',
      description:
        '行事曆只顯示已成團的活動——招募中／投票中的活動即使有候選日期，也不會出現在月曆上，必須由建立者手動確認成團。',
    },
  },
  {
    selector: 'nav-activity',
    popover: {
      title: '活動',
      description: '瀏覽你發起或參加的活動列表，掌握每個活動的最新狀態。',
    },
  },
  {
    selector: 'calendar-create-button',
    popover: {
      title: '新增活動',
      description:
        '點這裡新增活動。<br>點行事曆格子新增活動會自動帶入日期。<br>活動頁也有一樣的入口可以新增活動。',
    },
    // 下一步的錨點在新增活動彈窗裡：先點開彈窗，並標記彈窗自己的情境一導覽已看過，
    // 避免彈窗一開，那邊的導覽也自動跳出來跟這裡疊在一起
    clickSelfOnNext: true,
    suppressEventScenarioGuideOnClick: true,
  },
  {
    selector: 'event-scenario-guide-button',
    popover: {
      title: '活動情境說明',
      description: '建立活動有四種情境：選擇日期 × 時段後，點「？」可以查看相關導覽。',
    },
    waitForElement: 1500,
  },
  {
    selector: 'nav-friends',
    popover: {
      title: '朋友',
      description: '管理好友名單、傳送邀請，找到一起揪團的夥伴。',
    },
    // 下一步的錨點在朋友頁面上，先切過去再繼續導覽
    navigateOnNextTo: '/friends-page',
  },
  {
    selector: 'friend-add-button',
    popover: {
      title: '加好友',
      description: '輸入朋友的 BuJo ID 來交朋友吧！',
    },
    waitForElement: 1500,
  },
  {
    selector: 'nav-alerts',
    popover: {
      title: '通知',
      description: '加好友、揪團邀請、活動更新都會出現在這裡，別錯過重要訊息。',
    },
  },
  {
    selector: 'nav-profile',
    popover: {
      title: '個人設定',
      description: '編輯顯示名稱、大頭貼，還可以連動 LINE 通知。',
    },
  },
]

export function buildDriveSteps(navigate, onSuppressEventScenarioGuide) {
  return TOUR_STEPS.map(
    ({
      selector,
      popover,
      navigateOnNextTo,
      waitForElement,
      clickSelfOnNext,
      suppressEventScenarioGuideOnClick,
    }) => {
      const stepPopover = { ...popover }

      // 下一步的目標在別的頁面上：先切頁、等畫面渲染完，再讓 driver.js 前進到下一步。
      if (navigateOnNextTo) {
        stepPopover.onNextClick = async (_element, _step, opts) => {
          if (navigate) {
            await navigate(navigateOnNextTo)
            await nextTick()
          }
          opts.driver.moveNext()
        }
      }

      // 下一步的目標藏在這步自己點開的東西裡（例如彈窗）：直接點擊當前這個高亮元素，
      // 等畫面渲染完再前進
      if (clickSelfOnNext) {
        stepPopover.onNextClick = async (element, _step, opts) => {
          if (suppressEventScenarioGuideOnClick) onSuppressEventScenarioGuide?.()
          element?.click()
          await nextTick()
          opts.driver.moveNext()
        }
      }

      return {
        element: () => resolveTourElement(selector),
        popover: stepPopover,
        skipMissingElement: true,
        ...(waitForElement ? { waitForElement } : {}),
      }
    },
  )
}

function createAppTourDriver(navigate, onSuppressEventScenarioGuide, onDestroyed) {
  let tourInstance = null

  tourInstance = driver({
    steps: buildDriveSteps(navigate, onSuppressEventScenarioGuide),
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: 'close',
    overlayColor: 'rgb(var(--bujo-ink-rgb))',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 3,
    popoverClass: 'bujo-tour-popover',
    progressText: '{{current}} / {{total}}',
    prevBtnText: '上一步',
    nextBtnText: '下一步',
    doneBtnText: '完成',
    onPopoverRender: (popover) => {
      const skipBtn = document.createElement('button')
      skipBtn.type = 'button'
      skipBtn.className = 'bujo-tour-skip-btn'
      skipBtn.textContent = '跳過導覽'
      skipBtn.addEventListener('click', () => tourInstance?.destroy())
      popover.footerButtons.prepend(skipBtn)
    },
    onDestroyed: () => {
      onDestroyed?.()
      // 導覽結束（完成或跳過）不管走到哪一步，都帶使用者回跟目錄——登入後的跟目錄就是行事曆頁，
      // 見 router/index.js 對 '/' 的重導向規則
      Promise.resolve(navigate?.('/calendar')).catch(() => {})
    },
  })

  return tourInstance
}

export function useAppTour(userId, options = {}) {
  const storage = Object.hasOwn(options, 'storage') ? options.storage : getBrowserStorage()
  const navigate = options.navigate
  const onSuppressEventScenarioGuide = options.onSuppressEventScenarioGuide
  const revision = ref(0)

  const normalizedUserId = computed(() => {
    const value = unref(userId)
    if (value === null || value === undefined || value === '') return ''
    return String(value)
  })

  const storageKey = computed(() =>
    normalizedUserId.value ? getAppTourKey(normalizedUserId.value) : '',
  )

  const hasSeenTour = computed(() => {
    void revision.value
    const id = normalizedUserId.value
    if (!id) return false

    try {
      return storage?.getItem(storageKey.value) === APP_TOUR_SEEN_VALUE
    } catch {
      return false
    }
  })

  function markSeen() {
    const id = normalizedUserId.value
    if (!id) return

    try {
      storage?.setItem(storageKey.value, APP_TOUR_SEEN_VALUE)
    } catch {
      // localStorage 無法使用時，導覽只會在這次 SPA session 內不重複自動彈出。
    } finally {
      revision.value += 1
    }
  }

  function startTour() {
    createAppTourDriver(navigate, onSuppressEventScenarioGuide, markSeen).drive()
  }

  return {
    hasSeenTour,
    storageKey,
    markSeen,
    startTour,
  }
}
