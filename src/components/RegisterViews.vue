<!-- src/views/RegisterViews.vue -->
<template>
  <div class="min-h-screen bg-[var(--bujo-page)] flex items-center justify-center p-6">
    <div
      class="relative w-full max-w-[26.4rem] rounded-[6px] border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] p-7"
    >
      <span class="login-deco login-deco--a" aria-hidden="true"></span>
      <span class="login-deco login-deco--b" aria-hidden="true"></span>

      <!-- Logo -->
      <div class="flex flex-col items-center mb-6">
        <img :src="bujoLogoUrl" alt="BuJo" class="bujo-login-logo-image" />
        <p class="text-xs text-[var(--bujo-muted-strong)] mt-2">不揪喔～說完，你就揪到了</p>
      </div>

      <!-- 表單 -->
      <form @submit.prevent="handleRegister" class="space-y-3">
        <!-- 暱稱 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">暱稱</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <UserIcon class="h-4 w-4 text-[var(--bujo-muted-strong)]" aria-hidden="true" />
            <input
              v-model="form.name"
              type="text"
              placeholder="請輸入暱稱"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-[var(--bujo-ink)] placeholder:text-[var(--bujo-muted)]"
            />
          </div>
        </div>

        <!-- 電子郵件 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">電子郵件</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <EnvelopeIcon class="h-4 w-4 text-[var(--bujo-muted-strong)]" aria-hidden="true" />
            <input
              v-model="form.email"
              type="email"
              placeholder="user@gmail.com"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-[var(--bujo-ink)] placeholder:text-[var(--bujo-muted)]"
            />
          </div>
        </div>

        <!-- 密碼 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">密碼</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <span class="text-[var(--bujo-muted-strong)]"></span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-[var(--bujo-ink)] placeholder:text-[var(--bujo-muted)]"
            />
            <button
              type="button"
              @click="showPassword = !showPassword"
              class="text-[var(--bujo-muted-strong)] transition-colors duration-150 hover:text-[var(--bujo-ink)]"
            >
              <EyeIcon v-if="!showPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 確認密碼 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">確認密碼</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <span class="text-[var(--bujo-muted-strong)]"></span>
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-[var(--bujo-ink)] placeholder:text-[var(--bujo-muted)]"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="text-[var(--bujo-muted-strong)] transition-colors duration-150 hover:text-[var(--bujo-ink)]"
            >
              <EyeIcon v-if="!showConfirmPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 錯誤 / 成功訊息 -->
        <p
          v-if="errorMsg"
          class="text-xs border border-[var(--bujo-danger)] bg-[var(--bujo-surface)] text-[var(--bujo-danger)] px-3 py-2"
        >
          {{ errorMsg }}
        </p>
        <p
          v-if="successMsg"
          class="text-xs border border-[var(--bujo-accent)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] px-3 py-2"
        >
          {{ successMsg }}
        </p>

        <!-- 註冊按鈕 -->
        <button type="submit" :disabled="isLoading" class="bujo-hero-btn w-full">
          {{ isLoading ? '註冊中...' : '註冊' }}
        </button>
      </form>

      <!-- 分隔線 -->
      <div class="flex items-center gap-3 my-4">
        <div class="flex-1 h-px bg-[var(--bujo-line-soft)]"></div>
        <span class="text-xs text-[var(--bujo-muted)]">或</span>
        <div class="flex-1 h-px bg-[var(--bujo-line-soft)]"></div>
      </div>

      <!-- Google 註冊 -->
      <button
        @click="handleGoogleLogin"
        data-testid="google-register"
        class="bujo-outline-btn w-full"
      >
        <svg width="18" height="18" viewBox="0 0 48 48">
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
        使用 Google 帳號快速註冊
      </button>

      <!-- LINE 註冊 -->
      <button @click="handleLineLogin" class="bujo-outline-btn w-full">
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none" class="relative -left-[1.5em]">
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
        使用 LINE 快速註冊
      </button>

      <!-- 登入連結 -->
      <p class="text-center text-sm text-[var(--bujo-muted-strong)] mt-4">
        已經有帳號了？
        <router-link
          to="/login"
          class="text-[var(--bujo-ink)] font-semibold underline decoration-[var(--bujo-line)] underline-offset-2"
          >前往登入</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { EyeIcon, EyeSlashIcon, UserIcon, EnvelopeIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import bujoLogoUrl from '@/assets/bujo-logo-auth.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')
