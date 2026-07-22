import { mount, flushPromises } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, vi } from 'vitest'
import CalendarMain from '@/components/CalendarMain.vue'
import calendarMainSource from '@/components/CalendarMain.vue?raw'
import { useAuthStore } from '@/stores/auth'
import { createTestI18n } from './testUtils'

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
      plugins: [pinia, router, createTestI18n()],
      stubs: {
        ActivityDetailModal: true,
        BaseModal: {
          props: ['isOpen'],
          template: '<div v-if="isOpen"><slot /></div>',
        },
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

  test('已成團的活動會依據建立者身分，分別顯示 MINE 或 JOINED 樣式', async () => {
    const originalFetch = global.fetch

    const d = new Date()
    const year = d.getFullYear()
    const month = String(d.getMonth() + 1).padStart(2, '0')
    const day1 = `${year}-${month}-15`
    const day2 = `${year}-${month}-16`

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
                date_iso: day1,
                confirmed_start: `${day1}T02:00:00.000Z`,
                time: '10:00 - 12:00',
                location: '',
              },
              {
                id: 'a-joined-confirmed',
                title: '我加入且已成團',
                status: 'confirmed',
                is_creator: false,
                has_joined: true,
                date_iso: day2,
                confirmed_start: `${day2}T04:00:00.000Z`,
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
    expect(chips).toHaveLength(2)

    // 驗證建立者 (MINE)
    expect(chips[0].classes()).toContain('calendar-event-chip--formed')
    expect(chips[0].text()).toContain('我創建')

    // 驗證參與者 (JOINED)
    expect(chips[1].classes()).toContain('calendar-event-chip--joined')
    expect(chips[1].text()).toContain('已參加')

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

  test.each([
    ['click', null],
    ['keydown', { key: 'Enter' }],
    ['keydown', { key: ' ' }],
  ])('點擊或鍵盤操作日期格（%s）會開啟當天完整活動清單', async (eventName, options) => {
    const originalFetch = global.fetch
    const today = isoToday()
    global.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'a-first',
                title: '第一筆活動',
                status: 'confirmed',
                is_creator: true,
                has_joined: true,
                date_iso: today,
                confirmed_start: `${today}T02:00:00.000Z`,
              },
              {
                id: 'a-second',
                title: '第二筆活動',
                status: 'confirmed',
                is_creator: false,
                has_joined: true,
                date_iso: today,
                confirmed_start: `${today}T04:00:00.000Z`,
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    const todayCell = wrapper.get('.calendar-cell.is-today')
    await todayCell.trigger(eventName, options ?? undefined)

    const dateModal = wrapper.getComponent({ name: 'DateEventsModal' })
    expect(dateModal.props('date')).toBe(today)
    expect(dateModal.props('events')).toHaveLength(2)

    wrapper.unmount()
    global.fetch = originalFetch
  })
})

describe('CalendarMain - UPCOMING 活動側欄', () => {
  test('只顯示選取月份中今天以後的活動，並依開始時間排序', async () => {
    const originalFetch = globalThis.fetch
    vi.setSystemTime(new Date(2026, 6, 19, 20, 0, 0))
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'yesterday',
                title: '昨天的活動',
                date_iso: '2026-07-18',
                confirmed_start: '2026-07-18T02:00:00.000Z',
              },
              {
                id: 'today-later',
                title: '今天較晚建立的活動',
                date_iso: '2026-07-19',
                confirmed_start: '2026-07-19T12:00:00.000Z',
              },
              {
                id: 'today-earlier',
                title: '今天較早開始的活動',
                date_iso: '2026-07-19',
                confirmed_start: '2026-07-19T01:00:00.000Z',
              },
              {
                id: 'tomorrow',
                title: '明天的活動',
                date_iso: '2026-07-20',
                confirmed_start: '2026-07-20T03:00:00.000Z',
              },
              {
                id: 'future-22',
                title: '三天後的活動',
                date_iso: '2026-07-22',
                confirmed_start: '2026-07-22T03:00:00.000Z',
              },
              {
                id: 'future-25',
                title: '六天後的活動',
                date_iso: '2026-07-25',
                confirmed_start: '2026-07-25T03:00:00.000Z',
              },
              {
                id: 'future-29',
                title: '十天後的活動',
                date_iso: '2026-07-29',
                confirmed_start: '2026-07-29T03:00:00.000Z',
              },
              {
                id: 'future-31',
                title: '月底的活動',
                date_iso: '2026-07-31',
                confirmed_start: '2026-07-31T03:00:00.000Z',
              },
              {
                id: 'next-month',
                title: '下個月的活動',
                date_iso: '2026-08-02',
                confirmed_start: '2026-08-02T03:00:00.000Z',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()

    const desktopRail = wrapper.get('.calendar-social-rail')
    const desktopCards = desktopRail.findAll('button.calendar-upcoming-card')
    expect(desktopRail.get('.calendar-rail-heading strong').text()).toBe('7')
    expect(desktopCards.map((card) => card.get('.calendar-upcoming-title').text())).toEqual([
      '今天較早開始的活動',
      '今天較晚建立的活動',
      '明天的活動',
      '三天後的活動',
      '六天後的活動',
      '十天後的活動',
      '月底的活動',
    ])
    expect(desktopRail.text()).not.toContain('昨天的活動')
    expect(desktopRail.text()).not.toContain('下個月的活動')
    expect(desktopCards[0].get('.calendar-upcoming-date strong').text()).toBe('19')
    expect(desktopCards[0].get('.calendar-upcoming-relative').text()).toBe('今天')
    expect(desktopCards[2].get('.calendar-upcoming-relative').text()).toBe('1 天後')
    expect(desktopCards[3].get('.calendar-upcoming-relative').text()).toBe('3 天後')
    expect(desktopCards.slice(0, 4).every((card) => card.classes().includes('is-soon'))).toBe(true)
    expect(desktopCards.slice(4).every((card) => !card.classes().includes('is-soon'))).toBe(true)
    expect(desktopRail.get('.calendar-upcoming-hint').text()).toBe('還有 2 個活動，往下捲動查看')

    const mobileTitles = wrapper
      .get('.calendar-mobile-pocket')
      .findAll('button.calendar-upcoming-card')
      .map((card) => card.get('.calendar-upcoming-title').text())
    expect(mobileTitles).toEqual(
      desktopCards.map((card) => card.get('.calendar-upcoming-title').text()),
    )
    const mobileCards = wrapper
      .get('.calendar-mobile-pocket')
      .findAll('button.calendar-upcoming-card')
    expect(mobileCards.map((card) => card.classes().includes('is-soon'))).toEqual(
      desktopCards.map((card) => card.classes().includes('is-soon')),
    )
    expect(wrapper.get('.calendar-mobile-pocket .calendar-upcoming-hint').text()).toBe(
      '還有 3 個活動，左右滑動查看',
    )

    wrapper.unmount()
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })

  test('切換月份會使用同一批資料重新篩選，過去月份顯示空狀態', async () => {
    const originalFetch = globalThis.fetch
    vi.setSystemTime(new Date(2026, 6, 19, 12, 0, 0))
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'july',
                title: '七月活動',
                date_iso: '2026-07-22',
                confirmed_start: '2026-07-22T03:00:00.000Z',
              },
              {
                id: 'august',
                title: '八月活動',
                date_iso: '2026-08-02',
                confirmed_start: '2026-08-02T03:00:00.000Z',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()
    const desktopRail = wrapper.get('.calendar-social-rail')

    expect(desktopRail.text()).toContain('七月活動')
    await wrapper.get('[aria-label="下一個月"]').trigger('click')
    expect(desktopRail.text()).toContain('八月活動')
    expect(desktopRail.text()).not.toContain('七月活動')
    expect(globalThis.fetch).toHaveBeenCalledTimes(1)

    await wrapper.get('[aria-label="上一個月"]').trigger('click')
    await wrapper.get('[aria-label="上一個月"]').trigger('click')
    expect(desktopRail.get('.calendar-upcoming-card.is-empty').text()).toBe(
      '本月沒有即將開始的活動',
    )
    expect(desktopRail.get('.calendar-rail-heading strong').text()).toBe('0')

    wrapper.unmount()
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })

  test('活動卡可直接開啟活動詳情，並具備桌機垂直與窄版水平捲動樣式', async () => {
    const originalFetch = globalThis.fetch
    vi.setSystemTime(new Date(2026, 6, 19, 12, 0, 0))
    globalThis.fetch = vi.fn(() =>
      Promise.resolve({
        ok: true,
        json: () =>
          Promise.resolve({
            activities: [
              {
                id: 'clickable',
                title: '可以點擊的活動',
                date_iso: '2026-07-22',
                confirmed_start: '2026-07-22T03:00:00.000Z',
              },
              {
                id: 'second-but-not-soon',
                title: '第二筆但不是近期活動',
                date_iso: '2026-07-29',
                confirmed_start: '2026-07-29T03:00:00.000Z',
              },
            ],
          }),
      }),
    )

    const wrapper = await mountCalendarMain()
    await flushPromises()
    await wrapper.get('.calendar-social-rail button.calendar-upcoming-card').trigger('click')

    expect(wrapper.findComponent({ name: 'DateEventsModal' }).exists()).toBe(false)
    expect(wrapper.findComponent({ name: 'ActivityDetailModal' }).props('activityId')).toBe(
      'clickable',
    )
    wrapper.findComponent({ name: 'ActivityDetailModal' }).vm.$emit('close')
    await wrapper.vm.$nextTick()
    await wrapper.get('.calendar-mobile-pocket button.calendar-upcoming-card').trigger('click')
    expect(wrapper.findComponent({ name: 'ActivityDetailModal' }).props('activityId')).toBe(
      'clickable',
    )
    const desktopCards = wrapper
      .get('.calendar-social-rail')
      .findAll('button.calendar-upcoming-card')
    expect(desktopCards[0].classes()).toContain('is-soon')
    expect(desktopCards[1].classes()).not.toContain('is-soon')
    expect(calendarMainSource).toMatch(
      /\.calendar-upcoming-list\s*\{[\s\S]*?max-height: 568px;[\s\S]*?overflow-y: auto;/,
    )
    expect(calendarMainSource).toMatch(
      /\.calendar-upcoming-list\s*\{[\s\S]*?padding-right: 10px;[\s\S]*?scrollbar-gutter: stable;/,
    )
    expect(calendarMainSource).toContain('.calendar-upcoming-card.is-soon')
    expect(calendarMainSource).toContain(
      'color-mix(in srgb, var(--bujo-card-blue) 44%, var(--bujo-white))',
    )
    expect(calendarMainSource).not.toMatch(/\.calendar-upcoming-card:nth-child\(-n \+ 2\)/)
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 900px\) \{[\s\S]*?\.calendar-upcoming-list\s*\{[\s\S]*?overflow-x: auto;[\s\S]*?overflow-y: hidden;/,
    )
    expect(calendarMainSource).toContain('flex: 0 0 min(58vw, 210px);')
    expect(calendarMainSource).toContain('min-height: 88px;')
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 640px\) \{[\s\S]*?\.calendar-mobile-pocket \.calendar-upcoming-card\s*{[^}]*flex-basis: min\(42vw, 160px\);[^}]*min-height: 72px;[^}]*gap: 5px;[^}]*padding: 9px 10px 8px;/,
    )
    expect(calendarMainSource).not.toMatch(/\.calendar-upcoming-card:hover\s*\{[^}]*transform:/)

    wrapper.unmount()
    globalThis.fetch = originalFetch
    vi.useRealTimers()
  })
})

