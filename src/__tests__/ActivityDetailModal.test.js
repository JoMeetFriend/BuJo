import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, test, vi, afterEach } from 'vitest'
import ActivityDetailModal from '@/components/ActivityDetailModal.vue'

function makeActivity(overrides = {}) {
  return {
    id: 'act-1',
    title: '揪團活動',
    creator: { display_name: '小明', avatar_url: '' },
    is_creator: true,
    has_joined: false,
    status: 'recruiting',
    requires_voting: true,
    current_count: 2,
    participant_target: null,
    location: '',
    description: '',
    candidate_slots: [
      { id: 'slot-a', slot_start: '2026-07-10T10:00:00Z', slot_end: '2026-07-10T12:00:00Z' },
      { id: 'slot-b', slot_start: '2026-07-11T10:00:00Z', slot_end: '2026-07-11T12:00:00Z' },
    ],
    decision_candidates: [
      {
        id: 'slot-a',
        slot_start: '2026-07-10T10:00:00Z',
        slot_end: '2026-07-10T12:00:00Z',
        count: 2,
      },
      {
        id: 'slot-b',
        slot_start: '2026-07-11T10:00:00Z',
        slot_end: '2026-07-11T12:00:00Z',
        count: 1,
      },
    ],
    confirmed_slot: null,
    participants: [],
    ...overrides,
  }
}

function stubFetch(activity, { confirmOk = true } = {}) {
  const calls = []
  global.fetch = vi.fn((url, options = {}) => {
    calls.push({ url, options })
    if (options.method === 'POST' && url.includes('/confirm-formation')) {
      return Promise.resolve({
        ok: confirmOk,
        json: () => Promise.resolve(confirmOk ? { activity } : { message: '操作失敗' }),
      })
    }
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ activity }),
    })
  })
  return calls
}

afterEach(() => {
  vi.unstubAllGlobals()
  delete global.fetch
})

describe('ActivityDetailModal - 情境二三四(requires_voting) 揪團中提前手動成團', () => {
  test('建立者在 recruiting 狀態下可看到候選時段票數並選取後啟用「提前成團」按鈕', async () => {
    const activity = makeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('候選時段（目前票數，可提前手動成團）')
    expect(wrapper.text()).toContain('2 票')

    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('提前成團'))
    expect(confirmButton).toBeTruthy()
    expect(confirmButton.attributes('disabled')).toBeDefined()

    await wrapper.find('input[type="radio"][value="slot-a"]').setValue(true)
    expect(confirmButton.attributes('disabled')).toBeUndefined()
  })

  test('點擊「提前成團」會呼叫 confirm-formation 並帶上選取的候選時段 id', async () => {
    const activity = makeActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    await wrapper.find('input[type="radio"][value="slot-a"]').setValue(true)
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('提前成團'))
    await confirmButton.trigger('click')
    await flushPromises()

    const confirmCall = calls.find((c) => c.url.includes('/confirm-formation'))
    expect(confirmCall).toBeTruthy()
    expect(confirmCall.options.method).toBe('POST')
    expect(JSON.parse(confirmCall.options.body)).toEqual({ candidateSlotId: 'slot-a' })
    expect(wrapper.text()).toContain('成團成功')
  })

  test('非建立者且尚未報名時，仍維持原本的複選加入 UI，不會同時顯示決選票數區塊', async () => {
    const activity = makeActivity({ is_creator: false, has_joined: false })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('選擇你方便的候選時段')
    expect(wrapper.text()).not.toContain('候選時段（目前票數，可提前手動成團）')
  })
})

