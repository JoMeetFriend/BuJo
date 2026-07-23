import { defineStore } from 'pinia'
import { ref } from 'vue'
import { apiFetch } from '@/services/httpClient'

// Render 免費方案閒置後會休眠，冷啟動時第一批請求常常不會回錯誤、而是整個吊著不回應，
// 所以喚醒不能只是等一次 fetch，而是要設逾時、逾時就視為失敗並重試，直到伺服器真的醒了
const HEALTH_CHECK_TIMEOUT_MS = 5000
const HEALTH_CHECK_RETRY_INTERVAL_MS = 3000
const HEALTH_CHECK_MAX_WAIT_MS = 90000

// /api/auth/me 會查 DB（Prisma 連線池是 lazy 建立的），即使 waitForBackend() 已確認 process 醒著，
// 第一次查詢仍可能因為 DB 連線池尚未建立而多花幾秒，這裡給一個上限避免真的卡住時無限等待
const FETCH_ME_TIMEOUT_MS = 15000

export const useAuthStore = defineStore('auth', () => {
  const user = ref(null)
  const initialized = ref(false)

  async function pingBackend() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), HEALTH_CHECK_TIMEOUT_MS)
    try {
      const res = await apiFetch('/', { signal: controller.signal })
      return res.ok
    } catch {
      return false
    } finally {
      clearTimeout(timer)
    }
  }

  // 在第一次打 /api/auth/me 前先確認後端醒著，避免那支較重的 session 查詢卡在冷啟動的請求佇列裡
  async function waitForBackend() {
    const start = Date.now()
    while (Date.now() - start < HEALTH_CHECK_MAX_WAIT_MS) {
      if (await pingBackend()) return
      await new Promise((resolve) => setTimeout(resolve, HEALTH_CHECK_RETRY_INTERVAL_MS))
    }
  }

  async function fetchMe() {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), FETCH_ME_TIMEOUT_MS)
    try {
      const res = await apiFetch('/api/auth/me', {
        credentials: 'include',
        signal: controller.signal,
      })
      user.value = res.ok ? (await res.json()).user : null
    } catch {
      user.value = null
    } finally {
      clearTimeout(timer)
      initialized.value = true
    }
  }

  async function logout() {
    try {
      await apiFetch('/api/auth/logout', { method: 'POST', credentials: 'include' })
    } catch {
      // 網路或後端失敗都視同登出：清空本地狀態，讓呼叫端一定能導向 /login
    } finally {
      user.value = null
    }
  }

  function setUser(userData) {
    user.value = userData
    initialized.value = true
  }

  function clearUser() {
    user.value = null
  }

  return { user, initialized, waitForBackend, fetchMe, logout, setUser, clearUser }
})
