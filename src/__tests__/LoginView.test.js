import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import LoginView from '@/components/LoginView.vue'

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
    global: { plugins: [createPinia(), router] },
  })
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
  document.head
    .querySelectorAll('script[src="https://accounts.google.com/gsi/client"]')
    .forEach((el) => {
      el.remove()
    })
  window.google = {
    accounts: {
      id: {
        prompt: vi.fn(),
        initialize: vi.fn(),
      },
    },
  }
})

describe('GoogleLogin', () => {
  test('點擊 Google 登入按鈕會開啟 Google prompt', async () => {
    const wrapper = mountLoginView()

    await wrapper.find('button[data-testid="google-login"]').trigger('click')

    expect(window.google.accounts.id.prompt).toHaveBeenCalledTimes(1)
  })

  test('Google SDK 尚未載入時點擊按鈕不應拋錯或跳頁', async () => {
    window.google = undefined
    const wrapper = mountLoginView()

    await wrapper.find('button[data-testid="google-login"]').trigger('click')

    expect(localStorage.getItem('token')).toBeNull()
  })
})
