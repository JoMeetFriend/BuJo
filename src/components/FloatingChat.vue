<template>
  <div v-if="authStore.user" class="floating-chat">
    <Transition name="chat-slide">
      <div v-show="chatStore.isOpen" class="chat-panel">
        <!-- Level 2: Activity List -->
        <template v-if="!chatStore.currentActivityId">
          <header class="chat-header">
            <h3 class="chat-header-title">{{ t('chat.title') }}</h3>
            <button type="button" class="chat-header-close" @click="chatStore.closeChat">
              <XMarkIcon class="h-4 w-4" />
            </button>
          </header>
          <div v-if="chatStore.error" class="chat-error">{{ chatStore.error }}</div>
          <div class="chat-body">
            <div v-if="chatStore.isLoadingActivities" class="chat-state">
              {{ t('chat.loading') }}
            </div>
            <div
              v-else-if="chatStore.joinedActivities.length === 0"
              class="chat-state chat-state--empty"
            >
              {{ t('chat.noActivities') }}
            </div>
            <div
              v-for="act in sortedActivities"
              :key="act.id"
              class="chat-activity-item"
              @click="chatStore.selectActivity(act.id)"
            >
              <div class="chat-activity-avatar">
                <img
                  v-if="act.creator?.avatar_url"
                  :src="toAvatarSrc(act.creator.avatar_url)"
                  alt=""
                  loading="lazy"
                />
                <span v-else>{{ creatorInitial(act) }}</span>
              </div>
              <div class="chat-activity-info">
                <span class="chat-activity-title">{{ act.title }}</span>
                <span class="chat-activity-meta"
                  >{{ act.participants?.length ?? 0 }} {{ t('chat.members') }}</span
                >
              </div>
              <span v-if="(chatStore.unreadCounts[act.id] ?? 0) > 0" class="chat-activity-badge">
                {{ chatStore.unreadCounts[act.id] }}
              </span>
            </div>
          </div>
        </template>

        <!-- Level 3: Chat Room -->
        <template v-else>
          <header class="chat-header">
            <button type="button" class="chat-header-back" @click="chatStore.backToList">
              <ArrowLeftIcon class="h-4 w-4" />
            </button>
            <h3 class="chat-header-title chat-header-title--room">
              {{ chatStore.currentActivity?.title ?? '' }}
            </h3>
          </header>
          <div v-if="chatStore.error" class="chat-error">{{ chatStore.error }}</div>
          <div ref="messageContainerRef" class="chat-messages" @scroll="onScroll">
            <div v-if="chatStore.nextCursors[chatStore.currentActivityId]" class="chat-load-more">
              <button
                v-if="!chatStore.isLoadingMessages"
                type="button"
                class="chat-load-more-btn"
                @click="loadMore"
              >
                {{ t('chat.loadMore') }}
              </button>
              <span v-else class="chat-state chat-state--compact">{{ t('chat.loading') }}</span>
            </div>

            <div
              v-if="chatStore.isLoadingMessages && chatStore.currentMessages.length === 0"
              class="chat-state"
            >
              {{ t('chat.loading') }}
            </div>

            <div
              v-for="msg in chatStore.currentMessages"
              :key="msg._localId ?? msg.id"
              class="chat-message"
              :class="{ 'chat-message--self': msg.sender?.id === authStore.user?.id }"
            >
              <img
                v-if="msg.sender?.avatar_url && !msg._localId"
                :src="toAvatarSrc(msg.sender.avatar_url)"
                alt=""
                class="chat-message-avatar"
                loading="lazy"
              />
              <div v-else class="chat-message-avatar chat-message-avatar--text">
                {{ avatarInitial(msg.sender) }}
              </div>
              <div class="chat-message-body">
                <div class="chat-message-sender">{{ msg.sender?.display_name ?? '' }}</div>
                <div
                  class="chat-message-content"
                  :class="{
                    'chat-message-content--pending': msg._status === 'pending',
                    'chat-message-content--failed': msg._status === 'failed',
                  }"
                >
                  {{ msg.content }}
                </div>
                <div class="chat-message-footer">
                  <span class="chat-message-time">{{ formatTime(msg.created_at) }}</span>
                  <span v-if="msg._status === 'pending'" class="chat-message-indicator">
                    <ArrowPathIcon class="h-3 w-3 chat-spin" />
                  </span>
                  <button
                    v-if="msg._status === 'failed'"
                    type="button"
                    class="chat-message-indicator chat-message-indicator--failed"
                    :title="msg._error ?? t('chat.retry')"
                    @click="chatStore.retryMessage(chatStore.currentActivityId, msg._localId)"
                  >
                    <ExclamationCircleIcon class="h-3 w-3" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="chat-input-bar">
            <input
              v-model="inputText"
              type="text"
              class="chat-input"
              :placeholder="t('chat.inputPlaceholder')"
              maxlength="2000"
              @keyup.enter="handleSend"
            />
            <button
              type="button"
              class="chat-send-btn"
              :disabled="!inputText.trim()"
              @click="handleSend"
            >
              <PaperAirplaneIcon class="h-4 w-4" />
            </button>
          </div>
        </template>
      </div>
    </Transition>

    <!-- Level 1: FAB -->
    <button
      type="button"
      class="chat-fab"
      :aria-label="t('chat.toggleAria')"
      @click="chatStore.toggleChat"
    >
      <ChatBubbleLeftEllipsisIcon v-if="!chatStore.isOpen" class="h-6 w-6" />
      <XMarkIcon v-else class="h-6 w-6" />
      <span v-if="chatStore.totalUnread > 0 && !chatStore.isOpen" class="chat-fab-badge">
        {{ chatStore.totalUnread > 99 ? '99+' : chatStore.totalUnread }}
      </span>
    </button>
  </div>
