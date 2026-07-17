import { computed, ref, unref } from 'vue'

export const LINE_NOTIFICATION_ONBOARDING_KEY_PREFIX = 'bujo:line-notification-guide:v1:'
export const LINE_NOTIFICATION_ONBOARDING_SEEN_VALUE = 'seen'
export const LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY =
  'bujo:line-notification-guide:return-path'

export function getLineNotificationOnboardingKey(userId) {
  return `${LINE_NOTIFICATION_ONBOARDING_KEY_PREFIX}${String(userId)}`
}

function getBrowserStorage() {
  try {
    return globalThis.localStorage
  } catch {
    return null
  }
}

function getSessionStorage() {
  try {
    return globalThis.sessionStorage
  } catch {
    return null
  }
}

export function rememberLineNotificationOnboardingReturnPath(path, storage = getSessionStorage()) {
  if (typeof path !== 'string' || !path.startsWith('/') || path.startsWith('//')) return

  try {
    storage?.setItem(LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY, path)
  } catch {
    // OAuth 仍可繼續；sessionStorage 無法使用時只會沿用後端預設返回頁。
  }
}

export function consumeLineNotificationOnboardingReturnPath(storage = getSessionStorage()) {
  try {
    const path = storage?.getItem(LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY) || ''
    storage?.removeItem(LINE_NOTIFICATION_ONBOARDING_RETURN_PATH_KEY)
    return path.startsWith('/') && !path.startsWith('//') ? path : ''
  } catch {
    return ''
  }
}

export function useLineNotificationOnboarding(userId, options = {}) {
  const storage = Object.hasOwn(options, 'storage') ? options.storage : getBrowserStorage()
  const handledUserIds = options.handledUserIds ?? new Set()
  const revision = ref(0)

  const normalizedUserId = computed(() => {
    const value = unref(userId)
    if (value === null || value === undefined || value === '') return ''
    return String(value)
  })

  const storageKey = computed(() =>
    normalizedUserId.value ? getLineNotificationOnboardingKey(normalizedUserId.value) : '',
  )

  const shouldShow = computed(() => {
    void revision.value
    const id = normalizedUserId.value
    if (!id || handledUserIds.has(id)) return false

    try {
      return storage?.getItem(storageKey.value) !== LINE_NOTIFICATION_ONBOARDING_SEEN_VALUE
    } catch {
      return true
    }
  })

  function markSeen() {
    const id = normalizedUserId.value
    if (!id) return

    handledUserIds.add(id)
    try {
      storage?.setItem(storageKey.value, LINE_NOTIFICATION_ONBOARDING_SEEN_VALUE)
    } catch {
      // Session fallback above still prevents the modal from reopening in this SPA instance.
    } finally {
      revision.value += 1
    }
  }

  return {
    shouldShow,
    storageKey,
    markSeen,
  }
}
