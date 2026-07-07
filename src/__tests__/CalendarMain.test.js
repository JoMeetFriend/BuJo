import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
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
        ProfileAccountModal: true,
      },
    },
  })
}

function isoToday() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('CalendarMain - 行事曆只依 date_iso 決定是否顯示活動', () => {
  test('只有 date_iso 非 null（已成團）的活動會畫進行事曆，recruiting 且 date_iso 為 null 的活動不會顯示', async () => {
    const originalFetch = global.fetch
    const today = isoToday()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'a-personal',
                title: '我建立且已成團',
                status: 'confirmed',
                is_creator: true,
                has_joined: true,
                date_iso: today,
                time: '10:00 - 12:00',
                location: '',
              },
              {
                id: 'a-joined',
                title: '我加入且已成團',
                status: 'confirmed',
                is_creator: false,
                has_joined: true,
                date_iso: today,
                time: '14:00 - 16:00',
                location: '',
              },
              {
                id: 'a-recruiting',
                title: '情境二三四揪團中，尚未成團',
                status: 'recruiting',
                is_creator: true,
                has_joined: true,
                date_iso: null,
                time: '投票中',
                location: '',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    expect(wrapper.text()).toContain('我建立且已成團')
    expect(wrapper.text()).toContain('我加入且已成團')
    expect(wrapper.text()).not.toContain('情境二三四揪團中，尚未成團')

    global.fetch = originalFetch
  })
})

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
