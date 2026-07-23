import { ref } from 'vue'
import { io } from 'socket.io-client'
import { useChatStore } from '@/stores/chatStore'

const API_BASE = import.meta.env.VITE_API_URL

let socket = null
const isConnected = ref(false)

export function useChatSocket() {
  function connect() {
    if (socket?.connected) return

    socket = io(API_BASE, {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    })

    socket.on('connect', () => {
      isConnected.value = true
      const chatStore = useChatStore()
      chatStore.fetchJoinedActivities()
    })

    socket.on('disconnect', () => {
      isConnected.value = false
    })

    socket.on('chat:new_message', (msg) => {
      const chatStore = useChatStore()
      chatStore.addIncomingMessage(msg)
    })

    socket.on('chat:room_removed', ({ activity_id }) => {
      if (!activity_id) return
      const chatStore = useChatStore()
      chatStore.removeRoom(activity_id)
    })
  }

  function disconnect() {
    if (socket) {
      socket.removeAllListeners()
      socket.disconnect()
      socket = null
    }
    isConnected.value = false
  }

  return { isConnected, connect, disconnect }
}
