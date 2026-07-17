<template>
  <div class="line-official-entry" data-testid="line-official-account-entry">
    <div
      v-if="showQrCode"
      class="line-official-entry__qr hidden md:flex"
      data-testid="line-official-account-qr"
    >
      <img
        :src="normalizedQrCodeUrl"
        alt="BuJo LINE 官方帳號加入好友 QR Code"
        class="h-32 w-32 border border-[var(--bujo-line)] bg-white p-2"
        @error="handleQrError"
      />
      <p class="text-xs leading-5 text-[var(--bujo-muted-strong)]">
        拿手機 LINE 掃一下<br />就能加入 BuJo 官方帳號
      </p>
    </div>

    <p
      v-else-if="qrUnavailableMessage"
      class="hidden text-xs leading-5 text-[var(--bujo-muted-strong)] md:block"
      aria-live="polite"
    >
      {{ qrUnavailableMessage }}
    </p>

    <a
      v-if="normalizedAddFriendUrl"
      :href="normalizedAddFriendUrl"
      target="_blank"
      rel="noopener noreferrer"
      class="line-official-entry__link"
      aria-label="開啟 BuJo LINE 官方帳號加入好友頁面"
      @click="emit('activate')"
    >
      加入 BuJo 官方 LINE
      <span aria-hidden="true">↗</span>
    </a>
    <p
      v-else
      :class="[
        'border border-dashed border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--bujo-muted-strong)]',
        showQrCode ? 'md:hidden' : '',
      ]"
      role="status"
    >
      {{ addFriendUnavailableMessage }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import bundledQrCodeUrl from '@/assets/line-gain-friends-qrcode.png'

const props = defineProps({
  addFriendUrl: {
    type: String,
    default: () => import.meta.env.VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL || '',
  },
  qrCodeUrl: {
    type: String,
    default: () => import.meta.env.VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL || '',
  },
})

const emit = defineEmits(['activate'])
const qrLoadFailed = ref(false)

const normalizedAddFriendUrl = computed(() => props.addFriendUrl.trim())
const normalizedQrCodeUrl = computed(() => props.qrCodeUrl.trim() || bundledQrCodeUrl)
const showQrCode = computed(() => Boolean(normalizedQrCodeUrl.value) && !qrLoadFailed.value)
const qrUnavailableMessage = computed(() => {
  if (qrLoadFailed.value && normalizedAddFriendUrl.value) {
    return 'QR Code 沒有載入成功，點下面的連結也可以加入。'
  }
  return ''
})
const addFriendUnavailableMessage = computed(() =>
  showQrCode.value
    ? '手機加入連結暫時打不開，可以改用桌機掃 QR Code。'
    : 'LINE 官方帳號連結暫時打不開，晚點再試試看。',
)

watch(normalizedQrCodeUrl, () => {
  qrLoadFailed.value = false
})

function handleQrError() {
  qrLoadFailed.value = true
}
</script>

<style scoped>
.line-official-entry {
  display: grid;
  gap: 12px;
}

.line-official-entry__qr {
  align-items: center;
  gap: 16px;
  border: 1px solid var(--bujo-line-soft);
  background: var(--bujo-surface-muted);
  padding: 12px;
}

.line-official-entry__link {
  display: flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid #00a63c;
  background: var(--bujo-surface);
  color: #08752f;
  font-size: 13px;
  font-weight: 700;
  text-decoration: none;
  transition:
    background-color 150ms,
    color 150ms,
    border-color 150ms;
}

.line-official-entry__link:hover {
  border-color: #08752f;
  background: #f0fff4;
}

.line-official-entry__link:focus-visible {
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
}
</style>
