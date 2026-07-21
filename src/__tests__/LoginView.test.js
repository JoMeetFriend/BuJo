import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import LoginView from '@/components/LoginView.vue'
import { createTestI18n } from './testUtils'

globalThis.fetch = vi.fn()

function mountLoginView() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/login', component: LoginView },
      { path: '/', component: { template: '<div>Home</div>' } },
      { path: '/forgot-password', component: { template: '<div>Forgot</div>' } },
      { path: '/register', component: { template: '<div>Register</div>' } },
    ],
  })

  return mount(LoginView, {
    global: { plugins: [createPinia(), router, createTestI18n()] },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
  delete window.location
  window.location = { href: '' }
})

describe('GoogleLogin', () => {
  test('點擊 Google 登入按鈕會導頁到後端 OAuth 入口', async () => {
    const wrapper = mountLoginView()

    await wrapper.find('button[data-testid="google-login"]').trigger('click')

    expect(window.location.href).toBe(`${import.meta.env.VITE_API_URL}/api/auth/google`)
  })
})
