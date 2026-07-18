<template>
  <BaseModal :isOpen="true" :title="t('profileAccount.title')" @close="emit('close')">
    <div class="space-y-4">
      <div class="flex items-center gap-3">
        <div
          class="grid h-[60px] w-[60px] shrink-0 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)]"
        >
          <img
            v-if="avatarSrc"
            :src="avatarSrc"
            :alt="displayName"
            class="h-full w-full object-cover"
          />
          <span v-else class="profile-modal-face" aria-hidden="true"></span>
        </div>
        <div class="min-w-0 flex-1">
          <p class="text-sm font-semibold leading-tight text-[var(--bujo-ink)] md:text-base">
            {{ displayName }}
          </p>
          <div v-if="shareCode" class="mt-1 flex min-w-0 items-center gap-2">
            <p class="min-w-0 font-[space-mono] text-sm text-[var(--bujo-muted-strong)]">
              {{ t('profileAccount.bujoIdLabel') }} {{ shareCode }}
            </p>
            <button
              type="button"
              class="grid h-7 w-7 shrink-0 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-[var(--bujo-muted-strong)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)] hover:text-[var(--bujo-ink)]"
              :aria-label="t('profileAccount.copyId')"
              @click="copyShareCode"
            >
              <ClipboardDocumentIcon class="h-4 w-4" aria-hidden="true" />
            </button>
            <p
              v-if="copyStatusMessage"
              class="shrink-0 text-xs text-[var(--bujo-muted-strong)]"
              aria-live="polite"
            >
              {{ copyStatusMessage }}
            </p>
            <button
              type="button"
              class="ml-auto shrink-0 rounded border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-1 text-xs font-semibold text-[var(--bujo-ink)] transition-colors duration-150 hover:bg-[var(--bujo-line-soft)]"
              @click="toggleLanguage"
            >
              {{ locale === 'zh-TW' ? 'EN' : '中文' }}
            </button>
          </div>
        </div>
      </div>

      <RouterLink
        to="/profile/edit"
        class="flex min-h-[60px] items-center gap-4 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
        @click="emit('close')"
      >
        <span class="profile-action-icon profile-action-icon--edit" aria-hidden="true"></span>
        <span class="flex flex-1 flex-col items-center leading-tight">
          <span class="text-sm font-semibold">{{ t('profileAccount.editProfile') }}</span>
          <span class="mt-1 text-xs text-[var(--bujo-muted-strong)]">{{
            t('profileAccount.editSubtitle')
          }}</span>
        </span>
      </RouterLink>

      <button
        type="button"
        class="flex min-h-[60px] w-full items-center gap-4 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
        @click="emit('logout')"
      >
        <span class="profile-action-icon profile-action-icon--logout" aria-hidden="true"></span>
        <span class="flex flex-1 flex-col items-center leading-tight">
          <span class="text-sm font-semibold">{{ t('profileAccount.logoutButton') }}</span>
          <span class="mt-1 text-xs text-[var(--bujo-muted-strong)]">{{
            t('profileAccount.logoutSubtitle')
          }}</span>
        </span>
      </button>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import BaseModal from './ui/BaseModal.vue'
import { toAvatarSrc } from '@/utils/avatar'
import { useLocaleStore } from '@/stores/locale'

const { t, locale } = useI18n()
const localeStore = useLocaleStore()

const props = defineProps({
  user: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'logout'])

const displayName = computed(() => props.user?.display_name || t('profileAccount.notLoggedIn'))
const avatarSrc = computed(() => toAvatarSrc(props.user?.avatar_url))
const shareCode = computed(() => {
  const idSource = props.user?.uid ?? props.user?.id
  return idSource ? String(idSource).slice(-5) : ''
})
const copyStatus = ref('idle')
const copyStatusMessage = computed(() => {
  if (copyStatus.value === 'success') return t('profileAccount.copied')
  if (copyStatus.value === 'error') return t('profileAccount.copyFailed')
  return ''
})

function toggleLanguage() {
  const newLocale = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  localeStore.setLocale(newLocale, { global: { locale } })
}

async function copyShareCode() {
  if (!shareCode.value) return

  try {
    if (!navigator.clipboard?.writeText) {
      throw new Error('Clipboard API unavailable')
    }
    await navigator.clipboard.writeText(shareCode.value)
    copyStatus.value = 'success'
  } catch {
    copyStatus.value = 'error'
  }
}
</script>

<style scoped>
.profile-modal-face {
  position: relative;
  display: block;
  width: 32px;
  height: 32px;
  background:
    linear-gradient(var(--bujo-ink) 0 0) 8px 4px / 16px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 4px 8px / 4px 16px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 24px 8px / 4px 16px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 8px 24px / 16px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 12px 12px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 20px 12px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 16px 20px / 4px 4px no-repeat;
}

.profile-modal-face::before,
.profile-modal-face::after {
  position: absolute;
  top: 0;
  width: 8px;
  height: 8px;
  background: var(--bujo-ink);
  content: '';
}
.profile-modal-face::before {
  left: 4px;
}
.profile-modal-face::after {
  right: 4px;
}

.profile-action-icon {
  position: relative;
  display: block;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
}

.profile-action-icon--edit {
  background:
    linear-gradient(var(--bujo-ink) 0 0) 2px 2px / 4px 8px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 10px 2px / 4px 8px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 18px 2px / 4px 8px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 2px 14px / 4px 10px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 10px 18px / 4px 8px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 18px 14px / 4px 10px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 24px 6px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 24px 22px / 4px 4px no-repeat;
}

.profile-action-icon--logout {
  background:
    linear-gradient(var(--bujo-ink) 0 0) 12px 2px / 6px 6px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 9px 8px / 12px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 6px 12px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 20px 12px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 3px 16px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 23px 16px / 4px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 6px 20px / 18px 4px no-repeat,
    linear-gradient(var(--bujo-ink) 0 0) 2px 24px / 26px 4px no-repeat;
}
</style>