</template>

<script setup>
import { ref, computed, watch, nextTick } from 'vue'
import { useI18n } from 'vue-i18n'
import {
  ChatBubbleLeftEllipsisIcon,
  XMarkIcon,
  ArrowLeftIcon,
  PaperAirplaneIcon,
  ArrowPathIcon,
  ExclamationCircleIcon,
} from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useChatStore } from '@/stores/chatStore'
import { toAvatarSrc } from '@/utils/avatar'
import { useChatSocket } from '@/composables/useChatSocket'

const { t } = useI18n()
const authStore = useAuthStore()
const chatStore = useChatStore()
const { connect: connectSocket, disconnect: disconnectSocket, isConnected } = useChatSocket()

const inputText = ref('')
const messageContainerRef = ref(null)
const isLoadingMore = ref(false)

const sortedActivities = computed(() => {
  const acts = [...chatStore.joinedActivities]
  acts.sort((a, b) => {
    const aUnread = chatStore.unreadCounts[a.id] ?? 0
    const bUnread = chatStore.unreadCounts[b.id] ?? 0
    if (bUnread !== aUnread) return bUnread - aUnread
    const aTime = new Date(a.updated_at || a.created_at || 0).getTime()
    const bTime = new Date(b.updated_at || b.created_at || 0).getTime()
    return bTime - aTime
  })
  return acts
})

watch(
  () => chatStore.currentMessages.length,
  () => {
    if (isLoadingMore.value) return
    nextTick(() => scrollToBottom())
  },
)

watch(
  () => chatStore.currentActivityId,
  () => {
    nextTick(() => scrollToBottom())
  },
)

watch(
  () => [authStore.user, isConnected.value],
  ([user, connected]) => {
    if (user && !connected) {
      connectSocket()
    } else if (!user && connected) {
      disconnectSocket()
    }
  },
  { immediate: true },
)

function scrollToBottom() {
  if (!messageContainerRef.value) return
  const el = messageContainerRef.value
  el.scrollTop = el.scrollHeight
}

function onScroll() {
  if (!messageContainerRef.value) return
  const el = messageContainerRef.value
  if (el.scrollTop < 80) {
    loadMore()
  }
}

function loadMore() {
  if (!chatStore.currentActivityId) return
  isLoadingMore.value = true
  Promise.resolve(chatStore.loadMoreMessages(chatStore.currentActivityId)).finally(() => {
    isLoadingMore.value = false
  })
}

async function handleSend() {
  const text = inputText.value.trim()
  if (!text || !chatStore.currentActivityId || chatStore.isSending) return
  await chatStore.sendMessage(chatStore.currentActivityId, text)
  inputText.value = ''
}

function creatorInitial(activity) {
  const name = activity.creator?.display_name || activity.creator?.name || ''
  return String(name).trim().charAt(0) || '?'
}

