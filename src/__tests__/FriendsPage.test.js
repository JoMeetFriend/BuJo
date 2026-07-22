import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import axios from 'axios'
import FriendsPage from '@/components/FriendsPage.vue'
import friendsPageSource from '@/components/FriendsPage.vue?raw'
import { createTestI18n } from './testUtils'

vi.mock('axios', () => {
  const apiClient = {
    get: vi.fn(),
    post: vi.fn(),
    delete: vi.fn(),
    interceptors: { request: { use: vi.fn() } },
  }
  return { default: { create: vi.fn(() => apiClient) } }
})

const apiClient = axios.create()

beforeEach(() => {
  setActivePinia(createPinia())
  vi.clearAllMocks()
})

function mountFriendsPage() {
  return mount(FriendsPage, {
    global: {
      plugins: [createTestI18n()],
      stubs: { FriendAddModal: true },
    },
  })
}

function mockFriend(overrides = {}) {
  return {
    id: 'friend-1',
    friendship_id: 'friendship-1',
    display_name: 'Alice',
    bio: '',
    avatar_url: null,
    ...overrides,
  }
}

describe('FriendsPage', () => {
  it('相對路徑頭像會補上 API base URL 才拿去顯示', async () => {
    apiClient.get.mockResolvedValue({
      data: [mockFriend({ avatar_url: '/uploads/avatars/avatar-user.png' })],
    })

    const wrapper = mountFriendsPage()
    await flushPromises()

    const img = wrapper.get('.friend-stamp-avatar img')
    expect(img.attributes('src')).toBe('http://localhost:3000/uploads/avatars/avatar-user.png')
  })

  it('完整 URL 頭像原樣顯示', async () => {
    apiClient.get.mockResolvedValue({
      data: [mockFriend({ avatar_url: 'https://res.cloudinary.com/demo/avatar.png' })],
    })

    const wrapper = mountFriendsPage()
    await flushPromises()

    const img = wrapper.get('.friend-stamp-avatar img')
    expect(img.attributes('src')).toBe('https://res.cloudinary.com/demo/avatar.png')
  })

  it('沒有頭像時顯示 fallback pixel face 而不是破圖的 img', async () => {
    apiClient.get.mockResolvedValue({ data: [mockFriend({ avatar_url: null })] })

    const wrapper = mountFriendsPage()
    await flushPromises()

    expect(wrapper.find('.friend-stamp-avatar img').exists()).toBe(false)
    expect(wrapper.find('.friend-stamp-face').exists()).toBe(true)
  })

  it('頭像容器維持固定尺寸＋overflow hidden，圖片用 object-cover 裁切，避免大圖撐破外框', async () => {
    apiClient.get.mockResolvedValue({
      data: [mockFriend({ avatar_url: 'https://res.cloudinary.com/demo/avatar.png' })],
    })

    const wrapper = mountFriendsPage()
    await flushPromises()

    const img = wrapper.get('.friend-stamp-avatar img')
    expect(img.classes()).toEqual(expect.arrayContaining(['h-full', 'w-full', 'object-cover']))
    expect(friendsPageSource).toMatch(
      /\.friend-stamp-avatar\s*\{[^}]*width:\s*56px;[^}]*height:\s*56px;[^}]*overflow:\s*hidden;/,
    )
  })
})
