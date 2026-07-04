import { mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test } from 'vitest'
import CalendarMain from '@/components/CalendarMain.vue'
import { useAuthStore } from '@/stores/auth'

async function mountCalendarMain(user = {}) {
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
      { path: '/', component: CalendarMain },
      { path: '/login', component: { template: '<div>Login</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(CalendarMain, {
    global: {
      plugins: [pinia, router],
      stubs: {
        DateEventsModal: true,
        EventPage: true,
        MarqueeBanner: true,
        ProfileAccountModal: true,
      },
    },
  })
}

describe('CalendarMain', () => {
  test('主頁右上角帳號按鈕會顯示正規化後的使用者頭像', async () => {
    const wrapper = await mountCalendarMain({
      avatar_url: '/uploads/avatars/avatar-user.png',
    })

    const profileButton = wrapper.get('[aria-label="開啟個人帳號"]')
    expect(profileButton.get('img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('主頁右上角帳號按鈕沒有頭像時保留 fallback', async () => {
    const wrapper = await mountCalendarMain()

    const profileButton = wrapper.get('[aria-label="開啟個人帳號"]')
    expect(profileButton.find('img').exists()).toBe(false)
    expect(profileButton.find('.profile-pixel-face').exists()).toBe(true)
  })
})
