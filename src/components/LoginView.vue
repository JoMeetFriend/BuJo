<!-- src/views/LoginView.vue -->
<template>
  <div class="login-page">
    <div class="login-envelope-scene">
      <span class="login-scene-star login-scene-star--a" aria-hidden="true"></span>
      <span class="login-scene-star login-scene-star--b" aria-hidden="true"></span>
      <span class="login-scene-dot login-scene-dot--a" aria-hidden="true"></span>
      <span class="login-scene-dot login-scene-dot--b" aria-hidden="true"></span>

      <article class="login-invite-card">
        <button
          class="absolute top-3 left-3 px-3 py-1 rounded border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-xs font-semibold text-[var(--bujo-ink)] cursor-pointer transition-colors hover:bg-[var(--bujo-line-soft)]"
          @click="toggleLanguage"
        >
          {{ locale === 'zh-TW' ? 'EN' : '中文' }}
        </button>

        <!-- Logo -->
        <div class="flex flex-col items-center mb-6">
          <img :src="bujoLogoUrl" alt="BuJo" class="bujo-login-logo-image" />
          <p class="text-xs text-[var(--bujo-muted-strong)] mt-2">{{ t('login.gotcha') }}</p>
        </div>

        <!-- 表單 -->
        <form @submit.prevent="handleLogin" class="space-y-3">
          <!-- 電子郵件 -->
          <div>
            <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">{{
              t('login.emailLabel')
            }}</label>
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
            <label class="block text-sm font-medium text-[var(--bujo-ink)] mb-1">{{
              t('login.passwordLabel')
            }}</label>
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

          <!-- 忘記密碼 -->
          <div class="flex justify-end">
            <router-link
              to="/forgot-password"
              class="text-sm text-[var(--bujo-muted-strong)] underline decoration-[var(--bujo-line)] underline-offset-2 transition-colors duration-150 hover:text-[var(--bujo-ink)]"
            >
              {{ t('login.forgotPassword') }}
            </router-link>
          </div>

          <!-- 錯誤訊息 -->
          <p
            v-if="errorMsg"
            class="text-xs border border-[#dc2626] bg-[var(--bujo-surface)] text-[#dc2626] px-3 py-2"
          >
            {{ errorMsg }}
          </p>

          <!-- 登入按鈕 -->
          <button type="submit" :disabled="isLoading" class="bujo-hero-btn w-full">
            {{ isLoading ? t('login.submitLoading') : t('login.submit') }}
          </button>
        </form>

        <!-- 分隔線 -->
        <div class="flex items-center gap-3 my-4">
          <div class="flex-1 h-px bg-[var(--bujo-line-soft)]"></div>
          <span class="text-xs text-[var(--bujo-muted)]">{{ t('login.orContinueWith') }}</span>
          <div class="flex-1 h-px bg-[var(--bujo-line-soft)]"></div>
        </div>

        <!-- Google 登入 -->
        <button
          @click="handleGoogleLogin"
          data-testid="google-login"
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
          {{ t('login.googleLogin') }}
        </button>

        <!-- LINE 登入 -->
        <button @click="handleLineLogin" class="bujo-outline-btn w-full">
          <svg
            width="18"
            height="18"
            viewBox="0 0 48 48"
            fill="none"
            class="relative -left-[1.5em]"
          >
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
          {{ t('login.lineLogin') }}
        </button>

        <!-- 註冊連結 -->
        <p class="text-center text-sm text-[var(--bujo-muted-strong)] mt-4">
          {{ t('login.noAccount') }}
          <router-link
            to="/register"
            class="text-[var(--bujo-ink)] font-semibold underline decoration-[var(--bujo-line)] underline-offset-2"
            >{{ t('login.goToRegister') }}</router-link
          >
        </p>
      </article>

      <div class="login-envelope" aria-hidden="true">
        <span class="login-envelope-backing-flap login-envelope-backing-flap--left"></span>
        <span class="login-envelope-backing-flap login-envelope-backing-flap--right"></span>
        <span class="login-envelope-backing-front"></span>
        <span class="login-envelope-flap login-envelope-flap--left"></span>
        <span class="login-envelope-flap login-envelope-flap--right"></span>
        <span class="login-envelope-front"></span>
        <span class="login-envelope-star login-envelope-star--a"></span>
        <span class="login-envelope-star login-envelope-star--b"></span>
        <span class="login-envelope-star login-envelope-star--c"></span>
        <span class="login-envelope-star login-envelope-star--d"></span>
        <span class="login-envelope-star login-envelope-star--e"></span>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'
