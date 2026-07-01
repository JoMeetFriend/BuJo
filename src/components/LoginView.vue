<!-- src/views/LoginView.vue -->
<template>
  <div class="min-h-screen bg-page-bg bg-dot-pattern flex items-center justify-center p-6">
    <div
      class="bg-page-bg w-full max-w-[26.4rem] p-7 border-2 border-brand-text shadow-pixel hover:shadow-pixel-pressed hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
    >
      <!-- Logo -->
      <div class="flex flex-col items-center mb-6">
        <div class="flex items-center gap-3">
          <div
            class="w-10 h-10 bg-primary-green flex items-center justify-center shrink-0 border-2 border-brand-text shadow-pixel-sm"
          >
            <!-- 之後換成 <img src="@/assets/logo.png" class="w-10 h-10" /> -->
            <span class="text-page-bg text-2xl">🗓</span>
          </div>
          <h1
            class="text-4xl font-bold text-primary-green font-cubic11 tracking-[0.6px] [text-shadow:2px_2px_0_#4A5040]"
          >
            BuJo
          </h1>
        </div>
        <p class="text-sm text-primary-mid mt-1 relative top-[0.25em]">不揪喔～說完，你就揪到了</p>
      </div>

      <!-- 表單 -->
      <form @submit.prevent="handleLogin" class="space-y-3">
        <!-- 電子郵件 -->
        <div>
          <label class="block text-sm text-brand-text mb-1">電子郵件</label>
          <div
            class="flex items-center gap-2 border-[1.5px] border-primary-mid px-3 bg-primary-pale"
          >
            <span class="text-brand-text">✉</span>
            <input
              v-model="form.email"
              type="email"
              placeholder="user@gmail.com"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-brand-text"
            />
          </div>
        </div>

        <!-- 密碼 -->
        <div>
          <label class="block text-sm text-brand-text mb-1">密碼</label>
          <div
            class="flex items-center gap-2 border-[1.5px] border-primary-mid px-3 bg-primary-pale"
          >
            <span class="text-brand-text"></span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-brand-text"
            />
            <button type="button" @click="showPassword = !showPassword" class="text-brand-text">
              <EyeIcon v-if="!showPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 忘記密碼 -->
        <div class="flex justify-end">
          <router-link to="/forgot-password" class="text-sm text-brand-text">
            忘記密碼？
          </router-link>
        </div>

        <!-- 錯誤訊息 -->
        <p v-if="errorMsg" class="text-xs text-red-600 border border-red-300 bg-red-50 px-3 py-2">
          {{ errorMsg }}
        </p>

        <!-- 登入按鈕 -->
        <button
          type="submit"
          :disabled="isLoading"
          class="w-full bg-primary-green hover:bg-primary-mid text-brand-text py-2 text-sm font-semibold flex items-center justify-center gap-2 border-2 border-brand-text shadow-pixel hover:shadow-pixel-pressed hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 disabled:opacity-50 disabled:cursor-not-allowed disabled:translate-x-0 disabled:translate-y-0 disabled:shadow-pixel"
        >
          {{ isLoading ? '登入中...' : '登入' }}
        </button>
      </form>

      <!-- 分隔線 -->
      <div class="flex items-center gap-3 my-4">
        <div class="flex-1 h-px bg-primary-pale"></div>
        <span class="text-xs text-primary-mid">或</span>
        <div class="flex-1 h-px bg-primary-pale"></div>
      </div>

      <!-- Google 登入 -->
      <button
        @click="handleGoogleLogin"
        data-testid="google-login"
        class="w-full border-2 border-brand-text shadow-pixel hover:shadow-pixel-pressed hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 py-2 text-sm text-brand-text flex items-center justify-center gap-2 hover:bg-primary-light"
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
        使用 Google 帳號快速登入
      </button>

      <!-- LINE 登入 -->
      <button
        @click="handleLineLogin"
        class="w-full border-2 border-brand-text shadow-pixel hover:shadow-pixel-pressed hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100 py-2 text-sm text-brand-text flex items-center justify-center gap-2 hover:bg-primary-light mt-2"
      >
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
        使用 LINE 快速登入
      </button>

      <!-- 註冊連結 -->
      <p class="text-center text-sm text-brand-text mt-4">
        還沒有帳號？
        <router-link to="/register" class="text-primary-mid font-semibold">前往註冊</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, onMounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const showPassword = ref(false)
const isLoading = ref(false)
const errorMsg = ref('')

const form = reactive({
  email: '',
  password: '',
})

const handleLogin = async () => {
  errorMsg.value = ''

  if (!form.email || !form.password) {
    errorMsg.value = '請填寫電子郵件與密碼'
    return
  }

  isLoading.value = true
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ email: form.email, password: form.password }),
    })

    const data = await res.json()

    if (res.status === 429) {
      const retryAfter = res.headers.get('Retry-After')
      const waitMin = retryAfter ? Math.ceil(Number(retryAfter) / 60) : 15
      errorMsg.value = data.error || `登入嘗試過多，請 ${waitMin} 分鐘後再試`
      return
    }

    if (!res.ok) {
      errorMsg.value = data.error || '登入失敗，請確認帳號密碼'
      return
    }

    authStore.setUser(data.user)
    router.push('/')
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
    if (!res.ok) throw new Error(data.error || 'Google 登入失敗')
    authStore.setUser(data.user)
    router.push('/')
  } catch (err) {
    errorMsg.value = err.message || 'Google 登入失敗，請稍後再試'
  }
}

const handleGoogleLogin = () => {
  window.google?.accounts.id.prompt()
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
  -webkit-box-shadow: 0 0 0px 1000px #DEF4CD inset;
  -webkit-text-fill-color: #4A5040;
  transition: background-color 9999s ease-in-out 0s;
}

.bg-dot-pattern {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='320'%20height='320'%3E%3Cfilter%20id='b'%3E%3CfeGaussianBlur%20stdDeviation='1.2'/%3E%3C/filter%3E%3Cg%20filter='url(%23b)'%3E%3Crect%20x='20'%20y='30'%20width='1'%20height='1'%20fill='%2387C06D'/%3E%3Crect%20x='120'%20y='60'%20width='2'%20height='2'%20fill='%23F9CE9A'/%3E%3Crect%20x='250'%20y='40'%20width='3'%20height='3'%20fill='%23E9EF6E'/%3E%3Crect%20x='60'%20y='150'%20width='4'%20height='4'%20fill='%239DBD86'/%3E%3Crect%20x='200'%20y='180'%20width='5'%20height='5'%20fill='%2387C06D'/%3E%3Crect%20x='280'%20y='250'%20width='6'%20height='6'%20fill='%23F9CE9A'/%3E%3Crect%20x='40'%20y='260'%20width='7'%20height='7'%20fill='%23E9EF6E'/%3E%3Crect%20x='160'%20y='290'%20width='8'%20height='8'%20fill='%239DBD86'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
}
</style>
