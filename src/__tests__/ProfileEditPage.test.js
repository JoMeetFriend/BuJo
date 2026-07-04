import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import ProfileEditPage from '@/components/ProfileEditPage.vue'
import { useAuthStore } from '@/stores/auth'

const baseUser = {
  display_name: 'Test A',
  avatar_url: '',
  uid: 'bujo-user-d5e6f',
  id: 'legacy-11111',
  identities: [
    { provider: 'local', email: 'test@example.com' },
    { provider: 'google', email: 'google@example.com' },
  ],
}

function stubClipboard(writeText = vi.fn().mockResolvedValue()) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  return writeText
}

async function selectAvatarFile(wrapper, file) {
  const input = wrapper.find('input[type="file"]')
  Object.defineProperty(input.element, 'files', {
    value: [file],
    configurable: true,
  })
  await input.trigger('change')
  await flushPromises()
}

async function mountProfileEditPage(user = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.setUser({
    ...baseUser,
    ...user,
  })

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/profile/edit', component: ProfileEditPage }],
  })
  await router.push('/profile/edit')
  await router.isReady()

  const wrapper = mount(ProfileEditPage, {
    global: {
      plugins: [pinia, router],
    },
  })
  await flushPromises()
  return wrapper
}

beforeEach(() => {
  vi.restoreAllMocks()
  globalThis.fetch = vi.fn()
  stubClipboard()
  window.google = {
    accounts: {
      id: {
        initialize: vi.fn(),
        prompt: vi.fn(),
      },
    },
  }
})

describe('ProfileEditPage', () => {
  test('顯示新版頁首、頭像旁摘要與既有控制', async () => {
    const wrapper = await mountProfileEditPage()

    expect(wrapper.get('h1').text()).toBe('個人編輯頁面')
    expect(wrapper.text()).toContain('Test A')
    expect(wrapper.text()).toContain('Bujo ID: d5e6f')
    expect(wrapper.text()).toContain('更換頭像')
    expect(wrapper.find('input[placeholder="請輸入顯示名稱"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('取消')
    expect(wrapper.text()).toContain('儲存變更')
    expect(wrapper.text()).toContain('已連接的登入方式')
  })

  test('優先使用 uid 後五碼，沒有 uid 時 fallback 到 id 後五碼', async () => {
    const wrapper = await mountProfileEditPage()

    expect(wrapper.text()).toContain('Bujo ID: d5e6f')
    expect(wrapper.text()).not.toContain('11111')

    const fallbackWrapper = await mountProfileEditPage({
      uid: undefined,
      id: 'e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f',
    })

    expect(fallbackWrapper.text()).toContain('Bujo ID: d5e6f')
  })

  test('沒有 uid 與 id 時不顯示 Bujo ID 與複製按鈕', async () => {
    const wrapper = await mountProfileEditPage({
      uid: undefined,
      id: undefined,
    })

    expect(wrapper.text()).not.toContain('Bujo ID')
    expect(wrapper.find('[aria-label="複製 BuJo ID"]').exists()).toBe(false)
  })

  test('複製按鈕只複製可見五碼', async () => {
    const writeText = stubClipboard(vi.fn().mockResolvedValue())
    const wrapper = await mountProfileEditPage()

    await wrapper.find('[aria-label="複製 BuJo ID"]').trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('d5e6f')
    expect(wrapper.text()).toContain('已複製')
  })

  test('移除頭像標題列與基本資料電子郵件列', async () => {
    const wrapper = await mountProfileEditPage()

    const sectionHeadings = wrapper.findAll('h2').map((heading) => heading.text())
    expect(sectionHeadings).not.toContain('頭像')
    expect(wrapper.text()).not.toContain('電子郵件')
    expect(wrapper.text()).toContain('test@example.com')
  })

  test('初始相對頭像路徑會補上 API base URL', async () => {
    const wrapper = await mountProfileEditPage({
      avatar_url: '/uploads/avatars/avatar-user.png',
    })

    expect(wrapper.get('img[alt="使用者頭像"]').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('更換頭像會用 FormData 上傳並更新目前登入者頭像', async () => {
    fetch.mockResolvedValue({
      ok: true,
      json: vi.fn().mockResolvedValue({
        user: {
          id: 'user-1',
          display_name: 'Test A',
          avatar_url: '/uploads/avatars/avatar-user-1.png',
        },
      }),
    })
    const wrapper = await mountProfileEditPage()
    const authStore = useAuthStore()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await selectAvatarFile(wrapper, file)

    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/users/me/avatar'),
      expect.objectContaining({
        method: 'PATCH',
        credentials: 'include',
        body: expect.any(FormData),
      }),
    )
    const requestOptions = fetch.mock.calls[0][1]
    expect(requestOptions).not.toHaveProperty('headers')
    expect(requestOptions.body.get('avatar')).toBe(file)
    expect(authStore.user.avatar_url).toBe('/uploads/avatars/avatar-user-1.png')
    expect(wrapper.find('img[alt="使用者頭像"]').attributes('src')).toContain(
      '/uploads/avatars/avatar-user-1.png',
    )
    expect(wrapper.text()).toContain('頭像已更新')
  })

  test('更換頭像只接受 JPG、PNG、WebP 且最多 2MB', async () => {
    const wrapper = await mountProfileEditPage()
    const gifFile = new File(['avatar'], 'avatar.gif', { type: 'image/gif' })

    await selectAvatarFile(wrapper, gifFile)

    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('僅支援 JPG、PNG、WebP')

    const largeFile = new File([new Uint8Array(2 * 1024 * 1024 + 1)], 'large.png', {
      type: 'image/png',
    })
    await selectAvatarFile(wrapper, largeFile)

    expect(fetch).not.toHaveBeenCalled()
    expect(wrapper.text()).toContain('圖片大小不可超過 2MB')
  })

  test('更換頭像失敗時顯示後端錯誤訊息', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 413,
      json: vi.fn().mockResolvedValue({ message: '圖片超過 2MB' }),
    })
    const wrapper = await mountProfileEditPage()
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })

    await selectAvatarFile(wrapper, file)

    expect(fetch).toHaveBeenCalledTimes(1)
    expect(wrapper.text()).toContain('圖片超過 2MB')
  })
})
