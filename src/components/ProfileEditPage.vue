<template>
  <main
    class="min-h-screen shrink-0 bg-[var(--bujo-page)] px-5 pt-8 pb-4 md:px-14 text-[var(--bujo-ink)]"
  >
    <!-- 頁首 -->
    <header class="mb-5">
      <p class="profile-eyebrow">ACCOUNT SETTINGS</p>
      <div class="profile-title-line">
        <h1>個人編輯頁面</h1>
        <span class="profile-cn-tag">ME</span>
      </div>
    </header>

    <!-- 主卡片 -->
    <section
      class="profile-card w-full max-w-[800px] border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)]"
    >
      <!-- 頭像 -->
      <div class="px-5 py-4">
        <div class="flex flex-col items-start gap-4 md:flex-row md:items-stretch md:gap-8">
          <div
            class="size-24 shrink-0 overflow-hidden border border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] md:size-28"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="使用者頭像"
              class="size-full object-cover"
            />
          </div>
          <div class="flex min-w-0 flex-col items-start gap-2 md:h-28">
            <p class="flex h-8 items-center text-base leading-none md:text-lg">{{ displayName }}</p>
            <div v-if="shareCode" class="flex h-8 min-w-0 items-center gap-2">
              <p class="min-w-0 font-[space-mono] text-sm text-[var(--bujo-muted-strong)]">
                Bujo ID: {{ shareCode }}
              </p>
              <button
                type="button"
                class="grid h-7 w-7 shrink-0 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-[var(--bujo-muted-strong)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)] hover:text-[var(--bujo-ink)]"
                aria-label="複製 BuJo ID"
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
            </div>
            <label
              :class="['profile-upload-btn', avatarLoading ? 'pointer-events-none opacity-60' : '']"
            >
              <input
                class="hidden"
                type="file"
                accept="image/png, image/jpeg, image/webp"
                :disabled="avatarLoading"
                @change="handleAvatarChange"
              />
              {{ avatarLoading ? '更換中' : '更換頭像' }}
            </label>
          </div>

          <div
            class="flex-1 w-full min-w-0 flex flex-col mt-4 md:mt-0 border-t md:border-t-0 md:border-l border-[var(--bujo-line-soft)] pt-4 md:pt-0 md:pl-8"
          >
            <div class="flex items-center justify-between mb-2">
              <div class="flex items-center gap-3">
                <span class="text-xs font-semibold text-[var(--bujo-ink)]">個人簡介</span>
                <span
                  v-if="bioSuccessMsg"
                  class="text-xs text-[var(--bujo-ink)] transition-opacity"
                  aria-live="polite"
                >
                  {{ bioSuccessMsg }}
                </span>
              </div>

              <span
                v-if="isEditingBio"
                class="font-[space-mono] text-[11px] text-[var(--bujo-muted-strong)]"
              >
                {{ editBio.length }} / 150
              </span>
              <button
                v-else
                type="button"
                class="text-xs text-[var(--bujo-muted-strong)] underline hover:text-[var(--bujo-ink)]"
                @click="startEditBio"
              >
                編輯
              </button>
            </div>

            <div v-if="isEditingBio" class="flex flex-col h-full gap-2">
              <textarea
                v-model="editBio"
                maxlength="150"
                :disabled="isBioLoading"
                class="profile-textarea flex-1 min-h-[80px] w-full p-3 text-sm resize-none"
                placeholder="寫點什麼讓大家更認識你..."
                @input="bioErrorMsg = ''"
              ></textarea>

              <p v-if="bioErrorMsg" class="text-xs text-[#dc2626]" aria-live="polite">
                {{ bioErrorMsg }}
              </p>

              <div class="flex justify-end gap-2">
                <PixelButton
                  variant="white"
                  type="button"
                  @click="cancelEditBio"
                  :disabled="isBioLoading"
                  >取消</PixelButton
                >
                <PixelButton type="button" @click="handleBioSubmit" :disabled="isBioLoading">
                  {{ isBioLoading ? '儲存中' : '儲存' }}
                </PixelButton>
              </div>
            </div>

            <div
              v-else
              class="flex-1 text-sm text-[var(--bujo-text-body)] leading-relaxed whitespace-pre-wrap break-words"
            >
              <span v-if="authStore.user?.bio">{{ authStore.user.bio }}</span>
              <span v-else class="text-[var(--bujo-muted)] italic">尚未填寫簡介...</span>
            </div>
          </div>
        </div>
        <p
          v-if="avatarMsg"
          :class="[
            'mt-3 text-xs',
            avatarMsgType === 'error' ? 'text-[#dc2626]' : 'text-[var(--bujo-muted-strong)]',
          ]"
          aria-live="polite"
        >
          {{ avatarMsg }}
        </p>
      </div>

      <!-- 基本資料 -->
      <header class="profile-section-header">
        <h2>基本資料</h2>
      </header>
      <form class="px-5 py-4 grid gap-4" @submit.prevent="handleNameSubmit">
        <label class="grid gap-1.5">
          <span class="text-xs font-semibold text-[var(--bujo-ink)]">
            修改顯示名稱 <strong class="text-[var(--bujo-muted-strong)]">*</strong>
          </span>
          <input
            v-model="editName"
            :disabled="userStore.isLoading"
            class="profile-input h-9 w-full px-4 text-[12px]"
            type="text"
            placeholder="請輸入顯示名稱"
            @input="userStore.errorMsg = ''"
          />
          <p class="text-xs text-[var(--bujo-muted)]">顯示名稱會出現在揪團、行事曆與留言中。</p>
        </label>

        <p v-if="userStore.errorMsg" class="text-xs text-[#dc2626]" aria-live="polite">
          {{ userStore.errorMsg }}
        </p>
        <p v-if="userStore.successMsg" class="text-xs text-[var(--bujo-ink)]" aria-live="polite">
          {{ userStore.successMsg }}
        </p>

        <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <PixelButton
            variant="white"
            type="button"
            :disabled="userStore.isLoading"
            @click="editName = authStore.user?.display_name || ''"
            >取消</PixelButton
          >
          <PixelButton type="submit" :disabled="userStore.isLoading">{{
            userStore.isLoading ? '儲存中...' : '儲存變更'
          }}</PixelButton>
        </div>
      </form>

      <!-- 已連接的登入方式 -->
      <header class="profile-section-header">
        <h2>已連接的登入方式</h2>
      </header>
      <div class="px-5 py-4 grid gap-3">
        <!-- 錯誤／成功訊息 -->
        <p
          v-if="linkMsg"
          :class="[
            'text-xs px-3 py-2 border',
            linkMsgType === 'error'
              ? 'text-[#dc2626] border-[#dc2626] bg-[var(--bujo-surface)]'
              : 'text-[var(--bujo-ink)] border-[var(--bujo-accent)] bg-[var(--bujo-surface)]',
          ]"
        >
          {{ linkMsg }}
        </p>

        <!-- 帳號密碼 -->
        <div class="profile-identity-row">
          <div class="flex items-center gap-3">
            <span class="text-lg">✉</span>
            <div>
              <p class="text-sm font-semibold">帳號密碼</p>
              <p class="text-xs text-[var(--bujo-muted-strong)]">{{ localEmail || '未設定' }}</p>
            </div>
          </div>
          <span v-if="isConnected('local')" class="profile-connected-badge">已連接</span>
        </div>

        <!-- Google -->
        <div class="profile-identity-row">
          <div class="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 48 48" class="shrink-0">
              <path
                fill="#EA4335"
                d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
              />
              <path
                fill="#4285F4"
                d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
              />
              <path
                fill="#FBBC05"
                d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
              />
              <path
                fill="#34A853"
                d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
              />
            </svg>
            <div>
              <p class="text-sm font-semibold">Google</p>
              <p class="text-xs text-[var(--bujo-muted-strong)]">{{ googleEmail || '' }}</p>
            </div>
          </div>
          <button
            v-if="!isConnected('google')"
            @click="handleGoogleLink"
            :disabled="linkLoading"
            class="profile-link-btn"
          >
            連接
          </button>
          <button
            v-else
            @click="handleUnlink('google')"
            :disabled="linkLoading || identityCount <= 1"
            class="profile-unlink-btn"
          >
            解除連接
          </button>
        </div>

        <!-- LINE -->
        <div class="profile-identity-row">
          <div class="flex items-center gap-3">
            <svg width="20" height="20" viewBox="0 0 48 48" fill="none" class="shrink-0">
              <rect width="48" height="48" rx="10" fill="#00B900" />
              <path
                d="M40 22.2C40 15.1 32.8 9.3 24 9.3S8 15.1 8 22.2c0 6.4 5.7 11.7 13.3 12.7.5.1 1.2.3 1.4.8.2.4.1 1 .1 1.4l-.2 1.4c-.1.5-.4 1.8 1.6.99 2-.8 10.8-6.4 14.7-10.9C39.1 26.1 40 24.3 40 22.2z"
                fill="white"
              />
              <path
                d="M20.3 19.5h-1.2c-.2 0-.4.2-.4.4v7.4c0 .2.2.4.4.4h1.2c.2 0 .4-.2.4-.4v-7.4c0-.2-.2-.4-.4-.4zM29.1 19.5h-1.2c-.2 0-.4.2-.4.4v4.4l-3.4-4.6c0-.1-.1-.1-.1-.2h-1.3c-.2 0-.4.2-.4.4v7.4c0 .2.2.4.4.4H24c.2 0 .4-.2.4-.4v-4.4l3.4 4.6c.1.1.2.2.3.2h1.2c.2 0 .4-.2.4-.4v-7.4c-.2-.2-.4-.4-.6-.4zM17.4 25.7h-3.3v-5.8c0-.2-.2-.4-.4-.4h-1.2c-.2 0-.4.2-.4.4v7.4c0 .1.1.2.1.3.1.1.2.1.3.1h4.9c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4zM35.9 21.5c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4H31c-.1 0-.2 0-.3.1-.1.1-.1.2-.1.3v7.4c0 .1 0 .2.1.3.1.1.2.1.3.1h4.9c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4h-3.3v-1.3h3.3c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4h-3.3v-1.3h3.3z"
                fill="#00B900"
              />
            </svg>
            <div>
              <p class="text-sm font-semibold">LINE</p>
              <p class="text-xs text-[var(--bujo-muted-strong)]">
                {{ isConnected('line') ? '已連接' : '' }}
              </p>
            </div>
          </div>
          <button
            v-if="!isConnected('line')"
            @click="handleLineLink"
            :disabled="linkLoading"
            class="profile-link-btn"
          >
            連接
          </button>
          <button
            v-else
            @click="handleUnlink('line')"
            :disabled="linkLoading || identityCount <= 1"
            class="profile-unlink-btn"
          >
            解除連接
          </button>
        </div>

        <p v-if="identityCount <= 1" class="text-xs text-[var(--bujo-muted)]">
          需要至少連接兩種登入方式才能解除其中一個。
        </p>
      </div>

      <footer class="flex justify-end border-t border-[var(--bujo-line)] px-5 py-4">
        <PixelButton
          variant="danger"
          class="profile-logout-btn"
          type="button"
          :disabled="logoutLoading"
          aria-label="登出目前帳號"
          @click="handleLogout"
        >
          {{ logoutLoading ? '登出中' : '登出' }}
        </PixelButton>
      </footer>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ClipboardDocumentIcon } from '@heroicons/vue/24/outline'
