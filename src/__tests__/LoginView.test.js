import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, it, expect, vi, beforeEach, test } from 'vitest'
import LoginView from '@/components/LoginView.vue'

vi.mock('vue3-google-login', () => ({
  googleTokenLogin: vi.fn()
}))
import { googleTokenLogin } from 'vue3-google-login'

global.fetch = vi.fn()

const router = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/login', component: LoginView },
    { path: '/', component: { template: '<div>Home</div>' } }
  ]
})

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
  localStorage.clear()
})

describe('GoogleLogin', () => {
  test('Google 登入成功 + 後端成功 → 存 token 並跳到 /', async () => {
    googleTokenLogin.mockResolvedValue({ access_token: 'google-token' })
    global.fetch.mockResolvedValue({
      json: () => Promise.resolve({
        token: 'jwt-token',
        user: { id: '1', display_name: 'Test', email: 'test@gmail.com', avatar_url: '' }
      })
    })

    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })

    await wrapper.find('button[data-testid="google-login"]').trigger('click')
    await flushPromises()

    expect(localStorage.getItem('token')).toBe('jwt-token')
    expect(router.currentRoute.value.path).toBe('/')
  })
  test('使用者關掉 Google 視窗 → 不應有任何錯誤或跳頁', async () => {
    googleTokenLogin.mockRejectedValue({ type: 'popup_closed' })
    const consoleSpy = vi.spyOn(console, 'error')

    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })

    await wrapper.find('button[data-testid="google-login"]').trigger('click')
    await flushPromises()

    expect(consoleSpy).not.toHaveBeenCalled()
    expect(localStorage.getItem('token')).toBeNull()
  })

  test('後端回傳失敗（網路錯誤）→ 應印出錯誤', async () => {
    googleTokenLogin.mockResolvedValue({ access_token: 'google-token' })
    global.fetch.mockRejectedValue(new Error('Network Error'))
    const consoleSpy = vi.spyOn(console, 'error')

    const wrapper = mount(LoginView, {
      global: { plugins: [createPinia(), router] }
    })

    await wrapper.find('button[data-testid="google-login"]').trigger('click')
    await flushPromises()

    expect(consoleSpy).toHaveBeenCalled()
  })
})