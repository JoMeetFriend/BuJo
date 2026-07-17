import { computed, ref, unref } from 'vue'

export const LINE_NOTIFICATION_ONBOARDING_KEY_PREFIX = 'bujo:line-notification-guide:v1:'
export const LINE_NOTIFICATION_ONBOARDING_SEEN_VALUE = 'seen'

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
