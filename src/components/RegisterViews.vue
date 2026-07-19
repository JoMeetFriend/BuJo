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
            <span class="text-[var(--bujo-muted-strong)]">👤</span>
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
            <span class="text-[var(--bujo-muted-strong)]">✉</span>
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
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import bujoLogoUrl from '@/assets/bujo-logo-auth.svg'

const router = useRouter()
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
