import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/assets/driver-tour-theme.css'
import { computed, ref, unref } from 'vue'

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
function resolveTourElement(key) {
  const candidates = document.querySelectorAll(`[data-tour="nav-${key}"]`)
  for (const el of candidates) {
    if (el.offsetParent !== null) return el
  }
  return candidates[0] ?? null
}

const TOUR_STEPS = [
  {
    key: 'calendar',
    popover: {
      title: '行事曆',
      description: '在這裡查看所有揪團跟活動的時間安排，一眼掌握你的行程。',
    },
  },
  {
    key: 'activity',
    popover: {
      title: '活動',
      description: '瀏覽你發起或參加的活動列表，掌握每個活動的最新狀態。',
    },
  },
  {
    key: 'friends',
    popover: {
      title: '朋友',
      description: '管理好友名單、傳送邀請，找到一起揪團的夥伴。',
    },
  },
  {
    key: 'alerts',
    popover: {
      title: '通知',
      description: '揪團邀請、活動更新都會出現在這裡，別錯過重要訊息。',
    },
  },
  {
    key: 'profile',
    popover: {
      title: '個人設定',
      description: '編輯顯示名稱、大頭貼，還可以連動 LINE 通知。',
    },
  },
]

function buildDriveSteps() {
  return TOUR_STEPS.map(({ key, popover }) => ({
    element: () => resolveTourElement(key),
    popover,
    skipMissingElement: true,
  }))
}

function createAppTourDriver(onDestroyed) {
  let tourInstance = null

  tourInstance = driver({
    steps: buildDriveSteps(),
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
    },
  })

  return tourInstance
}

export function useAppTour(userId, options = {}) {
  const storage = Object.hasOwn(options, 'storage') ? options.storage : getBrowserStorage()
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
    createAppTourDriver(markSeen).drive()
  }

  return {
    hasSeenTour,
    storageKey,
    markSeen,
    startTour,
  }
}
