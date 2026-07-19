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

// 給主導覽用：主導覽帶使用者打開新增活動彈窗、直接框「？」按鈕介紹情境說明時，
// 順便把情境一標記成已看過，避免這個彈窗自己的情境導覽也同時跳出來疊在一起。
export function markEventScenarioGuideSeen(userId, scenarioKey, storage = getBrowserStorage()) {
  const id = userId ? String(userId) : ''
  if (!id) return

  try {
    storage?.setItem(getEventScenarioGuideKey(id, scenarioKey), EVENT_SCENARIO_GUIDE_SEEN_VALUE)
  } catch {
    // 跟 markSeen 一樣的容錯策略：寫入失敗就算了，不影響主導覽繼續走下去。
  }
}

function resolveGuideElement(selector) {
  return document.querySelector(`[data-tour="${selector}"]`)
}

// 每個情境開頭專屬的說明步驟；「怎麼喬時間？」開關區塊四個情境共用同一個錨點，
// 只是文字依目前選的情境而不同。
const SCENARIO_INTRO_STEPS = {
  a: [
    {
      selector: 'event-scenario-toggles',
      popover: {
        title: '怎麼喬時間？',
        description:
          '預設是「都確定」：日期和時間都直接約好，適合已經講好時間的揪團——大家打開活動就能直接報名，不用等投票。',
      },
    },
  ],
  b: [
    {
      selector: 'event-scenario-toggles',
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
  c: [
    {
      selector: 'event-scenario-toggles',
      popover: {
        title: '怎麼喬時間？',
        description:
          '現在是「日期開放」：時間已經定了，日期留給大家投票——你可以勾選多個候選日期，大家會投票選出可以的日子。',
      },
    },
    {
      selector: 'event-candidate-dates',
      popover: {
        title: '候選日期',
        description:
          '點選多個候選日期讓大家投票；時間統一套用到所有候選日，不能每天喬不同時間，之後你再從投票結果挑一天確定成團。',
      },
    },
  ],
  d: [
    {
      selector: 'event-scenario-toggles',
      popover: {
        title: '怎麼喬時間？',
        description:
          '現在是「都開放」：日期和時間都留給大家投票——你可以設定多個候選日期，每個日期還能各自安排不同的時段。',
      },
    },
    {
      selector: 'event-scenario4-dates',
      popover: {
        title: '候選日期與時段',
        description:
          '點選候選日期後，下面會打開該日的時段編輯——跟情境三不同，這裡每個候選日可以各自設定不同時段，之後再從投票結果挑一組確定成團。',
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
