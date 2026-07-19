import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/assets/driver-tour-theme.css'
import { computed, ref, unref } from 'vue'

export const EVENT_SCENARIO_GUIDE_KEY_PREFIX = 'bujo:event-scenario-guide:v1:'
export const EVENT_SCENARIO_GUIDE_SEEN_VALUE = 'seen'

export function getEventScenarioGuideKey(userId) {
  return `${EVENT_SCENARIO_GUIDE_KEY_PREFIX}${String(userId)}`
}

function getBrowserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function resolveGuideElement(selector) {
  return document.querySelector(`[data-tour="${selector}"]`)
}

// 先只做情境一（日期、時間都固定）：這是新增活動彈窗一打開的預設狀態。
// 情境二～四文案定稿後再依序加進 GUIDE_STEPS。
const GUIDE_STEPS = [
  {
    selector: 'event-scenario-block',
    popover: {
      title: '怎麼喬時間？',
      description:
        '預設是「都確定」：日期和時間都直接約好，適合已經講好時間的揪團——大家打開活動就能直接報名，不用等投票。',
    },
  },
]

function buildGuideSteps() {
  return GUIDE_STEPS.map(({ selector, popover }) => ({
    element: () => resolveGuideElement(selector),
    popover,
    skipMissingElement: true,
  }))
}

function createGuideDriver(onDestroyed) {
  return driver({
    steps: buildGuideSteps(),
    showProgress: false,
    allowClose: true,
    overlayClickBehavior: 'close',
    overlayColor: 'rgb(var(--bujo-ink-rgb))',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 3,
    popoverClass: 'bujo-tour-popover',
    doneBtnText: '知道了',
    onDestroyed: () => {
      onDestroyed?.()
    },
  })
}

export function useEventScenarioGuide(userId, options = {}) {
  const storage = Object.hasOwn(options, 'storage') ? options.storage : getBrowserStorage()
  const revision = ref(0)

  const normalizedUserId = computed(() => {
    const value = unref(userId)
    if (value === null || value === undefined || value === '') return ''
    return String(value)
  })

  const storageKey = computed(() =>
    normalizedUserId.value ? getEventScenarioGuideKey(normalizedUserId.value) : '',
  )

  const hasSeenGuide = computed(() => {
    void revision.value
    const id = normalizedUserId.value
    if (!id) return false

    try {
      return storage?.getItem(storageKey.value) === EVENT_SCENARIO_GUIDE_SEEN_VALUE
    } catch {
      return false
    }
  })

  function markSeen() {
    const id = normalizedUserId.value
    if (!id) return

    try {
      storage?.setItem(storageKey.value, EVENT_SCENARIO_GUIDE_SEEN_VALUE)
    } catch {
      // localStorage 無法使用時，提示只會在這次 SPA session 內不重複自動彈出。
    } finally {
      revision.value += 1
    }
  }

  function startGuide() {
    createGuideDriver(markSeen).drive()
  }

  return {
    hasSeenGuide,
    storageKey,
    markSeen,
    startGuide,
  }
}