describe('CalendarMain', () => {
  test('手機版日期格會把 +N 移至右上角，並替首筆活動標題保留更多寬度', () => {
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 640px\) \{[\s\S]*?\.calendar-event-list\s*\{[^}]*padding-inline: 2px;/,
    )
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 640px\) \{[\s\S]*?\.calendar-event-chip\s*\{[^}]*grid-template-columns: 4px minmax\(0, 1fr\);[^}]*gap: 3px;[^}]*padding: 1px 3px;[^}]*font-size: 10px;/,
    )
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 640px\) \{[\s\S]*?\.calendar-event-dot\s*\{[^}]*width: 4px;[^}]*height: 4px;/,
    )
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 640px\) \{[\s\S]*?\.calendar-more-count\s*\{[^}]*top: 4px;[^}]*right: 4px;[^}]*bottom: auto;[^}]*padding: 0;[^}]*font-size: 8px;[^}]*line-height: 1;/,
    )

    expect(calendarMainSource).toMatch(
      /\.calendar-event-chip\s*\{[^}]*grid-template-columns: 7px minmax\(0, 1fr\) auto;[^}]*gap: 6px;[^}]*padding: 2px 6px;[^}]*font-size: 11px;/,
    )
    expect(calendarMainSource).toMatch(/\.calendar-event-dot\s*\{[^}]*width: 6px;[^}]*height: 6px;/)
  })

  test('短螢幕手機會避開固定控制項並讓月曆吸收剩餘高度', () => {
    expect(calendarMainSource).toContain(
      'padding: 8px 8px calc(84px + env(safe-area-inset-bottom, 0px));',
    )
    expect(calendarMainSource).toMatch(
      /\.calendar-mobile-controls\s*\{[\s\S]*?display: flex;[\s\S]*?align-items: center;[\s\S]*?height: 34px;/,
    )
    expect(calendarMainSource).not.toContain('calendar-mobile-control-spacer')
    expect(calendarMainSource).toMatch(
      /@media \(max-width: 640px\) and \(max-height: 700px\) \{[\s\S]*?\.calendar-board\s*\{[\s\S]*?flex: 1 1 auto;[\s\S]*?height: clamp\(220px, calc\(100dvh - 330px\), 360px\);[\s\S]*?min-height: 220px;[\s\S]*?max-height: 360px;/,
    )
    expect(calendarMainSource).toMatch(
      /\.calendar-toggle-dots-mobile\s*\{[\s\S]*?width: 26px;[\s\S]*?height: 26px;/,
    )
    expect(calendarMainSource).not.toMatch(
      /\.calendar-toggle-dots-mobile\s*\{[\s\S]*?position: fixed;/,
    )
  })

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

  test('主頁右上角帳號按鈕頭像圖片載入失敗時改顯示 fallback', async () => {
    const wrapper = await mountCalendarMain({
      avatar_url: 'https://res.cloudinary.com/demo/avatar-dead-link.png',
    })

    const profileButton = wrapper.get('[aria-label="開啟個人帳號"]')
    expect(profileButton.find('img').exists()).toBe(true)

    await profileButton.get('img').trigger('error')

    expect(profileButton.find('img').exists()).toBe(false)
    expect(profileButton.find('.profile-pixel-face').exists()).toBe(true)
  })
})
