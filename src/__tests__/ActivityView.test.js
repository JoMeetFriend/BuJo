import { mount, flushPromises } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'
import { describe, expect, test, vi, afterEach } from 'vitest'
import ActivityView from '@/components/ActivityView.vue'
import ActivityDetailModal from '@/components/ActivityDetailModal.vue'
import { createTestI18n } from './testUtils'

function makeActivity(overrides = {}) {
  return {
    id: 'act-1',
    title: '活動',
    status: 'recruiting',
    is_creator: false,
    has_joined: false,
    date: '',
    ...overrides,
  }
}

function stubFetch(activities) {
  global.fetch = vi.fn(() =>
    Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ activities }),
    }),
  )
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete global.fetch
})

async function mountActivityView(path = '/activity') {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [{ path: '/activity', component: ActivityView }],
  })
  router.push(path)
  await router.isReady()
  return mount(ActivityView, {
    global: {
      plugins: [router, createTestI18n()],
      stubs: { ActivityDetailModal: true, EventPage: true },
    },
  })
}

async function clickFilter(wrapper, text) {
  const button = wrapper.findAll('button.activity-filter').find((b) => b.text().includes(text))
  await button.trigger('click')
}

describe('ActivityView - 篩選 tab 各自獨立對應 recruiting/joined/confirmed/hosting', () => {
  test('RECRUITING 計入所有 status===recruiting 的活動，不論是否為自己建立', async () => {
    const activities = [
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'friend-recruiting',
        is_creator: false,
        has_joined: false,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'friend-confirmed',
        is_creator: false,
        has_joined: true,
        status: 'confirmed',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, 'RECRUITING')
    expect(wrapper.text()).toContain('2')

    await clickFilter(wrapper, 'HOSTING')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(1)
  })

  test('JOINED 只算已報名、非自己建立、且尚未成團/取消的活動', async () => {
    const activities = [
      makeActivity({
        id: 'joined-recruiting',
        is_creator: false,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({ id: 'joined-voting', is_creator: false, has_joined: true, status: 'voting' }),
      makeActivity({
        id: 'joined-confirmed',
        is_creator: false,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, 'JOINED')
    const cards = wrapper.findAll('.activity-mini-card')
    expect(cards).toHaveLength(2)
  })

  test('CONFIRMED 計入所有 status===confirmed 的活動，不論是否為自己建立', async () => {
    const activities = [
      makeActivity({
        id: 'mine-confirmed',
        is_creator: true,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'friend-confirmed',
        is_creator: false,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, 'CONFIRMED')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })

  test('HOSTING 只依 is_creator，不分狀態', async () => {
    const activities = [
      makeActivity({
        id: 'mine-recruiting',
        is_creator: true,
        has_joined: true,
        status: 'recruiting',
      }),
      makeActivity({
        id: 'mine-confirmed',
        is_creator: true,
        has_joined: true,
        status: 'confirmed',
      }),
      makeActivity({
        id: 'friend-recruiting',
        is_creator: false,
        has_joined: false,
        status: 'recruiting',
      }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, 'HOSTING')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })
})

describe('ActivityView - focus query 聚焦指定活動', () => {
  test('底部活動小卡保留完整 title 屬性供 hover 或輔助工具讀取', async () => {
    const longTitle = '嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨'
    stubFetch([makeActivity({ title: longTitle })])
    const wrapper = await mountActivityView()
    await flushPromises()

    const title = wrapper.find('.activity-mini-card h2')
    expect(title.attributes('title')).toBe(longTitle)
    expect(title.text()).toBe('嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨...')
  })

  test('掛載於 /activity?focus=<id> 時 featured 為該活動且 modal 收到正確 activity-id', async () => {
    const activities = [
      makeActivity({ id: 'act-1' }),
      makeActivity({ id: 'act-2' }),
      makeActivity({ id: 'act-3' }),
    ]
    stubFetch(activities)
    const wrapper = await mountActivityView('/activity?focus=act-2')
    await flushPromises()

    expect(wrapper.findComponent(ActivityDetailModal).props('activityId')).toBe('act-2')
  })

  // 通知 deep link 指向的活動可能已取消（列表 API 不回傳 cancelled 活動）——
  // fallback 顯示第一筆會讓使用者以為看到的是通知講的那個活動，必須顯示明確提示
  test('focus 不存在於列表時顯示提示訊息，不 fallback 顯示別的活動', async () => {
    const activities = [makeActivity({ id: 'act-1' }), makeActivity({ id: 'act-2' })]
    stubFetch(activities)
    const wrapper = await mountActivityView('/activity?focus=act-999')
    await flushPromises()

    expect(wrapper.findComponent(ActivityDetailModal).exists()).toBe(false)
    expect(wrapper.text()).toContain('此活動已結束或不存在')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })

  test('focus 不存在時點擊活動卡可恢復正常瀏覽', async () => {
    const activities = [makeActivity({ id: 'act-1' }), makeActivity({ id: 'act-2' })]
    stubFetch(activities)
    const wrapper = await mountActivityView('/activity?focus=act-999')
    await flushPromises()

    await wrapper.findAll('.activity-mini-card')[1].trigger('click')

    expect(wrapper.findComponent(ActivityDetailModal).props('activityId')).toBe('act-2')
    expect(wrapper.text()).not.toContain('此活動已結束或不存在')
  })
})
