import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import RegisterViews from '@/components/RegisterViews.vue'
import { createTestI18n } from './testUtils'

globalThis.fetch = vi.fn()

function mountRegisterViews() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/register', component: RegisterViews },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/', component: { template: '<div>Home</div>' } },
    ],
  })

  return mount(RegisterViews, {
    global: { plugins: [createPinia(), router, createTestI18n()] },
  })
}

async function fillForm(
  wrapper,
  {
    name = '小明',
    email = 'user@example.com',
    password = 'password123',
    confirmPassword = 'password123',
  } = {},
) {
  await wrapper.find('input[type="text"]').setValue(name)
  await wrapper.find('input[type="email"]').setValue(email)
  const passwordInputs = wrapper.findAll('input[type="password"]')
  await passwordInputs[0].setValue(password)
  await passwordInputs[1].setValue(confirmPassword)
}

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

describe('RegisterViews - 前端驗證', () => {
  test('全部未填時顯示暱稱為空錯誤', async () => {
    const wrapper = mountRegisterViews()

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('暱稱不可為空白')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('暱稱為空時顯示錯誤', async () => {
    const wrapper = mountRegisterViews()
    await fillForm(wrapper, { name: '' })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('暱稱不可為空白')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('email 為空時顯示錯誤', async () => {
    const wrapper = mountRegisterViews()
    await fillForm(wrapper, { name: '小明', email: '' })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('電子郵件不可為空白')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('密碼為空時顯示錯誤', async () => {
    const wrapper = mountRegisterViews()
    await fillForm(wrapper, { name: '小明', email: 'a@b.com', password: '' })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('密碼不可為空白')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('確認密碼為空時顯示錯誤', async () => {
    const wrapper = mountRegisterViews()
    await fillForm(wrapper, {
      name: '小明',
      email: 'a@b.com',
      password: 'password123',
      confirmPassword: '',
    })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('確認密碼不可為空白')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('兩次密碼輸入不一致時顯示錯誤', async () => {
    const wrapper = mountRegisterViews()
    await fillForm(wrapper, { confirmPassword: 'different123' })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('兩次輸入的密碼不一致')
    expect(fetch).not.toHaveBeenCalled()
  })

  test('密碼長度不足 8 碼時顯示錯誤', async () => {
    const wrapper = mountRegisterViews()
    await fillForm(wrapper, { password: 'short1', confirmPassword: 'short1' })

    await wrapper.find('form').trigger('submit.prevent')

    expect(wrapper.text()).toContain('密碼至少需要 8 個字元')
    expect(fetch).not.toHaveBeenCalled()
  })
})

describe('RegisterViews - 送出註冊', () => {
  test('註冊成功後設定登入使用者並顯示成功訊息', async () => {
    const user = { id: 'user-1', display_name: '小明' }
    fetch.mockResolvedValue({ ok: true, status: 201, json: async () => ({ user }) })
    const wrapper = mountRegisterViews()
    await fillForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/auth/signup'),
      expect.objectContaining({
        method: 'POST',
        credentials: 'include',
        body: JSON.stringify({
          display_name: '小明',
          email: 'user@example.com',
          password: 'password123',
        }),
      }),
    )
    expect(wrapper.text()).toContain('註冊成功')
  })

  test('email 已被註冊時顯示 409 錯誤訊息', async () => {
    fetch.mockResolvedValue({ ok: false, status: 409, json: async () => ({}) })
    const wrapper = mountRegisterViews()
    await fillForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('此 Email 已被註冊')
  })

  test('超過註冊速率限制時顯示 429 錯誤訊息與等待分鐘數', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 429,
      headers: { get: () => '120' },
      json: async () => ({}),
    })
    const wrapper = mountRegisterViews()
    await fillForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('註冊太頻繁')
    expect(wrapper.text()).toContain('2 分鐘')
  })

  test('其他錯誤時顯示後端回傳的訊息', async () => {
    fetch.mockResolvedValue({ ok: false, status: 500, json: async () => ({ message: '伺服器錯誤' }) })
    const wrapper = mountRegisterViews()
    await fillForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('伺服器錯誤')
  })

  test('fetch 拋出例外時顯示網路錯誤訊息', async () => {
    fetch.mockRejectedValue(new Error('network down'))
    const wrapper = mountRegisterViews()
    await fillForm(wrapper)

    await wrapper.find('form').trigger('submit.prevent')
    await flushPromises()

    expect(wrapper.text()).toContain('網路錯誤')
  })
})
