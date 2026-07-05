<template>
  <div class="min-h-screen bg-[var(--bujo-page)] text-[var(--bujo-ink)]">
    <!-- Sticky Header -->
    <header
      class="friends-header sticky top-0 z-10 flex items-center justify-between bg-[var(--bujo-page)] px-5 pt-8 pb-4 md:px-14"
    >
      <div>
        <p class="friends-eyebrow">SOCIAL COLLECTION</p>
        <div class="friends-title-line">
          <h1>FRIENDS</h1>
          <span class="friends-cn-tag">好友</span>
        </div>
      </div>
      <PixelButton @click="isModalOpen = true">＋ 新增好友</PixelButton>
    </header>

    <!-- 內容區 -->
    <div class="flex flex-col gap-4 px-5 pt-2 pb-4 md:px-14 md:py-4">
      <div v-if="isLoading" class="text-sm text-[var(--bujo-muted-strong)]">資料讀取中...</div>
      <div v-else-if="error" class="text-sm text-[#dc2626]">發生錯誤：{{ error }}</div>

      <div v-else>
        <div v-if="friends?.length === 0" class="friends-empty">目前還沒有好友喔！</div>

        <!-- 好友列表 -->
        <div v-else class="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          <div
            v-for="(friend, index) in friends"
            :key="friend.id"
            class="friend-stamp"
            :style="{ background: stampColor(index) }"
          >
            <span class="friend-stamp-mark" aria-hidden="true"></span>
            <div class="friend-stamp-avatar">
              <img
                v-if="friend.avatar_url && !brokenImages.has(friend.id)"
                :src="friend.avatar_url"
                alt="好友頭像"
                @error="handleImageError(friend.id)"
                class="h-full w-full object-cover"
              />
              <span v-else class="friend-stamp-face" aria-hidden="true"></span>
            </div>
            <span class="friend-stamp-name">{{ friend.display_name }}</span>
            <span class="friend-stamp-label">好友</span>
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
import { useFriendStore } from '@/stores/friendStore'
import FriendAddModal from './FriendAddModal.vue'
import PixelButton from './ui/PixelButton.vue'

const friendStore = useFriendStore()
const { friends, isLoading, error } = storeToRefs(friendStore)

const isModalOpen = ref(false)

const brokenImages = ref(new Set())

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

onMounted(() => {
  friendStore.fetchFriends()
})
</script>

<style scoped>
.friends-eyebrow {
  margin: 0 0 2px;
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

.friends-cn-tag {
  color: var(--bujo-muted);
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.04em;
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
}

.friend-stamp:hover {
  transform: translateY(-3px);
  box-shadow: 5px 7px 0 rgb(var(--bujo-ink-rgb) / 0.12);
}

.friend-stamp-mark {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 6px;
  height: 6px;
  background: var(--bujo-ink);
  opacity: 0.55;
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
}

.friend-stamp-label {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.04em;
  color: rgb(var(--bujo-ink-rgb) / 0.6);
}
</style>