import PixelButton from './ui/PixelButton.vue'
import { useAuthStore } from '@/stores/auth'
import { toAvatarSrc } from '@/utils/avatar'
import { useUserStore } from '@/stores/userStore'

const authStore = useAuthStore()
const userStore = useUserStore()
const route = useRoute()
const router = useRouter()
const API = import.meta.env.VITE_API_URL || ''

const avatarUrl = ref(toAvatarSrc(authStore.user?.avatar_url || ''))
const avatarLoading = ref(false)
const avatarMsg = ref('')
const avatarMsgType = ref('success')
const linkLoading = ref(false)
const logoutLoading = ref(false)
const linkMsg = ref('')
const linkMsgType = ref('success')
const copyStatus = ref('idle')
const editName = ref(authStore.user?.display_name || '')
const isEditingBio = ref(false)
const editBio = ref('')
const bioSuccessMsg = ref('')
const isBioLoading = ref(false)
const bioErrorMsg = ref('')

const identities = computed(() => authStore.user?.identities ?? [])
const identityCount = computed(() => identities.value.length)
const displayName = computed(() => authStore.user?.display_name || '未登入')
const shareCode = computed(() => {
  const idSource = authStore.user?.uid ?? authStore.user?.id
  return idSource ? String(idSource).slice(-5) : ''
})
const copyStatusMessage = computed(() => {
  if (copyStatus.value === 'success') return '已複製'
  if (copyStatus.value === 'error') return '複製失敗'
  return ''
})

