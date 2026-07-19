import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createMemoryHistory, createRouter } from 'vue-router'
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest'
import App from '@/App.vue'
import { useAuthStore } from '@/stores/auth'

const { hasSeenTourRef, startTourMock } = vi.hoisted(() => ({
  hasSeenTourRef: { value: false },
  startTourMock: vi.fn(),
}))

vi.mock('@/composables/useAppTour', () => ({
  useAppTour: () => ({
    hasSeenTour: hasSeenTourRef,
    startTour: startTourMock,
    markSeen: vi.fn(),
    storageKey: { value: '' },
  }),
}))

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
  {
    path: '/friends-page',
    name: 'friends-page',
    component: { template: '<div>Friends</div>' },
    meta: { requiresAuth: true },
  },
]

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
      plugins: [pinia, router],
      stubs: {
        AppSidebar: true,
        SidebarToggleButton: true,
        LineNotificationOnboardingModal: true,
      },
    },
  })

  return { wrapper, router }
}

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
  hasSeenTourRef.value = false
  startTourMock.mockClear()
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('App 新手導覽觸發與問號球', () => {
  test('新使用者進入行事曆頁，載入畫面時間到後自動開啟導覽', async () => {
    const { wrapper } = await mountApp({ path: '/calendar' })

    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()

    expect(startTourMock).toHaveBeenCalledTimes(1)
  })

  test('已經看過導覽的使用者不會自動再次開啟', async () => {
    hasSeenTourRef.value = true
    const { wrapper } = await mountApp({ path: '/calendar' })

    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()

    expect(startTourMock).not.toHaveBeenCalled()
  })

  test('不在行事曆頁時不自動開啟導覽', async () => {
    const { wrapper } = await mountApp({ path: '/friends-page' })

    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()

    expect(startTourMock).not.toHaveBeenCalled()
  })

  test('已登入的主要頁面會顯示浮動問號球，點擊可重新開啟導覽', async () => {
    hasSeenTourRef.value = true
    const { wrapper } = await mountApp({ path: '/friends-page' })
    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()

    const helpButton = wrapper.find('[aria-label="重新開啟新手導覽"]')
    expect(helpButton.exists()).toBe(true)

    await helpButton.trigger('click')
    expect(startTourMock).toHaveBeenCalledTimes(1)
  })

  test.each([
    { label: 'landing page', path: '/', currentUser: user },
    { label: 'login page', path: '/login', currentUser: user },
    { label: '未登入', path: '/friends-page', currentUser: null },
  ])('$label 不顯示浮動問號球', async ({ path, currentUser }) => {
    const { wrapper } = await mountApp({ path, currentUser })
    await vi.advanceTimersByTimeAsync(1600)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('[aria-label="重新開啟新手導覽"]').exists()).toBe(false)
  })
})