const successMsg = ref('')

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const handleRegister = async () => {
  errorMsg.value = ''
  successMsg.value = ''

  if (!form.name || !form.email || !form.password || !form.confirmPassword) {
    errorMsg.value = '請填寫所有欄位'
    return
  }
  if (form.password !== form.confirmPassword) {
    errorMsg.value = '兩次輸入的密碼不一致'
    return
  }
  if (form.password.length < 8) {
    errorMsg.value = '密碼至少需要 8 個字元'
    return
  }

  isLoading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ display_name: form.name, email: form.email, password: form.password }),
    })

    const data = await res.json()

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const waitMin = retryAfter ? Math.ceil(Number(retryAfter) / 60) : 60
      errorMsg.value = data.error || `註冊太頻繁，請 ${waitMin} 分鐘後再試`
      return
    }

    if (res.status === 409) {
      errorMsg.value = '此 Email 已被註冊，請直接登入或使用其他信箱'
      return
    }

    if (!res.ok) {
      errorMsg.value = data.error || '註冊失敗，請稍後再試'
      return
    }

    authStore.setUser(data.user)
    successMsg.value = '註冊成功！即將跳轉...'
    setTimeout(() => router.push('/calendar'), 1200)
  } catch {
    errorMsg.value = '網路錯誤，請確認連線後再試'
  } finally {
    isLoading.value = false
  }
}

const handleCredentialResponse = async (response) => {
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ credential: response.credential }),
    })
    const data = await res.json()
    if (!res.ok) throw new Error(data.error || 'Google 註冊失敗')
    authStore.setUser(data.user)
    router.push('/calendar')
  } catch (err) {
    errorMsg.value = err.message || 'Google 註冊失敗，請稍後再試'
  }
}

const handleGoogleLogin = () => {
  window.google?.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      errorMsg.value = 'Google 註冊目前無法使用，請改用帳密或 LINE 註冊'
    }
  })
}

const handleLineLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/line`
}

onMounted(() => {
  const errorMap = {
    line_cancelled: '已取消 LINE 登入',
    line_login_failed: 'LINE 登入失敗，請再試一次',
  }
  const lineError = errorMap[route.query.error]
  if (lineError) {
    errorMsg.value = lineError
    router.replace({ query: {} })
  }

  if (window.google) return
  const script = document.createElement('script')
  script.src = 'https://accounts.google.com/gsi/client'
  script.onload = () => {
    window.google.accounts.id.initialize({
      client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
      callback: handleCredentialResponse,
    })
  }
  document.head.appendChild(script)
})
</script>

<style scoped>
input:-webkit-autofill,
input:-webkit-autofill:hover,
input:-webkit-autofill:focus {
  -webkit-box-shadow: 0 0 0px 1000px var(--bujo-surface) inset;
  -webkit-text-fill-color: var(--bujo-ink);
  transition: background-color 9999s ease-in-out 0s;
}

.bujo-login-logo-image {
  display: block;
  width: min(178px, 58vw);
  height: auto;
}

.bujo-hero-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  padding: 10px 0;
  border: 1px solid var(--bujo-ink);
  background: var(--bujo-ink);
  color: var(--bujo-white);
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    border-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    transform 100ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-hero-btn:hover:not(:disabled) {
  background: var(--bujo-muted-strong);
  border-color: var(--bujo-muted-strong);
}

.bujo-hero-btn:active:not(:disabled) {
  transform: translate(1px, 1px);
}

.bujo-hero-btn:focus-visible {
  outline: 2px solid var(--bujo-accent);
  outline-offset: 2px;
}

.bujo-hero-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.bujo-outline-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 8px 0;
  border: 1px solid var(--bujo-line);
  background: transparent;
  color: var(--bujo-ink);
  font-size: 14px;
  cursor: pointer;
  transition:
    border-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1),
    background-color 150ms cubic-bezier(0.2, 0.8, 0.2, 1);
}

.bujo-outline-btn:hover {
  border-color: var(--bujo-ink);
  background: var(--bujo-surface-muted);
}

.bujo-outline-btn:active {
  transform: translate(1px, 1px);
}

.bujo-outline-btn + .bujo-outline-btn {
  margin-top: 8px;
}

.login-deco {
  position: absolute;
  width: 8px;
  height: 8px;
  background: var(--bujo-deco-blue);
  animation: login-twinkle 2.4s ease-in-out infinite;
  pointer-events: none;
}

.login-deco--a {
  top: -12px;
  left: 40px;
}

.login-deco--b {
  bottom: 22px;
  right: -10px;
  width: 6px;
  height: 6px;
  background: var(--bujo-deco-pink);
  animation-delay: 1.1s;
}

@keyframes login-twinkle {
  0%,
  100% {
    opacity: 0.35;
    transform: scale(0.85);
  }
  50% {
    opacity: 1;
    transform: scale(1);
  }
}

@media (prefers-reduced-motion: reduce) {
  .login-deco {
    animation: none;
    opacity: 0.7;
  }
}
</style>
