import { driver } from 'driver.js'
import 'driver.js/dist/driver.css'
import '@/assets/driver-tour-theme.css'
import { computed, ref, unref } from 'vue'

export const EVENT_SCENARIO_GUIDE_KEY_PREFIX = 'bujo:event-scenario-guide:v1:'
export const EVENT_SCENARIO_GUIDE_SEEN_VALUE = 'seen'

// key 帶情境代號：使用者對情境一按過「知道了」，不代表他已經看過情境二的介紹，
// 兩者要分開各自追蹤「有沒有看過」。
export function getEventScenarioGuideKey(userId, scenarioKey) {
  return `${EVENT_SCENARIO_GUIDE_KEY_PREFIX}${String(userId)}:${scenarioKey}`
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

// 每個情境開頭專屬的說明步驟；「怎麼喬時間？」開關區塊四個情境共用同一個錨點，
// 只是文字依目前選的情境而不同。情境三、四文案定稿後再補進 SCENARIO_INTRO_STEPS。
const SCENARIO_INTRO_STEPS = {
  a: [
    {
      selector: 'event-scenario-block',
      popover: {
        title: '怎麼喬時間？',
        description:
          '預設是「都確定」：日期和時間都直接約好，適合已經講好時間的揪團——大家打開活動就能直接報名，不用等投票。',
      },
    },
  ],
  b: [
    {
      selector: 'event-scenario-block',
      popover: {
        title: '怎麼喬時間？',
        description:
          '現在是「時間開放」：日期已經定了，時間留給大家投票——你只要抓一個時間範圍，大家會在範圍內回報自己方便的時段。',
      },
    },
    {
      selector: 'event-time-window',
      popover: {
        title: '可投票時段',
        description:
          '設定大家可以回報的時間範圍（例如 09:00–18:00），參加者只能在這個範圍內選時間，你之後再從回報結果挑一個時間確定。',
      },
    },
  ],
}

// 報名截止／成團確認這兩步是所有情境共用的規則，不管日期時間怎麼喬都適用，
// 所以獨立在情境專屬的開場步驟之後，每個情境都會走到。
const SHARED_TRAILING_STEPS = [
  {
    selector: 'event-deadline-block',
    popover: {
      title: '報名截止與成團確認',
      description: '報名有名額和截止時間限制，成團最後仍要由你手動確認才會上行事曆。',
    },
  },
  {
    selector: 'event-deadline-offset-button',
    popover: {
      title: '報名截止時間',
      description: '可以手動修改報名開放時間。',
    },
    // 這步顯示前先展開下面的截止時間選單，讓使用者直接看到可以選哪些選項
    openDeadlineEditorOnHighlight: true,
  },
]

function getStepDefinitionsForScenario(scenarioKey) {
  const introSteps = SCENARIO_INTRO_STEPS[scenarioKey] ?? SCENARIO_INTRO_STEPS.a
  return [...introSteps, ...SHARED_TRAILING_STEPS]
}

export function buildGuideSteps(scenarioKey, openDeadlineEditor) {
  return getStepDefinitionsForScenario(scenarioKey).map(
    ({ selector, popover, openDeadlineEditorOnHighlight }) => {
      const step = {
        element: () => resolveGuideElement(selector),
        popover,
        skipMissingElement: true,
      }

      if (openDeadlineEditorOnHighlight) {
        step.onHighlightStarted = () => openDeadlineEditor?.()
      }

      return step
    },
  )
}

function createGuideDriver(scenarioKey, openDeadlineEditor, onDestroyed) {
  return driver({
    steps: buildGuideSteps(scenarioKey, openDeadlineEditor),
    showProgress: true,
    progressText: '{{current}} / {{total}}',
    allowClose: true,
    overlayClickBehavior: 'close',
    overlayColor: 'rgb(var(--bujo-ink-rgb))',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 3,
    popoverClass: 'bujo-tour-popover',
    prevBtnText: '上一步',
    nextBtnText: '下一步',
    doneBtnText: '知道了',
    onDestroyed: () => {
      onDestroyed?.()
    },
  })
}

export function useEventScenarioGuide(userId, scenarioKey, options = {}) {
  const storage = Object.hasOwn(options, 'storage') ? options.storage : getBrowserStorage()
  const openDeadlineEditor = options.openDeadlineEditor
  const revision = ref(0)

  const normalizedUserId = computed(() => {
    const value = unref(userId)
    if (value === null || value === undefined || value === '') return ''
    return String(value)
  })

  const normalizedScenarioKey = computed(() => unref(scenarioKey) || 'a')

  const storageKey = computed(() =>
    normalizedUserId.value
      ? getEventScenarioGuideKey(normalizedUserId.value, normalizedScenarioKey.value)
      : '',
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

  let activeDriver = null

  function startGuide() {
    // 情境切換得夠快時，前一個情境的說明可能還開著；先關掉再開新的，避免疊出兩層 popover。
    activeDriver?.destroy()
    activeDriver = createGuideDriver(normalizedScenarioKey.value, openDeadlineEditor, markSeen)
    activeDriver.drive()
  }

  return {
    hasSeenGuide,
    storageKey,
    markSeen,
    startGuide,
  }
}