const isConnected = (provider) => identities.value.some((i) => i.provider === provider)
const localEmail = computed(() => identities.value.find((i) => i.provider === 'local')?.email ?? '')
const googleEmail = computed(
  () => identities.value.find((i) => i.provider === 'google')?.email ?? '',
)

function showAvatarMsg(msg, type = 'success') {
  avatarMsg.value = msg
  avatarMsgType.value = type
}

const handleAvatarChange = async (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  avatarMsg.value = ''

  if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    showAvatarMsg('僅支援 JPG、PNG、WebP 格式', 'error')
    event.target.value = ''
    return
  }

  if (file.size > 2 * 1024 * 1024) {
    showAvatarMsg('圖片大小不可超過 2MB', 'error')
    event.target.value = ''
    return
  }

  avatarLoading.value = true
  try {
    const formData = new FormData()
    formData.append('avatar', file)

    const res = await fetch(`${API}/api/users/me/avatar`, {
      method: 'PATCH',
      credentials: 'include',
      body: formData,
    })
    const data = await res.json().catch(() => ({}))
    if (!res.ok) throw new Error(data.message || '頭像更新失敗')
    if (!data.user?.avatar_url) throw new Error('頭像更新失敗')

    authStore.setUser({
      ...authStore.user,
      ...data.user,
    })
    avatarUrl.value = toAvatarSrc(data.user.avatar_url)
    showAvatarMsg('頭像已更新')
  } catch (err) {
    showAvatarMsg(err.message || '頭像更新失敗', 'error')
  } finally {
    avatarLoading.value = false
    event.target.value = ''
  }
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

