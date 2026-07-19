<template>
  <BaseModal
    :isOpen="true"
    :title="modalTitle"
    maxWidth="480px"
    scrollable
    @close="finishOnboarding"
  >
    <div class="grid gap-4">
      <div class="line-onboarding-note" aria-hidden="true">
        <span>LINE</span>
        <span class="line-onboarding-note__rule"></span>
        <span>NOTIFY</span>
      </div>

      <template v-if="isLineConnected">
        <div class="grid gap-2">
          <p class="text-sm leading-6 text-[var(--bujo-text-body)]">
            你的 BuJo 已經連上 LINE 囉！再加入 BuJo LINE 官方帳號，就能收到揪團提醒。
          </p>
          <p class="text-xs leading-5 text-[var(--bujo-muted-strong)]">
            這次先略過也沒關係，之後可到個人編輯頁面掃 QR Code。
          </p>
        </div>
        <LineOfficialAccountEntry
          :addFriendUrl="addFriendUrl"
          :qrCodeUrl="qrCodeUrl"
          @activate="finishOnboarding"
        />
      </template>

      <template v-else>
        <p class="text-sm leading-6 text-[var(--bujo-text-body)]">
          想在 LINE 收到揪團提醒嗎？先把 BuJo 跟 LINE 連起來，再加入官方帳號就完成囉！
        </p>
        <ol class="line-onboarding-steps" aria-label="開啟 LINE 通知步驟">
          <li><span>01</span>先把 BuJo 帳號連上 LINE</li>
          <li><span>02</span>加入 BuJo LINE 官方帳號</li>
        </ol>
        <LineOfficialAccountEntry
          :addFriendUrl="addFriendUrl"
          :qrCodeUrl="qrCodeUrl"
          @activate="finishOnboarding"
        />
        <p class="text-xs leading-5 text-[var(--bujo-muted-strong)]">
          這次先略過也沒關係，之後可以到個人編輯頁面繼續設定。
        </p>
      </template>
    </div>

    <template #footer>
      <PixelButton type="button" variant="white" @click="finishOnboarding"> 稍後再說 </PixelButton>
      <a
        v-if="!isLineConnected"
        :href="lineLinkUrl"
        class="line-onboarding-primary"
        aria-label="連接 LINE 並開啟通知設定"
        @click="beginLineLink"
      >
        先連接 LINE
      </a>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed } from 'vue'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'
import LineOfficialAccountEntry from './LineOfficialAccountEntry.vue'

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
  apiBaseUrl: {
    type: String,
    default: () => import.meta.env.VITE_API_URL || '',
  },
  addFriendUrl: {
    type: String,
    default: () => import.meta.env.VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL || '',
  },
  qrCodeUrl: {
    type: String,
    default: () => import.meta.env.VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL || '',
  },
})

const emit = defineEmits(['complete', 'link-start'])

const isLineConnected = computed(
  () =>
    Array.isArray(props.user?.identities) &&
    props.user.identities.some((identity) => identity?.provider === 'line'),
)
const modalTitle = computed(() =>
  isLineConnected.value ? 'LINE 提醒就差一步' : '用 LINE 收到揪團提醒',
)
const lineLinkUrl = computed(() => {
  const baseUrl = props.apiBaseUrl.trim().replace(/\/+$/, '')
  return `${baseUrl}/api/auth/line/link`
})

function finishOnboarding() {
  emit('complete')
}

function beginLineLink() {
  emit('link-start')
}
</script>

<style scoped>
.line-onboarding-note {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
  color: var(--bujo-muted);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  letter-spacing: 0.12em;
}

.line-onboarding-note__rule {
  height: 1px;
  background: var(--bujo-line-soft);
}

.line-onboarding-steps {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.line-onboarding-steps li {
  display: grid;
  grid-template-columns: 34px 1fr;
  align-items: center;
  min-height: 42px;
  border: 1px solid var(--bujo-line-soft);
  background: var(--bujo-surface-muted);
  padding: 6px 10px;
  color: var(--bujo-ink);
  font-size: 13px;
}

.line-onboarding-steps span {
  color: var(--bujo-muted-strong);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
}

.line-onboarding-primary {
  display: inline-flex;
  min-height: 34px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--bujo-ink);
  background: var(--bujo-ink);
  padding: 8px 18px;
  color: var(--bujo-white);
  font-size: 13px;
  font-weight: 600;
  line-height: 1;
  text-decoration: none;
}

.line-onboarding-primary:hover {
  background: var(--bujo-surface);
  color: var(--bujo-ink);
}

.line-onboarding-primary:focus-visible {
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
}
</style>
