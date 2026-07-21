import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

const API = import.meta.env.VITE_API_URL

export const useChatStore = defineStore('chat', () => {
  const isOpen = ref(false)
  const currentActivityId = ref(null)
  const joinedActivities = ref([])
  const messages = ref({})
  const nextCursors = ref({})
  const unreadCounts = ref({})
  const isLoadingMessages = ref(false)
  const isSendingMessage = ref(false)
  const isLoadingActivities = ref(false)
  const error = ref('')
  // chat_id → activity_id mapping from joined activities
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
      // Build chat room mapping — assume chat_id === activity id when
      // backend creates one chat room per activity
      for (const a of joined) {
        // The chat_id likely matches the activity id; store both directions.
        // If backend exposes chat_id separately, adjust accordingly.
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
    isSendingMessage.value = true
    error.value = ''
    try {
      const res = await fetch(`${API}/api/activities/${activityId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ content }),
      })
      if (!res.ok) {
        if (res.status === 429) {
          error.value = '傳送太頻繁，請稍後再試'
        } else {
          error.value = '傳送失敗'
        }
        return false
      }
      const data = await res.json()
      if (!messages.value[activityId]) {
        messages.value[activityId] = []
      }
      messages.value[activityId] = [...messages.value[activityId], data]
      return true
    } catch {
      error.value = '網路錯誤'
      return false
    } finally {
      isSendingMessage.value = false
    }
  }

  function addIncomingMessage(msg) {
    // msg shape: { id, chat_id, sender: { id, display_name, avatar_url }, content, created_at }
    const activityId = chatRoomMap.value[msg.chat_id] ?? msg.chat_id
    if (!activityId) return

    if (!messages.value[activityId]) {
      messages.value[activityId] = []
    }
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
    isSendingMessage,
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
    addIncomingMessage,
    markActivityRead,
  }
})
