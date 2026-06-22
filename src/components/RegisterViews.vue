<!-- src/views/RegisterViews.vue -->
<template>
  <div
    class="min-h-screen relative bg-page-bg bg-dot-pattern flex items-center justify-center p-6 overflow-hidden"
  >
    <div class="register-bg" :style="{ backgroundImage: `url(${registerBg})` }"></div>
    <div
      class="relative z-10 bg-page-bg w-full max-w-[26.4rem] p-7 border-2 border-brand-text shadow-pixel hover:shadow-pixel-pressed hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
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
      <form @submit.prevent="handleRegister" class="space-y-3">
        <!-- 暱稱 -->
        <div>
          <label class="block text-sm text-brand-text mb-1">暱稱</label>
          <div
            class="flex items-center gap-2 border-[1.5px] border-primary-mid px-3 bg-primary-pale"
          >
            <span class="text-brand-text">👤</span>
            <input
              v-model="form.name"
              type="text"
              placeholder="請輸入暱稱"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-brand-text"
            />
          </div>
        </div>

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

        <!-- 確認密碼 -->
        <div>
          <label class="block text-sm text-brand-text mb-1">確認密碼</label>
          <div
            class="flex items-center gap-2 border-[1.5px] border-primary-mid px-3 bg-primary-pale"
          >
            <span class="text-brand-text"></span>
            <input
              v-model="form.confirmPassword"
              :type="showConfirmPassword ? 'text' : 'password'"
              placeholder="••••••••"
              class="flex-1 bg-transparent outline-none py-2 text-sm text-brand-text"
            />
            <button
              type="button"
              @click="showConfirmPassword = !showConfirmPassword"
              class="text-brand-text"
            >
              <EyeIcon v-if="!showConfirmPassword" class="w-4 h-4" />
              <EyeSlashIcon v-else class="w-4 h-4" />
            </button>
          </div>
        </div>

        <!-- 註冊按鈕 -->
        <button
          type="submit"
          class="w-full bg-primary-green hover:bg-primary-mid text-brand-text py-2 text-sm font-semibold flex items-center justify-center gap-2 border-2 border-brand-text shadow-pixel hover:shadow-pixel-pressed hover:translate-x-[2px] hover:translate-y-[2px] transition-all duration-100"
        >
          註冊
        </button>
      </form>

      <!-- 登入連結 -->
      <p class="text-center text-sm text-brand-text mt-4">
        已經有帳號了？
        <router-link to="/login" class="text-primary-mid font-semibold">前往登入</router-link>
      </p>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue'
import { EyeIcon, EyeSlashIcon } from '@heroicons/vue/24/outline'
import registerBg from '@/assets/register-bg.png'

const showPassword = ref(false)
const showConfirmPassword = ref(false)

const form = reactive({
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
})

const handleRegister = () => {
  // TODO: 串接 API
  console.log('註冊資料：', form)
}
</script>

<style scoped>
.register-bg {
  position: absolute;
  inset: 0;
  z-index: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  filter: blur(8px);
  transform: scale(1.05);
}

.bg-dot-pattern {
  background-image: url("data:image/svg+xml,%3Csvg%20xmlns='http://www.w3.org/2000/svg'%20width='320'%20height='320'%3E%3Cfilter%20id='b'%3E%3CfeGaussianBlur%20stdDeviation='1.2'/%3E%3C/filter%3E%3Cg%20filter='url(%23b)'%3E%3Crect%20x='20'%20y='30'%20width='1'%20height='1'%20fill='%2387C06D'/%3E%3Crect%20x='120'%20y='60'%20width='2'%20height='2'%20fill='%23F9CE9A'/%3E%3Crect%20x='250'%20y='40'%20width='3'%20height='3'%20fill='%23E9EF6E'/%3E%3Crect%20x='60'%20y='150'%20width='4'%20height='4'%20fill='%239DBD86'/%3E%3Crect%20x='200'%20y='180'%20width='5'%20height='5'%20fill='%2387C06D'/%3E%3Crect%20x='280'%20y='250'%20width='6'%20height='6'%20fill='%23F9CE9A'/%3E%3Crect%20x='40'%20y='260'%20width='7'%20height='7'%20fill='%23E9EF6E'/%3E%3Crect%20x='160'%20y='290'%20width='8'%20height='8'%20fill='%239DBD86'/%3E%3C/g%3E%3C/svg%3E");
  background-repeat: repeat;
}
</style>
