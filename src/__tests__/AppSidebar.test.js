import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
import axios from 'axios'
import AppSidebar from '@/components/AppSidebar.vue'
import appSidebarSource from '@/components/AppSidebar.vue?raw'
import { useAuthStore } from '@/stores/auth'

vi.mock('axios', () => {
  const apiClient = { get: vi.fn().mockResolvedValue({ data: { unreadCount: 0 } }) }
  return { default: { create: vi.fn(() => apiClient) } }
})

const notificationApiClient = axios.create()

let router

async function mountAppSidebar(user = {}) {
  const pinia = createPinia()
  setActivePinia(pinia)
  const authStore = useAuthStore()
  authStore.setUser({
    id: 'user-1',
    display_name: 'Test A',
    avatar_url: '',
    ...user,
  })

  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Calendar</div>' } },
      { path: '/profile/edit', component: { template: '<div>Profile</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
      { path: '/activity', component: { template: '<div>Activity</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(AppSidebar, {
    props: {
      isOpen: true,
      filters: { joined: true, formed: true, personal: true },
    },
    global: {
      plugins: [pinia, router],
      stubs: {
        ProfileAccountModal: true,
      },
    },
  })
}

describe('AppSidebar', () => {
  test('手機月曆篩選按鈕往導覽列內收，避免貼住活動卡片', () => {
    expect(appSidebarSource).toContain('bottom: calc(100% - 13px);')
  })

  test('側欄下方個人入口會顯示正規化後的使用者頭像', async () => {
    const wrapper = await mountAppSidebar({
      avatar_url: '/uploads/avatars/avatar-user.png',
    })

    const profileButton = wrapper.get('[aria-label="開啟側邊欄個人帳號"]')
    expect(profileButton.get('img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('手機底部個人帳號按鈕會顯示正規化後的使用者頭像', async () => {
    const wrapper = await mountAppSidebar({
      avatar_url: '/uploads/avatars/avatar-user.png',
    })

    const profileButton = wrapper.get('[aria-label="開啟個人帳號"]')
    expect(profileButton.get('img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('沒有頭像時側欄下方個人入口保留 fallback', async () => {
    const wrapper = await mountAppSidebar()

    const profileButton = wrapper.get('[aria-label="開啟側邊欄個人帳號"]')
    expect(profileButton.find('img').exists()).toBe(false)
    expect(profileButton.find('.profile-pixel-face').exists()).toBe(true)
  })

  test('點擊側欄下方個人入口會開啟帳號彈窗', async () => {
    const wrapper = await mountAppSidebar()

    expect(wrapper.findComponent({ name: 'ProfileAccountModal' }).exists()).toBe(false)

    await wrapper.get('[aria-label="開啟側邊欄個人帳號"]').trigger('click')

    expect(wrapper.findComponent({ name: 'ProfileAccountModal' }).exists()).toBe(true)
  })

  test('沒有未讀通知時不顯示 ALERTS 未讀數徽章', async () => {
    const wrapper = await mountAppSidebar()
    await flushPromises()

    expect(wrapper.findAll('.bujo-nav-badge')).toHaveLength(0)
  })

  test('有未讀通知時桌機與手機 ALERTS 圖示會顯示相同未讀數', async () => {
    notificationApiClient.get.mockResolvedValueOnce({ data: { unreadCount: 2 } })

    const wrapper = await mountAppSidebar()
    await flushPromises()

    const badges = wrapper.findAll('.bujo-nav-badge')
    expect(badges).toHaveLength(2)
    expect(badges.map((badge) => badge.text())).toEqual(['2', '2'])
  })

  test('未讀通知數超過 9 則時桌機與手機徽章都顯示 9+', async () => {
    notificationApiClient.get.mockResolvedValueOnce({ data: { unreadCount: 12 } })

    const wrapper = await mountAppSidebar()
    await flushPromises()

    const badges = wrapper.findAll('.bujo-nav-badge')
    expect(badges).toHaveLength(2)
    expect(badges.map((badge) => badge.text())).toEqual(['9+', '9+'])
  })

  test('route 切換後徽章反映最新未讀數', async () => {
    const wrapper = await mountAppSidebar()
    await flushPromises()
    expect(wrapper.findAll('.bujo-nav-badge')).toHaveLength(0)

    notificationApiClient.get.mockResolvedValueOnce({ data: { unreadCount: 3 } })
    await router.push('/profile/edit')
    await flushPromises()

    const badges = wrapper.findAll('.bujo-nav-badge')
    expect(badges).toHaveLength(2)
    expect(badges.map((badge) => badge.text())).toEqual(['3', '3'])
  })

  test('瀏覽器分頁回到可見時徽章反映最新未讀數', async () => {
    const wrapper = await mountAppSidebar()
    await flushPromises()
    expect(wrapper.findAll('.bujo-nav-badge')).toHaveLength(0)

    // 先前測試掛載的 sidebar 未卸載、listener 仍在，一律回傳相同值避免 Once 被搶先消耗
    notificationApiClient.get.mockResolvedValue({ data: { unreadCount: 4 } })
    Object.defineProperty(document, 'visibilityState', {
      configurable: true,
      value: 'visible',
    })
    document.dispatchEvent(new Event('visibilitychange'))
    await flushPromises()

    const badges = wrapper.findAll('.bujo-nav-badge')
    expect(badges).toHaveLength(2)
    expect(badges.map((badge) => badge.text())).toEqual(['4', '4'])
  })
})
