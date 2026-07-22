import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from '@/App.vue'
import appSource from '@/App.vue?raw'
import { useAuthStore } from '@/stores/auth'
import { APP_TOUR_SEEN_VALUE, getAppTourKey } from '@/composables/useAppTour'
import { createTestI18n } from './testUtils'

const user = {
  id: 'user-123',
  display_name: 'Test User',
  identities: [{ provider: 'local', email: 'test@example.com' }],
}

const routes = [
  { path: '/', name: 'landing', component: { template: '<div>Landing</div>' } },
  { path: '/login', name: 'login', component: { template: '<div>Login</div>' } },
  { path: '/register', name: 'register', component: { template: '<div>Register</div>' } },
  {
    path: '/calendar',
    name: 'calendar-page',
    component: { template: '<div>Calendar</div>' },
    meta: { requiresAuth: true },
  },
]

const LineNotificationOnboardingModalStub = {
  props: ['user'],
  emits: ['complete', 'link-start'],
  template: `
    <div data-testid="line-notification-onboarding">
      <span>{{ user.id }}</span>
      <button type="button" @click="$emit('complete')">稍後再說</button>
      <button type="button" @click="$emit('link-start')">先連接 LINE</button>
    </div>
  `,
}

// 帶一個 data-tour="tour-help-button" 錨點，讓真正的 useAppTour/driver.js 在測試裡也能找到「？」按鈕位置
const AppSidebarStub = {
  template: '<div><button type="button" data-tour="tour-help-button">?</button></div>',
}

async function mountApp({
  path = '/calendar',
  currentUser = user,
  initialized = true,
  // 大部分 LINE onboarding 測試不關心新手導覽本身，預設先標記導覽提示已看過，
  // 維持跟「LINE 提醒排到導覽提示之後」這個規則加入前一樣的行為
  seedTourSeen = true,
} = {}) {
  if (seedTourSeen && currentUser?.id) {
    localStorage.setItem(getAppTourKey(currentUser.id), APP_TOUR_SEEN_VALUE)
  }

  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.user = currentUser
  authStore.initialized = initialized

  const router = createRouter({ history: createMemoryHistory(), routes })
  await router.push(path)
  await router.isReady()

  const wrapper = mount(App, {
    global: {
      plugins: [pinia, router, createTestI18n()],
      stubs: {
        AppSidebar: AppSidebarStub,
        SidebarToggleButton: true,
        LineNotificationOnboardingModal: LineNotificationOnboardingModalStub,
      },
    },
    // 新手導覽的 driver.js 是直接操作 document 找 [data-tour] 錨點、把 popover 掛在 document.body 底下，
    // 沒有 attachTo 的話 wrapper 不在真正的 document 裡，driver.js 會找不到錨點
    attachTo: document.body,
  })

  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

afterEach(() => {
  document.body.innerHTML = ''
  document.body.className = ''
})

describe('App mobile viewport layout', () => {
  test('App 外框使用動態視窗高度並保留舊瀏覽器 fallback', async () => {
    const { wrapper } = await mountApp()

    expect(wrapper.get('.app-shell').exists()).toBe(true)
    expect(appSource).toContain('height: 100vh;')
    expect(appSource).toContain('height: 100dvh;')
  })

  test('側邊欄切換按鈕只在 1024px 以上的桌機導覽顯示', () => {
    expect(appSource).toContain('class="hidden lg:flex"')
    expect(appSource).not.toContain('class="hidden md:flex"')
  })

  test('頁面元件可將手機問號事件交給全站新手導覽', () => {
    expect(appSource).toContain('@open-tour="startAppTour"')
  })
})

describe('App LINE notification onboarding', () => {
  test('認證完成且有 user ID 的使用者進入受保護頁面時顯示一次', async () => {
    const { wrapper } = await mountApp()

    expect(wrapper.get('[data-testid="line-notification-onboarding"]').text()).toContain('user-123')
  })

  test.each([
    { label: '認證尚未初始化', path: '/calendar', currentUser: user, initialized: false },
    { label: '未登入', path: '/calendar', currentUser: null, initialized: true },
    { label: '沒有 user ID', path: '/calendar', currentUser: {}, initialized: true },
    { label: 'landing page', path: '/', currentUser: user, initialized: true },
    { label: 'login page', path: '/login', currentUser: user, initialized: true },
    { label: 'register page', path: '/register', currentUser: user, initialized: true },
  ])('$label 不顯示 onboarding', async (setup) => {
    const { wrapper } = await mountApp(setup)

    expect(wrapper.find('[data-testid="line-notification-onboarding"]').exists()).toBe(false)
  })

  test('已有 seen key 時不顯示', async () => {
    localStorage.setItem('bujo:line-notification-guide:v1:user-123', 'seen')

    const { wrapper } = await mountApp()

    expect(wrapper.find('[data-testid="line-notification-onboarding"]').exists()).toBe(false)
  })

  test('稍後再說只寫入 seen 並關閉 modal，不改變目前路由', async () => {
    const { wrapper, router } = await mountApp()

    await wrapper.get('[data-testid="line-notification-onboarding"] button').trigger('click')

    expect(localStorage.getItem('bujo:line-notification-guide:v1:user-123')).toBe('seen')
    expect(wrapper.find('[data-testid="line-notification-onboarding"]').exists()).toBe(false)
    expect(router.currentRoute.value.path).toBe('/calendar')
  })

  test('開始連接 LINE 時記住目前頁面且不先完成 onboarding', async () => {
    const { wrapper } = await mountApp()

    await wrapper
      .findAll('[data-testid="line-notification-onboarding"] button')
      .find((button) => button.text() === '先連接 LINE')
      .trigger('click')

    expect(sessionStorage.getItem('bujo:line-notification-guide:return-path')).toBe('/calendar')
    expect(localStorage.getItem('bujo:line-notification-guide:v1:user-123')).toBeNull()
    expect(wrapper.find('[data-testid="line-notification-onboarding"]').exists()).toBe(true)
  })
})

describe('App 新手導覽提示與 LINE 提醒的顯示順序', () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('第一次登入、還沒看過新手導覽提示時，LINE 提醒不會搶先跳出', async () => {
    const { wrapper } = await mountApp({ seedTourSeen: false })

    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()

    expect(document.body.classList.contains('driver-active')).toBe(true)
    expect(wrapper.find('[data-testid="line-notification-onboarding"]').exists()).toBe(false)
  })

  test('關閉新手導覽提示後，才會接著顯示 LINE 提醒', async () => {
    const { wrapper } = await mountApp({ seedTourSeen: false })

    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('[data-testid="line-notification-onboarding"]').exists()).toBe(false)

    // driver.js 框選第一個元素預設有 400ms 的動畫，動畫跑完前 destroy() 不會觸發 onDestroyed
    await vi.advanceTimersByTimeAsync(500)
    document.querySelector('.driver-popover-close-btn').click()
    await wrapper.vm.$nextTick()

    expect(localStorage.getItem(getAppTourKey('user-123'))).toBe(APP_TOUR_SEEN_VALUE)
    expect(wrapper.get('[data-testid="line-notification-onboarding"]').text()).toContain('user-123')
  })
})
