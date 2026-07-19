<template>
  <div class="line-official-entry" data-testid="line-official-account-entry">
    <div v-if="showQrCode" class="line-official-entry__qr" data-testid="line-official-account-qr">
      <img
        :src="normalizedQrCodeUrl"
        :alt="t('lineOfficial.qrAlt')"
        class="h-32 w-32 border border-[var(--bujo-line)] bg-white p-2"
        @error="handleQrError"
      />
      <p class="text-xs leading-5 text-[var(--bujo-muted-strong)]">
        <strong class="text-sm font-semibold text-[var(--bujo-ink)]">{{
          t('lineOfficial.qrScanHint')
        }}</strong
        ><br />{{ t('lineOfficial.qrJoinHint') }}
      </p>
    </div>

    <p
      v-else-if="qrUnavailableMessage"
      class="text-xs leading-5 text-[var(--bujo-muted-strong)]"
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
      :aria-label="t('lineOfficial.ariaAddFriend')"
      @click="emit('activate')"
    >
      {{ t('lineOfficial.addFriendButton') }}
      <span aria-hidden="true">↗</span>
    </a>
    <p
      v-else-if="!showQrCode"
      class="border border-dashed border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--bujo-muted-strong)]"
      role="status"
    >
      {{ t('lineOfficial.unavailableMessage') }}
    </p>
  </div>
</template>

<script setup>
import { computed, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'
import bundledQrCodeUrl from '@/assets/line-gain-friends-qrcode.png'

const { t } = useI18n()

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
    return t('lineOfficial.qrFailedMessage')
  }
  return ''
})

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
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  border: 1px solid var(--bujo-line-soft);
  background: var(--bujo-surface-muted);
  padding: 12px;
  text-align: center;
}

@media (min-width: 768px) {
  .line-official-entry__qr {
    flex-direction: row;
    text-align: left;
  }
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
