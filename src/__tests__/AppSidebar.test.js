import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test } from 'vitest'
import AppSidebar from '@/components/AppSidebar.vue'
import { useAuthStore } from '@/stores/auth'

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

  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div>Calendar</div>' } },
      { path: '/profile/edit', component: { template: '<div>Profile</div>' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
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
})
