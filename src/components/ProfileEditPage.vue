<template>
  <main class="min-h-screen bg-[#FEF7E8] px-5 pt-8 pb-4 md:px-14 font-[cubic11] text-[#4A5040]">
    <!-- 頁首 -->
    <header class="mb-5 flex items-baseline gap-4">
      <h1
        class="font-[cubic11] font-bold text-[#4A5040] text-2xl md:text-3xl"
        style="text-shadow: 2px 2px 0px #e4ded1"
      >
        個人編輯
      </h1>
      <span class="font-['Press_Start_2P'] text-[#9DBD86] text-base tracking-widest uppercase"
        >ME</span
      >
    </header>

    <!-- 主卡片 -->
    <section
      class="w-full max-w-[800px] border-2 border-[#4A5040] bg-white shadow-[6px_6px_0_#4A5040] max-sm:shadow-[4px_4px_0_#4A5040]"
    >
      <!-- 頭像 -->
      <header class="flex items-center border-b-2 border-[#DEF4CD] bg-[#D9F0A8] px-5 py-3">
        <h2 class="text-base leading-none md:text-lg" style="-webkit-text-stroke: 0.5px #4a5040">
          頭像
        </h2>
      </header>
      <div class="px-5 py-4">
        <div class="flex flex-col items-start gap-4 md:flex-row md:items-center md:gap-8">
          <div
            class="size-24 shrink-0 overflow-hidden border-2 border-[#4A5040] bg-[#DEF4CD] shadow-[4px_4px_0_#4A5040] md:size-28"
          >
            <img
              v-if="avatarUrl"
              :src="avatarUrl"
              alt="使用者頭像"
              class="size-full object-cover"
            />
          </div>
          <div class="grid gap-2">
            <label
              class="inline-flex h-9 w-fit cursor-pointer items-center justify-center gap-2 border-2 border-[#4A5040] bg-[#87C06D] px-4 text-[12px] text-white shadow-[3px_3px_0_#4A5040] transition-all duration-150 hover:bg-[#69AD76] hover:border-[#0E7490] hover:shadow-[3px_3px_0_#0E7490]"
            >
              <input
                class="hidden"
                type="file"
                accept="image/png, image/jpeg"
                @change="handleAvatarChange"
              />
              ▲ 上傳照片
            </label>
            <p class="text-xs text-[#9DBD86]">支援 JPG、PNG，建議使用正方形圖片。</p>
          </div>
        </div>
      </div>

      <!-- 基本資料 -->
      <header class="flex items-center border-y-2 border-[#DEF4CD] bg-[#D9F0A8] px-5 py-3">
        <h2 class="text-base leading-none md:text-lg" style="-webkit-text-stroke: 0.5px #4a5040">
          基本資料
        </h2>
      </header>
      <form class="px-5 py-4 grid gap-4" @submit.prevent>
        <label class="grid gap-1.5">
          <span class="text-xs field-label">
            修改顯示名稱 <strong class="text-[#87C06D]" style="-webkit-text-stroke: 0">*</strong>
          </span>
          <input
            class="h-9 w-full border-2 border-[#4A5040] bg-[#FEF7E8] px-4 text-[12px] shadow-[3px_3px_0_#4A5040] outline-none transition-all duration-150 placeholder:text-[#9DBD86] focus:bg-white focus:shadow-[4px_4px_0_#4A5040]"
            type="text"
            placeholder="請輸入顯示名稱"
          />
          <p class="text-xs text-[#9DBD86]">顯示名稱會出現在揪團、行事曆與留言中。</p>
        </label>

        <div class="grid gap-1.5">
          <span class="text-xs field-label">電子郵件</span>
          <div
            class="flex h-9 w-full items-center border-2 border-[#DEF4CD] bg-[#FEF7E8] px-4 text-[12px] text-[#9DBD86]"
          >
            {{ localEmail || '（未設定）' }}
          </div>
        </div>

        <div class="mt-1 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <PixelButton variant="white" type="button">取消</PixelButton>
          <PixelButton type="submit">儲存變更</PixelButton>
        </div>
      </form>

      <!-- 已連接的登入方式 -->
      <header class="flex items-center border-y-2 border-[#DEF4CD] bg-[#D9F0A8] px-5 py-3">
        <h2 class="text-base leading-none md:text-lg" style="-webkit-text-stroke: 0.5px #4a5040">
          已連接的登入方式
        </h2>
      </header>
      <div class="px-5 py-4 grid gap-3">
        <!-- 錯誤／成功訊息 -->
        <p
          v-if="linkMsg"
          :class="[
            'text-xs px-3 py-2 border',
            linkMsgType === 'error'
              ? 'text-red-600 border-red-300 bg-red-50'
              : 'text-green-700 border-green-300 bg-green-50',
          ]"
        >
          {{ linkMsg }}
        </p>

        <!-- 帳號密碼 -->
        <div class="flex items-center justify-between border-2 border-[#DEF4CD] px-4 py-3">
          <div class="flex items-center gap-3">
            <span class="text-lg">✉</span>
            <div>
              <p class="text-sm font-semibold">帳號密碼</p>
              <p class="text-xs text-[#9DBD86]">{{ localEmail || '未設定' }}</p>
            </div>
          </div>
          <span
            v-if="isConnected('local')"
            class="text-xs text-[#87C06D] border border-[#87C06D] px-2 py-0.5"
            >已連接</span
          >
        </div>

        <!-- Google -->
        <div class="flex items-center justify-between border-2 border-[#DEF4CD] px-4 py-3">
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
              <p class="text-xs text-[#9DBD86]">{{ googleEmail || '' }}</p>
            </div>
          </div>
          <button
            v-if="!isConnected('google')"
            @click="handleGoogleLink"
            :disabled="linkLoading"
            class="text-xs border-2 border-[#4A5040] bg-[#87C06D] text-white px-3 py-1 shadow-[2px_2px_0_#4A5040] hover:bg-[#69AD76] disabled:opacity-50"
          >
            連接
          </button>
          <button
            v-else
            @click="handleUnlink('google')"
            :disabled="linkLoading || identityCount <= 1"
            class="text-xs border-2 border-[#4A5040] bg-white text-[#4A5040] px-3 py-1 shadow-[2px_2px_0_#4A5040] hover:bg-[#FEF7E8] disabled:opacity-40"
          >
            解除連接
          </button>
        </div>

        <!-- LINE -->
        <div class="flex items-center justify-between border-2 border-[#DEF4CD] px-4 py-3">
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
              <p class="text-xs text-[#9DBD86]">{{ isConnected('line') ? '已連接' : '' }}</p>
            </div>
          </div>
          <button
            v-if="!isConnected('line')"
            @click="handleLineLink"
            :disabled="linkLoading"
            class="text-xs border-2 border-[#4A5040] bg-[#00B900] text-white px-3 py-1 shadow-[2px_2px_0_#4A5040] hover:bg-[#009900] disabled:opacity-50"
          >
            連接
          </button>
          <button
            v-else
            @click="handleUnlink('line')"
            :disabled="linkLoading || identityCount <= 1"
            class="text-xs border-2 border-[#4A5040] bg-white text-[#4A5040] px-3 py-1 shadow-[2px_2px_0_#4A5040] hover:bg-[#FEF7E8] disabled:opacity-40"
          >
            解除連接
          </button>
        </div>

        <p v-if="identityCount <= 1" class="text-xs text-[#9DBD86]">
          需要至少連接兩種登入方式才能解除其中一個。
        </p>
      </div>
    </section>
  </main>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PixelButton from './ui/PixelButton.vue'
import { useAuthStore } from '@/stores/auth'

const authStore = useAuthStore()
const route = useRoute()
const router = useRouter()

const avatarUrl = ref(authStore.user?.avatar_url || '')
const linkLoading = ref(false)
const linkMsg = ref('')
const linkMsgType = ref('success')

const identities = computed(() => authStore.user?.identities ?? [])
const identityCount = computed(() => identities.value.length)

const isConnected = (provider) => identities.value.some((i) => i.provider === provider)
const localEmail = computed(() => identities.value.find((i) => i.provider === 'local')?.email ?? '')
const googleEmail = computed(
  () => identities.value.find((i) => i.provider === 'google')?.email ?? '',
)

const handleAvatarChange = (event) => {
  const file = event.target.files?.[0]
  if (!file) return
  avatarUrl.value = URL.createObjectURL(file)
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
</script>

<style scoped>
.field-label {
  -webkit-text-stroke: 0.5px #4a5040;
}
</style>