describe('ActivityDetailModal - 報名後保留使用者自己勾選的候選時段', () => {
  test('已報名時改顯示唯讀的「你選擇的候選時段」，並依 is_selected 還原勾選狀態', async () => {
    const activity = makeActivity({
      is_creator: false,
      has_joined: true,
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          is_selected: true,
        },
        {
          id: 'slot-b',
          slot_start: '2026-07-11T10:00:00Z',
          slot_end: '2026-07-11T12:00:00Z',
          is_selected: false,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('你選擇的候選時段')
    expect(wrapper.text()).not.toContain('選擇你方便的候選時段（可複選）')

    const checkboxA = wrapper.find('input[type="checkbox"][value="slot-a"]')
    const checkboxB = wrapper.find('input[type="checkbox"][value="slot-b"]')
    expect(checkboxA.element.checked).toBe(true)
    expect(checkboxB.element.checked).toBe(false)
    expect(checkboxA.attributes('disabled')).toBeDefined()
    expect(checkboxB.attributes('disabled')).toBeDefined()

    // 非建立者在 recruiting 階段沒有任何操作可以用到這個區塊，不該重複顯示決選票數框
    expect(wrapper.text()).not.toContain('候選時段（目前票數，可提前手動成團）')
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)
  })

  test('決選投票階段依 decision_candidates 的 is_selected 還原使用者自己投的那一票', async () => {
    const activity = makeActivity({
      is_creator: false,
      has_joined: true,
      status: 'tiebreaking',
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 2,
          is_selected: true,
        },
        {
          id: 'slot-b',
          slot_start: '2026-07-11T10:00:00Z',
          slot_end: '2026-07-11T12:00:00Z',
          count: 1,
          is_selected: false,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('input[type="radio"][value="slot-a"]').element.checked).toBe(true)

    const voteButton = wrapper.findAll('button').find((b) => b.text().includes('送出決選投票'))
    expect(voteButton).toBeTruthy()
    expect(voteButton.attributes('disabled')).toBeUndefined()
  })
})

describe('ActivityDetailModal - 標題日期顯示候選時段的完整日期區間', () => {
  test('候選時段橫跨多個日期時，標題顯示日期區間', async () => {
    const activity = makeActivity({
      candidate_slots: [
        { id: 'slot-a', slot_start: '2026-07-15T04:00:00Z', slot_end: '2026-07-15T05:00:00Z' },
        { id: 'slot-b', slot_start: '2026-07-16T04:00:00Z', slot_end: '2026-07-16T05:00:00Z' },
        { id: 'slot-c', slot_start: '2026-07-17T04:00:00Z', slot_end: '2026-07-17T05:00:00Z' },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-date').text()).toBe('7/15 ~ 7/17')
  })

  test('候選時段都在同一天時，標題只顯示單一日期', async () => {
    const activity = makeActivity({
      candidate_slots: [
        { id: 'slot-a', slot_start: '2026-07-15T02:00:00Z', slot_end: '2026-07-15T03:00:00Z' },
        { id: 'slot-b', slot_start: '2026-07-15T09:00:00Z', slot_end: '2026-07-15T10:00:00Z' },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-date').text()).toBe('7/15')
  })
})

describe('ActivityDetailModal - 有人數上限時顯示還缺多少人成團', () => {
  test('recruiting 狀態下且未達標時，顯示「還差 N 人」', async () => {
    const activity = makeActivity({
      participant_target: 5,
      current_count: 2,
      status: 'recruiting',
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('已報名 2 / 5 人')
    expect(wrapper.text()).toContain('還差 3 人')
  })

  test('沒有設定人數上限時，不顯示還差人數，改顯示「沒有限制報名人數」，已報名人數顯示 ∞', async () => {
    const activity = makeActivity({ participant_target: null, current_count: 2 })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('還差')
    expect(wrapper.text()).not.toContain('人數上限')
    expect(wrapper.text()).toContain('沒有限制報名人數')
    expect(wrapper.text()).toContain('已報名 2 / ∞ 人')
    expect(wrapper.find('.activity-detail-infinity').exists()).toBe(true)
  })

  test('有設定人數上限時，不顯示「沒有限制報名人數」', async () => {
    const activity = makeActivity({ participant_target: 5, current_count: 2 })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('沒有限制報名人數')
    expect(wrapper.text()).toContain('人數上限 5 人')
  })
})

describe('ActivityDetailModal - 頭像相對路徑要補上 API base URL，避免破圖', () => {
  test('建立者頭像是相對路徑時，會補上 API base URL', async () => {
    const activity = makeActivity({
      creator: { display_name: '小明', avatar_url: '/uploads/avatars/creator.png' },
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-creator img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/creator.png',
    )
  })

  test('參與者頭像是相對路徑時，會補上 API base URL', async () => {
    const activity = makeActivity({
      participants: [
        { id: 'p-1', display_name: '小華', avatar_url: '/uploads/avatars/participant.png' },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-avatars img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/participant.png',
    )
  })
})