import { useRouter, useRoute } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import { useAuthStore } from '@/stores/auth'
import { useLocaleStore } from '@/stores/locale'
import bujoLogoUrl from '@/assets/bujo-logo-auth.svg'

const router = useRouter()
const route = useRoute()
const authStore = useAuthStore()
const localeStore = useLocaleStore()
const { t, locale } = useI18n()
const showPassword = ref(false)
const isLoading = ref(false)
const _errorMsg = ref({ key: '', params: {}, text: '' })
let previousHtmlOverflowY = ''
let previousBodyOverflowY = ''

const errorMsg = computed(() => {
  if (_errorMsg.value.text) return _errorMsg.value.text
  return _errorMsg.value.key ? t(_errorMsg.value.key, _errorMsg.value.params) : ''
})

const form = reactive({
  email: '',
  password: '',
})

function toggleLanguage() {
  const newLocale = locale.value === 'zh-TW' ? 'en' : 'zh-TW'
  localeStore.setLocale(newLocale, { global: { locale } })
}

const handleLogin = async () => {
  _errorMsg.value = { key: '', params: {}, text: '' }

  if (!form.email || !form.password) {
    _errorMsg.value = { key: 'login.errorEmpty' }
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
      _errorMsg.value = data.error
        ? { text: data.error }
        : { key: 'login.errorRateLimit', params: { minutes: waitMin } }
      return
    }

    if (!res.ok) {
      _errorMsg.value = data.error ? { text: data.error } : { key: 'login.errorInvalid' }
      return
    }

    authStore.setUser(data.user)
    router.push('/calendar')
  } catch {
    _errorMsg.value = { key: 'login.errorNetwork' }
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
    if (!res.ok) throw new Error(data.error || t('login.errorGoogleFailed'))
    authStore.setUser(data.user)
    router.push('/calendar')
  } catch (err) {
    _errorMsg.value = { text: err.message || t('login.errorGoogleFailed') }
  }
}

const handleGoogleLogin = () => {
  window.google?.accounts.id.prompt((notification) => {
    if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
      _errorMsg.value = { key: 'login.errorGoogleUnavailable' }
    }
  })
}

const handleLineLogin = () => {
  window.location.href = `${import.meta.env.VITE_API_URL}/api/auth/line`
}

