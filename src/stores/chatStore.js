import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'

const API = import.meta.env.VITE_API_URL

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const currentActivityId = ref(null)
  const joinedActivities = ref([])
  const messages = ref({})
  const nextCursors = ref({})
  const unreadCounts = ref({})
  const isLoadingMessages = ref(false)
  const isLoadingActivities = ref(false)
  const error = ref('')
  const chatRoomMap = ref({})

  const totalUnread = computed(() =>
    Object.values(unreadCounts.value).reduce((sum, c) => sum + c, 0),
  )

  const currentMessages = computed(() =>
    currentActivityId.value ? (messages.value[currentActivityId.value] ?? []) : [],
  )

  const currentActivity = computed(() =>
    currentActivityId.value
      ? (joinedActivities.value.find((a) => a.id === currentActivityId.value) ?? null)
      : null,
  )

  function toggleChat() {
    isOpen.value = !isOpen.value
    if (isOpen.value) {
      fetchJoinedActivities()
    }
    if (!isOpen.value) {
      currentActivityId.value = null
    }
  }

  function openChat() {
    isOpen.value = true
    fetchJoinedActivities()
  }

  function closeChat() {
    isOpen.value = false
    currentActivityId.value = null
  }

  function selectActivity(activityId) {
    currentActivityId.value = activityId
    unreadCounts.value[activityId] = 0
    if (!messages.value[activityId]) {
      fetchMessages(activityId)
    }
  }

  function backToList() {
    currentActivityId.value = null
  }

  async function fetchJoinedActivities() {
    isLoadingActivities.value = true
    error.value = ''
    try {
      const res = await fetch(`${API}/api/activities`, { credentials: 'include' })
      if (!res.ok) return
      const data = await res.json()
      const joined = (data.activities ?? []).filter((a) => a.has_joined)
      joinedActivities.value = joined
      for (const a of joined) {
        chatRoomMap.value[a.chat_id ?? a.id] = a.id
      }
    } catch {
      // silent
    } finally {
      isLoadingActivities.value = false
    }
  }

  async function fetchMessages(activityId, { before } = {}) {
    isLoadingMessages.value = true
    error.value = ''
    try {
      const params = new URLSearchParams()
      if (before) params.set('before', before)
      params.set('limit', '50')
      const res = await fetch(`${API}/api/activities/${activityId}/messages?${params}`, {
        credentials: 'include',
      })
      if (!res.ok) return
      const data = await res.json()
      const msgs = data.data ?? []
      const nextCursor = data.next_cursor ?? null

      if (!before) {
        messages.value[activityId] = [...msgs].reverse()
      } else {
        messages.value[activityId] = [...msgs.reverse(), ...(messages.value[activityId] ?? [])]
      }
      nextCursors.value[activityId] = nextCursor
    } catch {
      // silent
    } finally {
      isLoadingMessages.value = false
    }
  }

  async function loadMoreMessages(activityId) {
    const cursor = nextCursors.value[activityId]
    if (!cursor || isLoadingMessages.value) return
    await fetchMessages(activityId, { before: cursor })
  }

  async function sendMessage(activityId, content) {
    const user = useAuthStore().user
    const localId = `local_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`

    const pending = {
      _localId: localId,
      _status: 'pending',
      content,
      sender: user
        ? { id: user.id, display_name: user.display_name, avatar_url: user.avatar_url }
        : { id: '?', display_name: '?' },
      created_at: new Date().toISOString(),
    }

    if (!messages.value[activityId]) {
      messages.value[activityId] = []
    }
    messages.value[activityId] = [...messages.value[activityId], pending]

    try {
      const res = await fetch(`${API}/api/activities/${activityId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        markMessageFailed(
          activityId,
          localId,
          res.status === 429 ? '傳送太頻繁，請稍後再試' : '傳送失敗',
        )
        return false
      }
      const data = await res.json()
      replaceMessage(activityId, localId, data)
      return true
    } catch {
      markMessageFailed(activityId, localId, '網路錯誤')
      return false
    }
  }

  async function retryMessage(activityId, localId) {
    const list = messages.value[activityId]
    if (!list) return false
    const msg = list.find((m) => m._localId === localId)
    if (!msg || msg._status !== 'failed') return false

    messages.value[activityId] = list.map((m) =>
      m._localId === localId ? { ...m, _status: 'pending', _error: undefined } : m,
    )

    try {
      const res = await fetch(`${API}/api/activities/${activityId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content: msg.content }),
      })
      if (!res.ok) {
        markMessageFailed(activityId, localId, '傳送失敗')
        return false
      }
      const data = await res.json()
      replaceMessage(activityId, localId, data)
      return true
    } catch {
      markMessageFailed(activityId, localId, '網路錯誤')
      return false
    }
  }

  function replaceMessage(activityId, localId, realMsg) {
    const list = messages.value[activityId]
    if (!list) return
    const idx = list.findIndex((m) => m._localId === localId)
    if (idx === -1) return
    messages.value[activityId] = [...list.slice(0, idx), realMsg, ...list.slice(idx + 1)]
  }

  function markMessageFailed(activityId, localId, errorText) {
    const list = messages.value[activityId]
    if (!list) return
    messages.value[activityId] = list.map((m) =>
      m._localId === localId ? { ...m, _status: 'failed', _error: errorText } : m,
    )
  }

  function addIncomingMessage(msg) {
    const activityId = chatRoomMap.value[msg.chat_id] ?? msg.chat_id
    if (!activityId) return

    if (!messages.value[activityId]) {
      messages.value[activityId] = []
    }

    if (messages.value[activityId].some((m) => m.id === msg.id)) return

    messages.value[activityId] = [...messages.value[activityId], msg]

    if (activityId !== currentActivityId.value || !isOpen.value) {
      unreadCounts.value[activityId] = (unreadCounts.value[activityId] ?? 0) + 1
    }
  }

  function markActivityRead(activityId) {
    unreadCounts.value[activityId] = 0
  }

  return {
    isOpen,
    currentActivityId,
    joinedActivities,
    messages,
    nextCursors,
    unreadCounts,
    isLoadingMessages,
    isLoadingActivities,
    error,
    totalUnread,
    currentMessages,
    currentActivity,
    toggleChat,
    openChat,
    closeChat,
    selectActivity,
    backToList,
    fetchJoinedActivities,
    fetchMessages,
    loadMoreMessages,
    sendMessage,
    retryMessage,
    addIncomingMessage,
    markActivityRead,
  }
})
