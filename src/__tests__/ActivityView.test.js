import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, test, vi, afterEach } from 'vitest'
import ActivityView from '@/components/ActivityView.vue'

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

function mountActivityView() {
  return mount(ActivityView, {
    global: {
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
    const wrapper = mountActivityView()
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
    const wrapper = mountActivityView()
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
    const wrapper = mountActivityView()
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
    const wrapper = mountActivityView()
    await flushPromises()

    await clickFilter(wrapper, 'HOSTING')
    expect(wrapper.findAll('.activity-mini-card')).toHaveLength(2)
  })
})
