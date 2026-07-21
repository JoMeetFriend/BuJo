<template>
  <div class="min-h-screen bg-[var(--bujo-page)] text-[var(--bujo-ink)]">
    <!-- Sticky Header -->
    <header
      class="friends-header sticky top-0 z-10 flex items-center justify-between bg-[var(--bujo-page)] px-5 pt-8 pb-4 md:px-14"
    >
      <div>
        <p class="friends-eyebrow">{{ t('friends.eyebrow') }}</p>
        <div class="friends-title-line">
          <h1>{{ t('friends.pageTitle') }}</h1>
        </div>
      </div>

      <PixelButton data-tour="friend-add-button" @click="isModalOpen = true">{{
        t('friends.addFriend')
      }}</PixelButton>
    </header>

    <!-- 內容區 -->
    <div class="flex flex-col gap-4 px-5 pt-2 pb-4 md:px-14 md:py-4">
      <div v-if="isLoading" class="text-sm text-[var(--bujo-muted-strong)]">
        {{ t('friends.loading') }}
      </div>
      <div v-else-if="error" class="text-sm text-[var(--bujo-danger)]">
        {{ t('friends.error', { message: error }) }}
      </div>

      <div v-else>
        <div v-if="friends?.length === 0" class="friends-empty">{{ t('friends.empty') }}</div>

        <!-- 好友列表 -->
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(friend, index) in friends"
            :key="friend.id"
            class="friend-stamp cursor-pointer"
            :style="{ background: stampColor(index) }"
            v-click-outside="() => closeCard(friend.id)"
            @click="toggleCard(friend.id)"
          >
            <button
              class="friend-stamp-delete-btn"
              @click="handleDelete(friend)"
              :aria-label="t('friends.removeFriend')"
            >
              <span class="default-mark"></span>
              <span class="hover-cross">×</span>
            </button>
            <div class="friend-stamp-avatar">
              <img
                v-if="friend.avatar_url && !brokenImages.has(friend.id)"
                :src="friend.avatar_url"
                :alt="t('friends.friendAvatar')"
                @error="handleImageError(friend.id)"
                class="h-full w-full object-cover"
              />
              <span v-else class="friend-stamp-face" aria-hidden="true"></span>
            </div>
            <span
              class="friend-stamp-name"
              :class="{ 'is-expanded': activeFriendId === friend.id }"
              >{{ friend.display_name }}</span
            >
            <div
              class="friend-bio-container"
              :class="{ 'is-expanded': activeFriendId === friend.id }"
            >
              <p class="friend-bio-text">
                {{ friend.bio || t('friends.noBio') }}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>

  <FriendAddModal :isOpen="isModalOpen" @close="isModalOpen = false" />
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useI18n } from 'vue-i18n'
import { useFriendStore } from '@/stores/friendStore'
import FriendAddModal from './FriendAddModal.vue'
import PixelButton from './ui/PixelButton.vue'

defineProps({
  sidebarOpen: Boolean,
  filters: Object,
})

const { t } = useI18n()
const friendStore = useFriendStore()
const { friends, isLoading, error } = storeToRefs(friendStore)

const isModalOpen = ref(false)

const brokenImages = ref(new Set())

const activeFriendId = ref(null)

const stampColors = [
  'var(--bujo-card-pink)',
  'var(--bujo-card-blue)',
  'var(--bujo-card-yellow)',
  'var(--bujo-accent)',
]

function stampColor(index) {
  return stampColors[index % stampColors.length]
}

const handleImageError = (id) => {
  brokenImages.value = new Set([...brokenImages.value, id])
}

const handleDelete = async (friend) => {
  const isConfirmed = window.confirm(t('friends.confirmRemove', { name: friend.display_name }))

  if (!isConfirmed) return

  const result = await friendStore.removeFriend(friend.friendship_id)

  if (!result.success) {
    alert(result.message)
  }
}

const toggleCard = (id) => {
  activeFriendId.value = activeFriendId.value === id ? null : id
}

const closeCard = (id) => {
  if (activeFriendId.value === id) {
    activeFriendId.value = null
  }
}

