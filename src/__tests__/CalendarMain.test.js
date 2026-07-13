import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
import CalendarMain from '@/components/CalendarMain.vue'
import calendarMainSource from '@/components/CalendarMain.vue?raw'
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

  test('已成團的活動不分建立者或參與者身分，一律歸類為 formed 樣式', async () => {
    const originalFetch = global.fetch
    const today = isoToday()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'a-creator-confirmed',
                title: '我建立且已成團',
                status: 'confirmed',
                is_creator: true,
                has_joined: true,
                date_iso: today,
                confirmed_start: `${today}T02:00:00.000Z`,
                time: '10:00 - 12:00',
                location: '',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    const chips = wrapper.findAll('.calendar-event-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].classes()).toContain('calendar-event-chip--formed')
    expect(chips[0].classes()).not.toContain('calendar-event-chip--personal')
    expect(chips[0].classes()).not.toContain('calendar-event-chip--joined')

    global.fetch = originalFetch
  })
})

describe('CalendarMain - 同一天有多筆活動時，只顯示最早的一條，其餘用 +N 表示', () => {
  test('同一天有 2 筆活動時，只顯示時間最早的一條，並顯示 +1', async () => {
    const originalFetch = global.fetch
    const today = isoToday()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'a-later',
                title: '較晚的活動',
                status: 'confirmed',
                is_creator: true,
                has_joined: true,
                date_iso: today,
                confirmed_start: `${today}T06:00:00.000Z`,
                time: '14:00 - 16:00',
                location: '',
              },
              {
                id: 'a-earlier',
                title: '較早的活動',
                status: 'confirmed',
                is_creator: true,
                has_joined: true,
                date_iso: today,
                confirmed_start: `${today}T02:00:00.000Z`,
                time: '10:00 - 12:00',
                location: '',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    const chips = wrapper.findAll('.calendar-event-chip')
    expect(chips).toHaveLength(1)
    expect(chips[0].text()).toContain('較早的活動')
    expect(wrapper.find('.calendar-more-count').text()).toBe('+1')

    global.fetch = originalFetch
  })

  test('同一天只有 1 筆活動時，不顯示 +N', async () => {
    const originalFetch = global.fetch
    const today = isoToday()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'a-only',
                title: '唯一的活動',
                status: 'confirmed',
                is_creator: true,
                has_joined: true,
                date_iso: today,
                confirmed_start: `${today}T02:00:00.000Z`,
                time: '10:00 - 12:00',
                location: '',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    expect(wrapper.findAll('.calendar-event-chip')).toHaveLength(1)
    expect(wrapper.find('.calendar-more-count').exists()).toBe(false)

    global.fetch = originalFetch
  })
})

describe('CalendarMain', () => {
  test('今天只在原日期位置顯示柔和紅色圓形，並提供 aria-current 語意', async () => {
    const originalFetch = globalThis.fetch
    vi.setSystemTime(new Date(2026, 6, 11, 12, 0, 0))
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ activities: [] }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    const todayCell = wrapper.get('.calendar-cell.is-today')
    expect(todayCell.attributes('aria-current')).toBe('date')
    const todayNumber = todayCell.get('.calendar-day-number--today')
    expect(todayNumber.text()).toBe('11')
    expect(todayNumber.classes()).toContain('calendar-day-number')
    expect(calendarMainSource).toMatch(/\.calendar-day-number\s*\{\s*display: inline-block;/)
    expect(calendarMainSource).toContain('class="w-full p-1 leading-none md:p-1.5"')
    expect(calendarMainSource).toMatch(
      /\.calendar-day-number--today::before\s*\{[\s\S]*?width: 20px;[\s\S]*?height: 20px;/,
    )
    expect(calendarMainSource).toMatch(
      /@media \(min-width: 768px\) \{[\s\S]*?\.calendar-day-number--today::before\s*\{[\s\S]*?width: 22px;[\s\S]*?height: 22px;/,
    )
    expect(todayCell.find('.calendar-today-suffix').exists()).toBe(false)
    expect(wrapper.findAll('[aria-current="date"]')).toHaveLength(1)

    const regularCell = wrapper
      .findAll('.calendar-cell')
      .find(
        (cell) =>
          cell.find('.calendar-day-number').exists() && !cell.classes().includes('is-today'),
      )
    expect(regularCell.find('.calendar-day-number--today').exists()).toBe(false)
    expect(regularCell.get('.calendar-day-number').classes()).toEqual(['calendar-day-number'])
    expect(regularCell.attributes('aria-current')).toBeUndefined()

    wrapper.unmount()
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })

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