function showMsg(msg, type = 'success') {
  linkMsg.value = msg
  linkMsgType.value = type
  setTimeout(() => (linkMsg.value = ''), 4000)
}

// Google link
const handleGoogleLinkCredential = async (response) => {
  linkLoading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google/link`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Google 連結失敗')
    await authStore.fetchMe()
    showMsg('Google 帳號連結成功')
  } catch (err) {
    showMsg(err.message || 'Google 連結失敗', 'error')
  } finally {
    linkLoading.value = false
  }
}

const handleGoogleLink = () => {
  window.google?.accounts.id.prompt()
}

// LINE link — redirects through backend OAuth flow
const handleLineLink = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/line/link`
}

// Unlink
const handleUnlink = async (provider) => {
  if (identityCount.value <= 1) return
  linkLoading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/${provider}/unlink`, {
      method: 'DELETE',
      credentials: 'include',
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || '解除連結失敗')
    await authStore.fetchMe()
    showMsg('已解除連結')
  } catch (err) {
    showMsg(err.message || '解除連結失敗', 'error')
  } finally {
    linkLoading.value = false
  }
}

async function handleLogout() {
  if (logoutLoading.value) return

  logoutLoading.value = true
  try {
    await authStore.logout()
  } catch {
    authStore.clearUser()
  } finally {
    logoutLoading.value = false
    router.replace('/login')
  }
}

onMounted(async () => {
  // LINE link callback redirects back with ?linked=line
  if (route.query.linked === 'line') {
    await authStore.fetchMe()
    showMsg('LINE 帳號連結成功')
    router.replace({ query: {} })
  }

  // Init Google SDK for linking
  if (window.google) {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleLinkCredential,
    })
    return
  }
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleGoogleLinkCredential,
    })
  }
  document.head.appendChild(script)
})

const handleNameSubmit = async () => {
  await userStore.updateName(editName.value)
  editName.value = authStore.user?.display_name || ''
}

const startEditBio = () => {
  editBio.value = authStore.user?.bio || ''
  isEditingBio.value = true
}

const cancelEditBio = () => {
  isEditingBio.value = false
  editBio.value = ''
  bioErrorMsg.value = ''
}

const handleBioSubmit = async () => {
  isBioLoading.value = true
  bioErrorMsg.value = ''

  const result = await userStore.updateBio(editBio.value)

  isBioLoading.value = false

  if (result.success) {
    isEditingBio.value = false
    bioSuccessMsg.value = '簡介更新成功'
    setTimeout(() => {
      bioSuccessMsg.value = ''
    }, 4000)
  } else {
    bioErrorMsg.value = result.error
    setTimeout(() => {
      bioErrorMsg.value = ''
    }, 4000)
  }
}
</script>

<style scoped>
.profile-card {
  box-shadow: 7px 8px 0 rgb(var(--bujo-ink-rgb) / 0.06);
}

.profile-logout-btn {
  border-color: #dc2626;
  color: #dc2626;
}

.profile-logout-btn:hover:not(:disabled) {
  border-color: #ef4444;
  background: #fef2f2;
  color: #ef4444;
}

.profile-eyebrow {
  margin: 0 0 2px;
  color: var(--bujo-muted-strong);
  font-family: 'Space Mono', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
}

.profile-title-line {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.profile-title-line h1 {
  margin: 0;
  color: var(--bujo-ink);
  font-family: var(--bujo-font-heading);
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 700;
  line-height: 1.1;
  letter-spacing: 0;
}

.profile-cn-tag {
  color: var(--bujo-muted);
  font-family: 'Space Mono', monospace;
  font-size: 13px;
  letter-spacing: 0.1em;
}

.profile-section-header {
  display: flex;
  align-items: center;
  border-top: 1px solid var(--bujo-line);
  border-bottom: 1px solid var(--bujo-line);
  background: var(--bujo-surface-muted);
  padding: 12px 20px;
}

.profile-section-header h2 {
  margin: 0;
  font-size: 15px;
  font-weight: 700;
  line-height: 1;
}

.profile-input {
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  color: var(--bujo-ink);
  outline: none;
  transition:
    border-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    box-shadow 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.profile-input::placeholder {
  color: var(--bujo-muted);
}

.profile-input:focus {
  border-color: var(--bujo-accent);
  box-shadow: inset 0 0 0 1px var(--bujo-accent);
}

.profile-upload-btn {
  display: inline-flex;
  height: 32px;
  width: fit-content;
  cursor: pointer;
  align-items: center;
  justify-content: center;
  gap: 8px;
  border: 1px solid var(--bujo-ink);
  background: transparent;
  padding: 0 16px;
  font-size: 12px;
  font-weight: 600;
  color: var(--bujo-ink);
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.profile-upload-btn:hover {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.profile-identity-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border: 1px solid var(--bujo-line);
  background: var(--bujo-surface);
  padding: 12px 16px;
}

.profile-connected-badge {
  border: 1px solid var(--bujo-accent);
  padding: 2px 8px;
  font-size: 11px;
  color: var(--bujo-ink);
}

.profile-link-btn,
.profile-unlink-btn {
  border: 1px solid var(--bujo-ink);
  background: transparent;
  padding: 5px 12px;
  font-size: 12px;
  color: var(--bujo-ink);
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    color 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.profile-link-btn:hover:not(:disabled) {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.profile-unlink-btn {
  border-color: var(--bujo-line);
  color: var(--bujo-muted-strong);
}

.profile-unlink-btn:hover:not(:disabled) {
  border-color: var(--bujo-ink);
  color: var(--bujo-ink);
}

.profile-link-btn:disabled,
.profile-unlink-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}
</style>
