<!-- src/views/RegisterViews.vue -->
<template>
  <div class="min-h-screen bg-[var(--bujo-page)] flex items-center justify-center p-6">
    <div
      class="relative w-full max-w-[26.4rem] rounded-[6px] border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] p-7"
    >
      <span class="login-deco login-deco--a" aria-hidden="true"></span>
      <span class="login-deco login-deco--b" aria-hidden="true"></span>

      <button
        class="absolute top-3 left-3 px-3 py-1 rounded border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-xs font-semibold text-[var(--bujo-ink)] cursor-pointer transition-colors hover:bg-[var(--bujo-line-soft)]"
        @click="toggleLanguage"
      >
        {{ locale === 'zh-TW' ? 'EN' : '中文' }}
      </button>

      <!-- Logo -->
      <div class="flex flex-col items-center mb-6">
        <img :src="bujoLogoUrl" alt="BuJo" class="bujo-login-logo-image" />
        <p class="text-xs text-[var(--bujo-muted-strong)] mt-2">{{ t('register.gotcha') }}</p>
      </div>

      <!-- 表單 -->
      <form @submit.prevent="handleRegister" class="space-y-3">
        <!-- 暱稱 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">{{
            t('register.nicknameLabel')
          }}</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <span class="text-[var(--bujo-muted-strong)]">👤</span>
            <input
              v-model="form.name"
              type="text"
              :placeholder="t('register.nicknamePlaceholder')"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-[var(--bujo-ink)] placeholder:text-[var(--bujo-muted)]"
            />
          </div>
        </div>

        <!-- 電子郵件 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">{{
            t('register.emailLabel')
          }}</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <span class="text-[var(--bujo-muted-strong)]">✉</span>
            <input
              v-model="form.email"
              type="email"
              :placeholder="t('register.emailPlaceholder')"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-[var(--bujo-ink)] placeholder:text-[var(--bujo-muted)]"
            />
          </div>
        </div>

        <!-- 密碼 -->
        <div>
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">{{
            t('register.passwordLabel')
          }}</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <span class="text-[var(--bujo-muted-strong)]"></span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              :placeholder="t('register.passwordPlaceholder')"
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
          <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">{{
            t('register.confirmPasswordLabel')
          }}</label>
          <div
            class="flex items-center gap-2 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 transition-[border-color,box-shadow] duration-150 focus-within:border-[var(--bujo-accent)] focus-within:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
          >
            <span class="text-[var(--bujo-muted-strong)]"></span>
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              :placeholder="t('register.confirmPasswordPlaceholder')"
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
          class="text-xs border border-[#dc2626] bg-[var(--bujo-surface)] text-[#dc2626] px-3 py-2"
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
          {{ isLoading ? t('register.submitLoading') : t('register.submit') }}
        </button>
      </form>

      <!-- 登入連結 -->
      <p class="text-center text-sm text-[var(--bujo-muted-strong)] mt-4">
        {{ t('register.hasAccount') }}
        <router-link
          to="/login"
          class="text-[var(--bujo-ink)] font-semibold underline decoration-[var(--bujo-line)] underline-offset-2"
          >{{ t('register.goToLogin') }}</router-link
        >
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import bujoLogoUrl from '@/assets/bujo-logo-auth.svg'

const router = useRouter()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const { t, locale } = useI18n()

const showPassword = ref(false)
const showConfirmPassword = ref(false)
const isLoading = ref(false)
const _errorMsg = ref({ key: '', params: {}, text: '' })
const _successMsg = ref({ key: '', params: {}, text: '' })

const errorMsg = computed(() => {
  if (_errorMsg.value.text) return _errorMsg.value.text
  return _errorMsg.value.key ? t(_errorMsg.value.key, _errorMsg.value.params) : ''
})
const successMsg = computed(() => {
  if (_successMsg.value.text) return _successMsg.value.text
  return _successMsg.value.key ? t(_successMsg.value.key, _successMsg.value.params) : ''
})

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

function toggleLanguage() {
  const newLocale = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  localeStore.setLocale(newLocale, { global: { locale } })
}

const handleRegister = async () => {
  _errorMsg.value = { key: '', params: {}, text: '' }
  _successMsg.value = { key: '', params: {}, text: '' }

  if (!form.name) {
    _errorMsg.value = { key: 'register.errorNicknameEmpty' }
    return
  }
  if (!form.email) {
    _errorMsg.value = { key: 'register.errorEmailEmpty' }
    return
  }
  if (!form.password) {
    _errorMsg.value = { key: 'register.errorPasswordEmpty' }
    return
  }
  if (!form.confirmPassword) {
    _errorMsg.value = { key: 'register.errorPasswordEmpty' }
    return
  }
  if (form.password !== form.confirmPassword) {
    _errorMsg.value = { key: 'register.errorPasswordMismatch' }
    return
  }
  if (form.password.length < 8) {
    _errorMsg.value = { key: 'register.errorPasswordTooShort' }
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
      _errorMsg.value = data.error
        ? { text: data.error }
        : { key: 'register.errorRateLimit', params: { minutes: waitMin } }
      return
    }

    if (res.status === 409) {
      _errorMsg.value = { key: 'register.errorEmailTaken' }
      return
    }

    if (!res.ok) {
      _errorMsg.value = data.error ? { text: data.error } : { key: 'register.errorGeneric' }
      return
    }

    authStore.setUser(data.user)
    _successMsg.value = { key: 'register.success' }
    setTimeout(() => router.push('/calendar'), 1200)
  } catch {
    _errorMsg.value = { key: 'register.errorNetwork' }
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