onMounted(() => {
  previousHtmlOverflowY = document.documentElement.style.overflowY
  previousBodyOverflowY = document.body.style.overflowY
  document.documentElement.style.overflowY = 'hidden'
  document.body.style.overflowY = 'hidden'

  const errorMap = {
    line_cancelled: { key: 'login.errorLineCancelled' },
    line_login_failed: { key: 'login.errorLineFailed' },
  }
  const lineError = errorMap[route.query.error]
  if (lineError) {
    _errorMsg.value = lineError
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

onUnmounted(() => {
  document.documentElement.style.overflowY = previousHtmlOverflowY
  document.body.style.overflowY = previousBodyOverflowY
})
</script>

<style scoped>
.login-page {
  min-height: 100dvh;
  display: grid;
  place-items: center;
  overflow: hidden;
  padding: clamp(28px, 5vh, 58px) 24px;
  background:
    radial-gradient(circle, rgb(var(--bujo-line-rgb) / 0.13) 1px, transparent 1px) 0 0 / 24px 24px,
    var(--bujo-page);
}

.login-envelope-scene {
  position: relative;
  width: min(680px, calc(100vw - 32px));
  min-height: min(760px, calc(100dvh - 44px));
  display: grid;
  align-content: center;
  justify-items: center;
  isolation: isolate;
  transform: scale(0.95);
  transform-origin: center;
}

.login-invite-card {
  position: relative;
  z-index: 3;
  width: min(408px, calc(100vw - 62px));
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.76);
  border-radius: 2px;
  background:
    linear-gradient(to bottom, rgb(var(--bujo-white-rgb) / 0.7), transparent 52px),
    var(--bujo-surface);
  box-shadow:
    0 16px 28px rgb(var(--bujo-ink-rgb) / 0.08),
    -10px 12px 0 rgb(var(--bujo-line-rgb) / 0.055);
  padding: 30px 28px 38px;
  transform: translateY(-10px);
}

.login-invite-card::before {
  position: absolute;
  top: 12px;
  right: 18px;
  color: rgb(var(--bujo-ink-rgb) / 0.34);
  content: 'INVITE / LOGIN';
  font-family: var(--bujo-font-meta);
  font-size: 9px;
  font-weight: 700;
  letter-spacing: 0.1em;
}

.login-invite-card::after {
  position: absolute;
  right: 36px;
  bottom: -8px;
  width: 58px;
  height: 14px;
  background: rgb(var(--bujo-card-yellow-rgb, 227 213 133) / 0.48);
  transform: rotate(-2deg);
  content: '';
}

.login-envelope {
  position: relative;
  width: min(558px, calc(100vw - 68px));
  height: 227px;
  margin-top: -120px;
  pointer-events: none;
}

.login-envelope::before,
.login-envelope::after {
  position: absolute;
  z-index: 5;
  top: -20px;
  width: 315px;
  height: 16px;
  background: linear-gradient(
    to bottom,
    rgb(var(--bujo-ink-rgb) / 0.14),
    rgb(var(--bujo-ink-rgb) / 0.045) 48%,
    transparent
  );
  filter: blur(2.5px);
  content: '';
  mix-blend-mode: multiply;
  pointer-events: none;
}

.login-envelope::before {
  left: -2px;
  transform: rotate(24deg);
  transform-origin: left center;
}

.login-envelope::after {
  right: -2px;
  transform: rotate(-24deg);
  transform-origin: right center;
}

.login-envelope-front,
.login-envelope-flap,
.login-envelope-backing-front,
.login-envelope-backing-flap {
  position: absolute;
  border: 1px solid rgb(var(--bujo-line-rgb) / 0.62);
  background: var(--bujo-surface);
}

.login-envelope-backing-front {
  z-index: 1;
  border: 0;
}

.login-envelope-front {
  z-index: 6;
}

.login-envelope-front,
.login-envelope-backing-front {
  right: 0;
  bottom: 0;
  left: 0;
  height: 315px;
  transform: rotate(-2.2deg);
}

.login-envelope-backing-front {
  bottom: 0;
  height: 258px;
  transform: rotate(-2.2deg);
  transform-origin: center bottom;
  background:
    repeating-linear-gradient(-14deg, rgb(var(--bujo-line-rgb) / 0.05) 0 1px, transparent 1px 9px),
    var(--bujo-surface-muted);
}

.login-envelope-backing-front::before {
  position: absolute;
  right: 0;
  bottom: 100%;
  left: 0;
  height: 168px;
  background: var(--bujo-surface-muted);
  clip-path: polygon(50% 0, 100% 100%, 0 100%);
  content: '';
}

.login-envelope-front {
  right: 0;
  bottom: 0;
  left: 0;
  height: 315px;
  background:
    repeating-linear-gradient(-14deg, rgb(var(--bujo-line-rgb) / 0.075) 0 1px, transparent 1px 9px),
    var(--bujo-surface-muted);
  clip-path: polygon(0 18%, 50% 62%, 100% 18%, 100% 100%, 0 100%);
  transform: rotate(-2.2deg);
}

.login-envelope-backing-flap {
  display: none;
}

.login-envelope-flap {
  z-index: 6;
}

.login-envelope-flap,
.login-envelope-backing-flap {
  bottom: 12px;
  width: 51%;
  height: 162px;
  background:
    linear-gradient(150deg, rgb(var(--bujo-white-rgb) / 0.5), transparent 45%), var(--bujo-surface);
}

.login-envelope-flap--left,
.login-envelope-backing-flap--left {
  left: 0;
  clip-path: polygon(0 0, 100% 64%, 0 100%);
  transform: rotate(-2.2deg);
  transform-origin: right bottom;
}

.login-envelope-flap--right,
.login-envelope-backing-flap--right {
  right: 0;
  clip-path: polygon(100% 0, 0 64%, 100% 100%);
  transform: rotate(-2.2deg);
  transform-origin: left bottom;
}

.login-scene-star,
.login-envelope-star {
  position: absolute;
  display: block;
  clip-path: polygon(
    50% 0,
    61% 35%,
    98% 35%,
    68% 56%,
    79% 91%,
    50% 70%,
    21% 91%,
    32% 56%,
    2% 35%,
    39% 35%
  );
  pointer-events: none;
}

.login-scene-star {
  z-index: 4;
  width: 20px;
  height: 20px;
  background: color-mix(in srgb, var(--bujo-deco-pink) 72%, transparent);
  animation: login-twinkle 2.8s ease-in-out infinite;
}

.login-scene-star--a {
  top: 13%;
  left: 22%;
  transform: rotate(-14deg);
}

.login-scene-star--b {
  top: 18%;
  right: 18%;
  width: 16px;
  height: 16px;
  background: color-mix(in srgb, var(--bujo-deco-blue) 72%, transparent);
  transform: rotate(12deg);
  animation-delay: 1.15s;
}

.login-scene-dot {
  position: absolute;
  z-index: 4;
  display: block;
  width: 8px;
  height: 8px;
  background: var(--bujo-deco-blue);
  pointer-events: none;
  animation: login-twinkle 2.4s ease-in-out infinite;
}

.login-scene-dot--a {
  top: 19%;
  left: 30%;
}

.login-scene-dot--b {
  right: 18%;
  bottom: 23%;
  width: 6px;
  height: 6px;
  background: var(--bujo-deco-pink);
  animation-delay: 1.1s;
}

.login-envelope-star {
  z-index: 6;
  width: 14px;
  height: 14px;
  background: rgb(var(--bujo-ink-rgb) / 0.58);
}

.login-envelope-star--a {
  left: 12%;
  bottom: 72px;
  transform: rotate(12deg);
}

.login-envelope-star--b {
  left: 26%;
  bottom: 106px;
  width: 12px;
  height: 12px;
  background: color-mix(in srgb, var(--bujo-deco-pink) 76%, transparent);
  transform: rotate(-12deg);
}

.login-envelope-star--c {
  left: 48%;
  bottom: 68px;
  width: 10px;
  height: 10px;
  background: rgb(var(--bujo-ink-rgb) / 0.5);
}

.login-envelope-star--d {
  right: 27%;
  bottom: 108px;
  width: 13px;
  height: 13px;
  background: color-mix(in srgb, var(--bujo-deco-pink) 66%, transparent);
  transform: rotate(20deg);
}

.login-envelope-star--e {
  right: 12%;
  bottom: 76px;
  width: 16px;
  height: 16px;
  background: rgb(var(--bujo-ink-rgb) / 0.62);
  transform: rotate(-7deg);
}

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

@media (max-width: 640px) {
  .login-page {
    position: relative;
    display: block;
    padding: 0;
  }

  .login-envelope-scene {
    position: absolute;
    top: 50%;
    left: 50%;
    width: 558px;
    min-height: 760px;
    transform: translate(-50%, -50%) scale(0.67);
  }

  .login-invite-card {
    width: 408px;
  }

  .login-envelope {
    top: 4px;
    width: 558px;
  }
}

@media (min-width: 390px) and (max-width: 640px) {
  .login-envelope-scene {
    transform: translate(-50%, -50%) scale(0.74);
  }
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