function avatarInitial(sender) {
  const name = sender?.display_name ?? ''
  return String(name).trim().charAt(0) || '?'
}

function formatTime(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n) => String(n).padStart(2, '0')
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}
</script>

<style scoped>
@keyframes chat-spin {
  to {
    transform: rotate(360deg);
  }
}

.floating-chat {
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 100;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 12px;
  font-family: var(--bujo-font-body);
}

/* FAB */
.chat-fab {
  position: relative;
  width: 52px;
  height: 52px;
  border-radius: 999px;
  border: 1px solid rgb(var(--bujo-ink-rgb) / 0.12);
  background: var(--bujo-white);
  color: var(--bujo-ink);
  box-shadow: 2px 3px 8px rgb(var(--bujo-ink-rgb) / 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    transform 160ms ease,
    box-shadow 160ms ease;
}

.chat-fab:hover {
  transform: translateY(-2px);
  box-shadow: 4px 5px 12px rgb(var(--bujo-ink-rgb) / 0.14);
}

.chat-fab-badge {
  position: absolute;
  top: -4px;
  right: -4px;
  min-width: 20px;
  height: 20px;
  border-radius: 999px;
  background: var(--bujo-notification);
  color: var(--bujo-white);
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  font-weight: 700;
  line-height: 20px;
  text-align: center;
  padding: 0 5px;
}

/* Panel */
.chat-panel {
  width: 360px;
  height: 480px;
  max-height: calc(100vh - 120px);
  max-width: calc(100vw - 48px);
  background: var(--bujo-surface);
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.25);
  border-radius: 2px;
  box-shadow: 6px 8px 24px rgb(var(--bujo-ink-rgb) / 0.08);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  transform-origin: bottom right;
}

/* Header */
.chat-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 16px 12px;
  border-bottom: 1px solid rgb(var(--bujo-line-rgb) / 0.18);
  flex-shrink: 0;
}

.chat-header-title {
  flex: 1;
  margin: 0;
  font-family: var(--bujo-font-heading);
  font-size: 16px;
  font-weight: 700;
  line-height: 1.2;
  color: var(--bujo-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-header-title--room {
  font-size: 14px;
}

.chat-header-back,
.chat-header-close {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--bujo-ink);
  cursor: pointer;
  border-radius: 2px;
  transition: background 120ms ease;
}

.chat-header-back:hover,
.chat-header-close:hover {
  background: rgb(var(--bujo-ink-rgb) / 0.06);
}

/* Body */
.chat-body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 0;
}

.chat-state {
  padding: 32px 16px;
  text-align: center;
  color: var(--bujo-muted);
  font-size: 13px;
  font-weight: 600;
}

.chat-state--empty {
  color: var(--bujo-muted);
}

.chat-state--compact {
  padding: 12px 16px;
}

/* Activity Items */
.chat-activity-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 16px;
  cursor: pointer;
  transition: background 120ms ease;
}

.chat-activity-item:hover {
  background: rgb(var(--bujo-ink-rgb) / 0.04);
}

.chat-activity-avatar {
  flex-shrink: 0;
  width: 32px;
  height: 32px;
  border-radius: 999px;
  overflow: hidden;
  background: rgb(var(--bujo-ink-rgb) / 0.06);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: var(--bujo-ink);
}

.chat-activity-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-activity-info {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 2px;
}

.chat-activity-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--bujo-ink);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.chat-activity-meta {
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  color: var(--bujo-muted);
}

.chat-activity-badge {
  flex-shrink: 0;
  min-width: 18px;
  height: 18px;
  border-radius: 999px;
  background: var(--bujo-notification);
  color: var(--bujo-white);
  font-family: var(--bujo-font-meta);
  font-size: 9px;
  font-weight: 700;
  line-height: 18px;
  text-align: center;
  padding: 0 5px;
}

