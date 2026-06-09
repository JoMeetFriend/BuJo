<!-- src/views/LoginView.vue -->
<template>
  <div class="min-h-screen bg-[#FAF8F4] flex items-center justify-center p-6">
    <div class="bg-white rounded-2xl p-10 w-full max-w-sm border border-[#9DBD86]">
      
      <!-- Logo -->
      <div class="flex items-center gap-4 mb-8">
        <div class="w-14 h-14 bg-[#87C06D] rounded-2xl flex items-center justify-center shrink-0">
          <!-- 之後把這行換成 <img src="@/assets/logo.png" class="w-10 h-10" /> -->
          <span class="text-white text-2xl">🗓</span>
        </div>
        <div>
        <h1 class="text-2xl font-medium text-[#2B2E24]">BuJo 日曆</h1>
        <p class="text-sm text-[#4A5040] mt-1">登入後即可查看個人與揪團行事曆</p>
        </div>
      </div>

      <!-- 表單 -->
      <form @submit.prevent="handleLogin" class="space-y-4">
        
        <!-- 電子郵件 -->
        <div>
          <label class="block text-sm text-[#2B2E24] mb-1.5">電子郵件</label>
          <div class="flex items-center gap-2 border border-[#9DBD86] rounded-xl px-3 bg-[#DEF4CD]">
            <span class="text-[#9B8C7A]">✉</span>
            <input
              v-model="form.email"
              type="email"
              placeholder="user@gmail.com"
              class="flex-1 bg-transparent outline-none py-2.5 text-sm text-[#4A5040]"
            />
          </div>
        </div>

        <!-- 密碼 -->
        <div>
          <label class="block text-sm text-[#2B2E24] mb-1.5">密碼</label>
          <div class="flex items-center gap-2 border border-[#9DBD86] rounded-xl px-3 bg-[#DEF4CD]">
            <span class="text-[#9B8C7A]"></span>
            <input
              v-model="form.password"
              :type="showPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1 bg-transparent outline-none py-2.5 text-sm text-[#4A5040]"
            />
            <button type="button" @click="showPassword = !showPassword" class="text-[#9B8C7A]">
              <EyeIcon v-if="!showPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!--忘記密碼 -->
        <div class="flex justify-between items-center">
          <label class="flex items-center gap-2 text-sm text-[#6B5C4C] cursor-pointer">
          </label>
          <router-link to="/forgot-password" class="text-sm text-[#9DBD86]">
            忘記密碼？
          </router-link>
        </div>

        <!-- 登入按鈕 -->
        <button
          type="submit"
          class="w-full bg-[#87C06D] text-[#2B2E24] rounded-xl py-3 text-sm font-medium flex items-center justify-center gap-2 hover:bg-[#D9F0A8] transition-colors"
        >
          登入 
        </button>
      </form>

      <!-- 分隔線 -->
      <div class="flex items-center gap-3 my-5">
        <div class="flex-1 h-px bg-[#DEF4CD]"></div>
        <span class="text-xs text-[#9DBD86]">或</span>
        <div class="flex-1 h-px bg-[#DEF4CD]"></div>
      </div>

      <!-- Google 登入 -->
      <button
        @click="handleGoogleLogin"
        class="w-full border border-[#9DBD86] rounded-xl py-3 text-sm text-[#3D2E1E] flex items-center justify-center gap-2 hover:bg-[#D9F0A8] transition-colors"
      >
        <!-- Google SVG -->
        <svg width="18" height="18" viewBox="0 0 48 48">
          <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"/>
          <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
          <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
          <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
        </svg>
        使用 Google 帳號快速登入
      </button>

      <!-- LINE 登入 -->
      <button
        @click="handleLineLogin"
        class="w-full border border-[#9DBD86] rounded-xl py-3 text-sm text-[#3D2E1E] flex items-center justify-center gap-2 hover:bg-[#D9F0A8] transition-colors mt-3"
      >
        <!-- LINE SVG -->
        <svg width="18" height="18" viewBox="0 0 48 48" fill="none">
          <rect width="48" height="48" rx="10" fill="#00B900"/>
          <path d="M40 22.2C40 15.1 32.8 9.3 24 9.3S8 15.1 8 22.2c0 6.4 5.7 11.7 13.3 12.7.5.1 1.2.3 1.4.8.2.4.1 1 .1 1.4l-.2 1.4c-.1.5-.4 1.8 1.6.99 2-.8 10.8-6.4 14.7-10.9C39.1 26.1 40 24.3 40 22.2z" fill="white"/>
          <path d="M20.3 19.5h-1.2c-.2 0-.4.2-.4.4v7.4c0 .2.2.4.4.4h1.2c.2 0 .4-.2.4-.4v-7.4c0-.2-.2-.4-.4-.4zM29.1 19.5h-1.2c-.2 0-.4.2-.4.4v4.4l-3.4-4.6c0-.1-.1-.1-.1-.2h-1.3c-.2 0-.4.2-.4.4v7.4c0 .2.2.4.4.4H24c.2 0 .4-.2.4-.4v-4.4l3.4 4.6c.1.1.2.2.3.2h1.2c.2 0 .4-.2.4-.4v-7.4c-.2-.2-.4-.4-.6-.4zM17.4 25.7h-3.3v-5.8c0-.2-.2-.4-.4-.4h-1.2c-.2 0-.4.2-.4.4v7.4c0 .1.1.2.1.3.1.1.2.1.3.1h4.9c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4zM35.9 21.5c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4H31c-.1 0-.2 0-.3.1-.1.1-.1.2-.1.3v7.4c0 .1 0 .2.1.3.1.1.2.1.3.1h4.9c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4h-3.3v-1.3h3.3c.2 0 .4-.2.4-.4v-1.2c0-.2-.2-.4-.4-.4h-3.3v-1.3h3.3z" fill="#00B900"/>
        </svg>
        使用 LINE 登入
      </button>

      <!-- 註冊連結 -->
      <p class="text-center text-sm text-[#4A5040] mt-5">
        還沒有帳號？
        <router-link to="/register" class="text-[#9DBD86] font-medium">前往註冊</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'

const showPassword = ref(false)

const form = reactive({
  email: '',
  password: '',
  remember: false,
})

const handleLogin = () => {
  // TODO: 串接 API
  console.log('登入資料：', form)
}

const handleGoogleLogin = () => {
  // TODO: 串接 Google OAuth
  console.log('Google 登入')
}

const handleLineLogin = () => {
  // TODO: 串接 LINE Login OAuth
  console.log('LINE 登入')
}
</script>