const vClickOutside = {
  mounted(el, binding) {
    el.clickOutsideEvent = (event) => {
      if (!(el == event.target || el.contains(event.target))) {
        binding.value(event)
      }
    }

    el.clickOutsideTimeout = setTimeout(() => {
      document.addEventListener('click', el.clickOutsideEvent)
    }, 0)
  },
  unmounted(el) {
    clearTimeout(el.clickOutsideTimeout)
    document.removeEventListener('click', el.clickOutsideEvent)
  },
}

onMounted(() => {
  friendStore.fetchFriends()
})
</script>

<style scoped>
.friends-eyebrow {
  margin: 0 0 2px;
  padding-bottom: 6px;
  color: var(--bujo-muted-strong);
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.friends-title-line {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.friends-title-line h1 {
  margin: 0;
  color: var(--bujo-ink);
  font-family: var(--bujo-font-heading);
  font-size: clamp(40px, 6vw, 64px);
  font-weight: 800;
  line-height: 0.9;
  letter-spacing: 0;
}

.friends-empty {
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  padding: 20px;
  font-size: 14px;
  color: var(--bujo-muted-strong);
}

.friend-stamp {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  border: 1px solid var(--bujo-ink);
  padding: 18px 12px 14px;
  box-shadow: 4px 5px 0 rgb(var(--bujo-ink-rgb) / 0.08);
  transition:
    transform 160ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 160ms cubic-bezier(0.2, 0.8, 0.2, 1);
  min-height: 130px;
  justify-content: flex-start;
  align-self: start;
  min-width: 0;
}

.friend-stamp:hover {
  transform: translateY(-3px);
  box-shadow: 5px 7px 0 rgb(var(--bujo-ink-rgb) / 0.12);
}

.friend-stamp-delete-btn {
  position: absolute;
  top: 0;
  right: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: transparent;
  border: none;
  cursor: pointer;
  z-index: 2;
}

.default-mark {
  width: 6px;
  height: 6px;
  background: var(--bujo-ink);
  opacity: 0.55;
  transition: opacity 150ms ease;
}

.hover-cross {
  position: absolute;
  font-family: 'Space Mono', monospace;
  font-size: 16px;
  font-weight: 700;
  color: var(--bujo-ink);
  opacity: 0;
  transform: scale(0.8);
  transition: all 150ms ease;
}

.friend-stamp:hover .default-mark {
  opacity: 0;
}

.friend-stamp:hover .hover-cross {
  opacity: 1;
  transform: scale(1);
}

.friend-stamp-delete-btn:hover .hover-cross {
  color: var(--bujo-danger);
}

.friend-stamp-avatar {
  display: grid;
  place-items: center;
  width: 56px;
  height: 56px;
  border: 1px solid var(--bujo-ink);
  background: var(--bujo-surface);
  overflow: hidden;
}

.friend-stamp-face {
  position: relative;
  display: block;
  width: 26px;
  height: 26px;
  background:
    linear-gradient(var(--bujo-ink) 0 0) 6px 3px / 13px 3px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 3px 6px / 3px 13px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 20px 6px / 3px 13px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 6px 20px / 13px 3px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 10px 10px / 3px 3px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 16px 10px / 3px 3px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 13px 16px / 3px 3px no-repeat;
}

.friend-stamp-name {
  font-size: 13px;
  font-weight: 700;
  color: var(--bujo-ink);
  text-align: center;
  line-height: 1.2;

  width: 100%;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.friend-stamp-name.is-expanded {
  white-space: normal;
  word-break: break-all;
}

.friend-stamp-label {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: rgb(var(--bujo-ink-rgb) / 0.6);
}

.friend-bio-container {
  width: 100%;
  margin-top: 4px;
  max-height: 20px;
  overflow: hidden;
  transition: max-height 300ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.friend-bio-container.is-expanded {
  max-height: 400px;
}

.friend-bio-text {
  font-family: 'Space Mono', var(--bujo-font-body);
  font-size: 11px;
  color: rgb(var(--bujo-ink-rgb) / 0.7);
  line-height: 1.5;
  text-align: center;
  display: -webkit-box;

  -webkit-line-clamp: 1;
  line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
  text-overflow: ellipsis;

  transition: color 200ms ease;
}

.is-expanded .friend-bio-text {
  -webkit-line-clamp: unset;
  line-clamp: unset;

  display: block;
  width: fit-content;
  margin: 0 auto;
  text-align: left;

  color: var(--bujo-ink);
  white-space: normal;
  word-break: break-all;
}
</style>