/* Chat Messages */
.chat-messages {
  flex: 1;
  overflow-y: auto;
  padding: 12px 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.chat-load-more {
  text-align: center;
}

.chat-load-more-btn {
  border: none;
  background: transparent;
  color: var(--bujo-muted);
  font-family: var(--bujo-font-meta);
  font-size: 10px;
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
}

.chat-message {
  display: flex;
  gap: 8px;
  max-width: 85%;
}

.chat-message--self {
  align-self: flex-end;
  flex-direction: row-reverse;
}

.chat-message-avatar {
  flex-shrink: 0;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  overflow: hidden;
  background: rgb(var(--bujo-ink-rgb) / 0.06);
}

.chat-message-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.chat-message-avatar--text {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 10px;
  font-weight: 700;
  color: var(--bujo-muted);
}

.chat-message-body {
  min-width: 0;
}

.chat-message-sender {
  font-size: 11px;
  font-weight: 600;
  color: var(--bujo-ink);
  margin-bottom: 2px;
}

.chat-message--self .chat-message-sender {
  text-align: right;
}

.chat-message-content {
  font-size: 13px;
  line-height: 1.45;
  color: var(--bujo-ink);
  background: rgb(var(--bujo-ink-rgb) / 0.05);
  padding: 8px 10px;
  border-radius: 2px;
  word-wrap: break-word;
  white-space: pre-wrap;
}

.chat-message-content--pending {
  opacity: 0.55;
}

.chat-message-content--failed {
  outline: 1px solid var(--bujo-danger);
  background: rgb(var(--bujo-danger) / 0.06);
}

.chat-message--self .chat-message-content {
  background: var(--bujo-accent);
  color: var(--bujo-ink);
}

.chat-message--self .chat-message-content--pending {
  opacity: 0.55;
}

.chat-message--self .chat-message-content--failed {
  outline: 1px solid var(--bujo-danger);
  background: color-mix(in srgb, var(--bujo-accent) 80%, var(--bujo-danger));
}

.chat-message-footer {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 2px;
}

.chat-message--self .chat-message-footer {
  justify-content: flex-end;
}

.chat-message-time {
  font-family: var(--bujo-font-meta);
  font-size: 9px;
  color: var(--bujo-muted);
}

.chat-message-indicator {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  color: var(--bujo-muted-strong);
}

.chat-message-indicator--failed {
  color: var(--bujo-notification);
  cursor: pointer;
  border: none;
  background: transparent;
  padding: 0;
  transition: opacity 120ms ease;
}

.chat-message-indicator--failed:hover {
  opacity: 0.7;
}

.chat-spin {
  animation: chat-spin 800ms linear infinite;
}

/* Error */
.chat-error {
  padding: 8px 12px;
  background: rgb(var(--bujo-danger) / 0.08);
  color: var(--bujo-danger);
  font-size: 12px;
  border-radius: 2px;
  text-align: center;
}

/* Input Bar */
.chat-input-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-top: 1px solid rgb(var(--bujo-line-rgb) / 0.18);
  flex-shrink: 0;
}

.chat-input {
  flex: 1;
  min-width: 0;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.3);
  background: var(--bujo-white);
  color: var(--bujo-ink);
  padding: 8px 10px;
  font-family: var(--bujo-font-body);
  font-size: 13px;
  border-radius: 2px;
  outline: none;
  transition: border-color 120ms ease;
}

.chat-input::placeholder {
  color: var(--bujo-muted);
}

.chat-input:focus {
  border-color: var(--bujo-ink);
}

.chat-send-btn {
  flex-shrink: 0;
  width: 34px;
  height: 34px;
  border: 1px solid rgb(var(--bujo-ink-rgb) / 0.2);
  background: var(--bujo-white);
  color: var(--bujo-ink);
  border-radius: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition:
    background 120ms ease,
    border-color 120ms ease;
}

.chat-send-btn:hover:not(:disabled) {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.chat-send-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* Transition */
.chat-slide-enter-active,
.chat-slide-leave-active {
  transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1);
}

.chat-slide-enter-from,
.chat-slide-leave-to {
  opacity: 0;
  transform: translateY(12px) scale(0.96);
}

@media (max-width: 480px) {
  .floating-chat {
    bottom: calc(62px + 16px);
    right: 16px;
  }

  .chat-panel {
    position: fixed;
    bottom: 0;
    right: 0;
    width: 100vw;
    height: 85vh;
    max-width: 100vw;
    max-height: 85vh;
    border-radius: 2px 2px 0 0;
  }

  .chat-slide-enter-from,
  .chat-slide-leave-to {
    transform: translateY(30px);
  }
}
</style>
