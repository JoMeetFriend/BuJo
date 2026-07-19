import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, test } from 'vitest'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/auth'
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

async function mountApp({ path = '/calendar', currentUser = user, initialized = true } = {}) {
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
        AppSidebar: true,
        SidebarToggleButton: true,
        LineNotificationOnboardingModal: LineNotificationOnboardingModalStub,
      },
    },
  })

  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
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
