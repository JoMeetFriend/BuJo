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

function buildIntroSteps(t) {
  return {
    a: [
      {
        selector: 'event-scenario-toggles',
        popover: {
          title: t('guide.scenarioA0Title'),
          description: t('guide.scenarioA0Desc'),
        },
      },
    ],
    b: [
      {
        selector: 'event-scenario-toggles',
        popover: {
          title: t('guide.scenarioB0Title'),
          description: t('guide.scenarioB0Desc'),
        },
      },
      {
        selector: 'event-time-window',
        popover: {
          title: t('guide.scenarioB1Title'),
          description: t('guide.scenarioB1Desc'),
        },
      },
    ],
    c: [
      {
        selector: 'event-scenario-toggles',
        popover: {
          title: t('guide.scenarioC0Title'),
          description: t('guide.scenarioC0Desc'),
        },
      },
      {
        selector: 'event-candidate-dates',
        popover: {
          title: t('guide.scenarioC1Title'),
          description: t('guide.scenarioC1Desc'),
        },
      },
    ],
    d: [
      {
        selector: 'event-scenario-toggles',
        popover: {
          title: t('guide.scenarioD0Title'),
          description: t('guide.scenarioD0Desc'),
        },
      },
      {
        selector: 'event-scenario4-dates',
        popover: {
          title: t('guide.scenarioD1Title'),
          description: t('guide.scenarioD1Desc'),
        },
      },
    ],
  }
}

function buildSharedSteps(t) {
  return [
    {
      selector: 'event-deadline-block',
      popover: {
        title: t('guide.shared0Title'),
        description: t('guide.shared0Desc'),
      },
    },
    {
      selector: 'event-deadline-offset-button',
      popover: {
        title: t('guide.shared1Title'),
        description: t('guide.shared1Desc'),
      },
      openDeadlineEditorOnHighlight: true,
    },
  ]
}

function getStepDefinitionsForScenario(t, scenarioKey) {
  const introSteps = buildIntroSteps(t)[scenarioKey] ?? buildIntroSteps(t).a
  return [...introSteps, ...buildSharedSteps(t)]
}

export function buildGuideSteps(t, scenarioKey, openDeadlineEditor) {
  return getStepDefinitionsForScenario(t, scenarioKey).map(
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

function createGuideDriver(t, scenarioKey, openDeadlineEditor, onDestroyed) {
  return driver({
    steps: buildGuideSteps(t, scenarioKey, openDeadlineEditor),
    showProgress: true,
    progressText: '{{current}} / {{total}}',
    allowClose: true,
    overlayClickBehavior: 'close',
    overlayColor: 'rgb(var(--bujo-ink-rgb))',
    overlayOpacity: 0.55,
    stagePadding: 6,
    stageRadius: 3,
    popoverClass: 'bujo-tour-popover',
    prevBtnText: t('guide.prevBtn'),
    nextBtnText: t('guide.nextBtn'),
    doneBtnText: t('guide.doneBtn'),
    onDestroyed: () => {
      onDestroyed?.()
    },
  })
}

export function useEventScenarioGuide(userId, scenarioKey, options = {}) {
  const storage = Object.hasOwn(options, 'storage') ? options.storage : getBrowserStorage()
  const openDeadlineEditor = options.openDeadlineEditor
  const t = options.t ?? ((key) => key)
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
    activeDriver = createGuideDriver(t, normalizedScenarioKey.value, openDeadlineEditor, markSeen)
    activeDriver.drive()
  }

  return {
    hasSeenGuide,
    storageKey,
    markSeen,
    startGuide,
  }
}
