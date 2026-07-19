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

function buildTourSteps(t) {
  return [
    {
      selector: 'nav-calendar',
      popover: {
        title: t('tour.calendarTitle'),
        description: t('tour.calendarDesc'),
      },
    },
    {
      selector: 'calendar-today-cell',
      popover: {
        title: t('tour.todayCellTitle'),
        description: t('tour.todayCellDesc'),
      },
    },
    {
      selector: 'nav-activity',
      popover: {
        title: t('tour.activityTitle'),
        description: t('tour.activityDesc'),
      },
    },
    {
      selector: 'calendar-create-button',
      popover: {
        title: t('tour.createButtonTitle'),
        description: t('tour.createButtonDesc'),
      },
      clickSelfOnNext: true,
      suppressEventScenarioGuideOnClick: true,
    },
    {
      selector: 'event-scenario-guide-button',
      popover: {
        title: t('tour.scenarioGuideTitle'),
        description: t('tour.scenarioGuideDesc'),
      },
      waitForElement: 1500,
    },
    {
      selector: 'nav-friends',
      popover: {
        title: t('tour.friendsTitle'),
        description: t('tour.friendsDesc'),
      },
      navigateOnNextTo: '/friends-page',
    },
    {
      selector: 'friend-add-button',
      popover: {
        title: t('tour.addFriendTitle'),
        description: t('tour.addFriendDesc'),
      },
      waitForElement: 1500,
    },
    {
      selector: 'nav-alerts',
      popover: {
        title: t('tour.alertsTitle'),
        description: t('tour.alertsDesc'),
      },
    },
    {
      selector: 'nav-profile',
      popover: {
        title: t('tour.profileTitle'),
        description: t('tour.profileDesc'),
      },
    },
  ]
}

export function buildDriveSteps(t, navigate, onSuppressEventScenarioGuide) {
  return buildTourSteps(t).map(
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

function createAppTourDriver(t, navigate, onSuppressEventScenarioGuide, onDestroyed) {
  let tourInstance = null

  tourInstance = driver({
    steps: buildDriveSteps(t, navigate, onSuppressEventScenarioGuide),
    showProgress: true,
    allowClose: true,
    overlayClickBehavior: 'close',
    overlayColor: 'rgb(var(--bujo-ink-rgb))',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 3,
    popoverClass: 'bujo-tour-popover',
    progressText: t('tour.progress'),
    prevBtnText: t('tour.prevBtn'),
    nextBtnText: t('tour.nextBtn'),
    doneBtnText: t('tour.doneBtn'),
    onPopoverRender: (popover) => {
      const skipBtn = document.createElement('button')
      skipBtn.type = 'button'
      skipBtn.className = 'bujo-tour-skip-btn'
      skipBtn.textContent = t('tour.skipBtn')
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
  const t = options.t ?? ((key) => key)
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
    createAppTourDriver(t, navigate, onSuppressEventScenarioGuide, markSeen).drive()
  }

  return {
    hasSeenTour,
    storageKey,
    markSeen,
    startTour,
  }
}
