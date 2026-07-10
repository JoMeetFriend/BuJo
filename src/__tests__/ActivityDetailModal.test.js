import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, test, vi, afterEach } from 'vitest'
import ActivityDetailModal from '@/components/ActivityDetailModal.vue'
import AvailabilityPickerModal from '@/components/AvailabilityPickerModal.vue'

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
  globalThis.fetch = vi.fn((url, options = {}) => {
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
  delete globalThis.fetch
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
})

describe('ActivityDetailModal - voting 狀態下，候選時段清單留著給大家看，但圈圈只有建立者才有', () => {
  test('非建立者在 voting 狀態仍看得到候選時段跟票數，但沒有圈圈，footer 顯示「已報名」', async () => {
    const activity = makeActivity({
      is_creator: false,
      has_joined: true,
      status: 'voting',
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('候選時段（並列最高票')
    expect(wrapper.text()).toContain('2 票')
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)

    const joinedBadge = wrapper.findAll('span').find((s) => s.text() === '已報名')
    expect(joinedBadge).toBeTruthy()
  })

  test('建立者在 voting 狀態看得到候選時段的圈圈可以裁決', async () => {
    const activity = makeActivity({ is_creator: true, status: 'voting' })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('input[type="radio"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('候選時段（並列最高票')
  })

  test('只有一個候選時段最高票時，建立者不用手動點選，直接可以按下成團', async () => {
    const activity = makeActivity({
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 3,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('input[type="radio"][value="slot-a"]').element.checked).toBe(true)

    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('確認此時段成團'))
    expect(confirmButton.attributes('disabled')).toBeUndefined()
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

describe('ActivityDetailModal - closable 時右上角提供小關閉按鈕（不擋日期）', () => {
  test('closable 為 false（預設）時不顯示關閉按鈕', async () => {
    const activity = makeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-close').exists()).toBe(false)
  })

  test('closable 為 true 時顯示關閉按鈕，且跟日期文字分開顯示', async () => {
    const activity = makeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1', closable: true },
    })
    await flushPromises()

    const closeButton = wrapper.find('.activity-detail-close')
    expect(closeButton.exists()).toBe(true)
    expect(closeButton.text()).toBe('×')
    expect(wrapper.find('.activity-detail-date').exists()).toBe(true)
  })

  test('點關閉按鈕會 emit close', async () => {
    const activity = makeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1', closable: true },
    })
    await flushPromises()

    await wrapper.find('.activity-detail-close').trigger('click')

    expect(wrapper.emitted('close')).toHaveLength(1)
  })
})

describe('ActivityDetailModal - availability_mode: slot 的活動行為維持現況不變（回歸測試）', () => {
  test('slot 模式的活動報名與決選畫面行為維持現況不變', async () => {
    const activity = makeActivity({ availability_mode: 'slot' })
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('候選時段（目前票數，可提前手動成團）')
    expect(wrapper.text()).toContain('2 票')

    await wrapper.find('input[type="radio"][value="slot-a"]').setValue(true)
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('提前成團'))
    await confirmButton.trigger('click')
    await flushPromises()

    const confirmCall = calls.find((c) => c.url.includes('/confirm-formation'))
    expect(JSON.parse(confirmCall.options.body)).toEqual({ candidateSlotId: 'slot-a' })
  })

  test('非建立者在 slot 模式下點「報名參加」仍走原本的 candidateSlotIds 流程，不會開啟 AvailabilityPickerModal', async () => {
    const activity = makeActivity({
      availability_mode: 'slot',
      is_creator: false,
      has_joined: false,
    })
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    await wrapper.find('input[type="checkbox"][value="slot-a"]').setValue(true)
    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(JSON.parse(joinCall.options.body)).toEqual({ candidateSlotIds: ['slot-a'] })
    expect(wrapper.findComponent(AvailabilityPickerModal).exists()).toBe(false)
  })
})

function makeRangeActivity(overrides = {}) {
  return makeActivity({
    availability_mode: 'range',
    requires_voting: true,
    is_creator: false,
    has_joined: false,
    status: 'recruiting',
    fixed_date: '2026-07-12',
    time_window_start: '10:00',
    time_window_end: '18:00',
    candidate_slots: [],
    decision_candidates: { perfect_overlap: [], partial_overlap: [] },
    ...overrides,
  })
}

function makeScenarioCActivity(overrides = {}) {
  return makeActivity({
    availability_mode: 'slot',
    schedule_variant: 'find_date',
    requires_voting: true,
    is_creator: false,
    has_joined: false,
    status: 'recruiting',
    candidate_slots: [
      { id: 'slot-a', slot_start: '2026-08-01T19:00:00', slot_end: '2026-08-01T21:00:00' },
      { id: 'slot-b', slot_start: '2026-08-03T19:00:00', slot_end: '2026-08-03T21:00:00' },
      { id: 'slot-c', slot_start: '2026-08-09T19:00:00', slot_end: '2026-08-09T21:00:00' },
    ],
    decision_candidates: [
      {
        id: 'slot-a',
        slot_start: '2026-08-01T19:00:00',
        slot_end: '2026-08-01T21:00:00',
        count: 2,
      },
      {
        id: 'slot-b',
        slot_start: '2026-08-03T19:00:00',
        slot_end: '2026-08-03T21:00:00',
        count: 1,
      },
      {
        id: 'slot-c',
        slot_start: '2026-08-09T19:00:00',
        slot_end: '2026-08-09T21:00:00',
        count: 2,
      },
    ],
    ...overrides,
  })
}

describe('ActivityDetailModal - Scenario C 日期-only 報名流程', () => {
  test('Scenario C join uses a date-only availability picker', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('尚未選擇日期')
    expect(wrapper.text()).not.toContain('選擇你方便的候選時段（可複選）')

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.exists()).toBe(true)
    expect(picker.props('modelValue')).toBe(true)
    expect(picker.props('dateOnly')).toBe(true)
    expect(picker.props('allowedDates')).toEqual(['2026-08-01', '2026-08-03', '2026-08-09'])
  })

  test('未提供 schedule_variant 時維持舊 checkbox 流程', async () => {
    const activity = makeScenarioCActivity({ schedule_variant: undefined })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('選擇你方便的候選時段（可複選）')
    expect(wrapper.find('input[type="checkbox"][value="slot-a"]').exists()).toBe(true)
  })

  test('Participant confirms selected dates', async () => {
    const activity = makeScenarioCActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    await picker.vm.$emit('confirm', [
      { date: '2026-08-01', allDay: true, timeRanges: [] },
      { date: '2026-08-09', allDay: true, timeRanges: [] },
    ])
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(JSON.parse(joinCall.options.body)).toEqual({ candidateSlotIds: ['slot-a', 'slot-c'] })
  })

  test('Scenario C joined state shows selected dates', async () => {
    const activity = makeScenarioCActivity({
      has_joined: true,
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T19:00:00',
          slot_end: '2026-08-01T21:00:00',
          is_selected: true,
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T19:00:00',
          slot_end: '2026-08-03T21:00:00',
          is_selected: false,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('你選擇的日期')
    expect(wrapper.text()).toContain('8/1')

    const reviseButton = wrapper.findAll('button').find((b) => b.text().includes('修改日期'))
    expect(reviseButton).toBeTruthy()

    await reviseButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.props('modelValue')).toBe(true)
    expect(picker.props('initialDates')).toEqual(['2026-08-01'])
  })

  test('Joined participant views frozen scenario C activity', async () => {
    const activity = makeScenarioCActivity({
      has_joined: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T19:00:00',
          slot_end: '2026-08-01T21:00:00',
          is_selected: true,
        },
        {
          id: 'slot-c',
          slot_start: '2026-08-09T19:00:00',
          slot_end: '2026-08-09T21:00:00',
          is_selected: true,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('你選擇的日期')
    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('8/9')
    expect(wrapper.text()).not.toContain('修改日期')
  })
})

describe('ActivityDetailModal - availability_mode: range 的報名流程', () => {
  test('非建立者點「報名參加」會開啟 AvailabilityPickerModal 並帶入 fixedDate/timeWindowStart/timeWindowEnd', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.exists()).toBe(true)
    expect(picker.props('modelValue')).toBe(true)
    expect(picker.props('fixedDate')).toBe('2026-07-12')
    expect(picker.props('timeWindowStart')).toBe('10:00')
    expect(picker.props('timeWindowEnd')).toBe('18:00')
  })

  test('確認彈窗選取後，把回傳結果轉成 {ranges} 呼叫 join API；整天視為當日 00:00–23:59 的單一 range', async () => {
    const activity = makeRangeActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    await picker.vm.$emit('confirm', [{ date: '2026-07-12', allDay: true, timeRanges: [] }])
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(JSON.parse(joinCall.options.body)).toEqual({
      ranges: [{ start: '2026-07-12T00:00:00', end: '2026-07-12T23:59:00' }],
    })
  })

  test('確認彈窗選取多段自訂時段時，每段都轉成一個 range', async () => {
    const activity = makeRangeActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    await picker.vm.$emit('confirm', [
      {
        date: '2026-07-12',
        allDay: false,
        timeRanges: [
          { from: '10:00', to: '12:00' },
          { from: '14:00', to: '16:00' },
        ],
      },
    ])
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(JSON.parse(joinCall.options.body)).toEqual({
      ranges: [
        { start: '2026-07-12T10:00:00', end: '2026-07-12T12:00:00' },
        { start: '2026-07-12T14:00:00', end: '2026-07-12T16:00:00' },
      ],
    })
  })
})

function makeRangeDecisionActivity(overrides = {}) {
  return makeRangeActivity({
    requires_voting: true,
    is_creator: true,
    status: 'voting',
    decision_candidates: {
      perfect_overlap: [
        {
          slot_start: '2026-07-12T10:00:00Z',
          slot_end: '2026-07-12T12:00:00Z',
          count: 3,
        },
      ],
      partial_overlap: [
        {
          slot_start: '2026-07-12T14:00:00Z',
          slot_end: '2026-07-12T16:00:00Z',
          count: 2,
        },
        {
          slot_start: '2026-07-12T16:00:00Z',
          slot_end: '2026-07-12T18:00:00Z',
          count: 1,
        },
      ],
    },
    ...overrides,
  })
}

describe('ActivityDetailModal - availability_mode: range 的決選畫面', () => {
  test('建立者的決選畫面分別渲染 perfect_overlap／partial_overlap 兩個區塊', async () => {
    const activity = makeRangeDecisionActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('完全重疊')
    expect(wrapper.text()).toContain('部分重疊')

    const radios = wrapper.findAll('input[type="radio"][name="decision-slot"]')
    expect(radios).toHaveLength(3)
  })

  test('建立者選取 partial_overlap 候選並確認成團時，呼叫 confirm-formation 帶上 {slotStart, slotEnd}', async () => {
    const activity = makeRangeDecisionActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const radios = wrapper.findAll('input[type="radio"][name="decision-slot"]')
    // partial_overlap 的第二筆：16:00–18:00
    await radios[2].setValue(true)

    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('確認此時段成團'))
    await confirmButton.trigger('click')
    await flushPromises()

    const confirmCall = calls.find((c) => c.url.includes('/confirm-formation'))
    expect(JSON.parse(confirmCall.options.body)).toEqual({
      slotStart: '2026-07-12T16:00:00Z',
      slotEnd: '2026-07-12T18:00:00Z',
    })
  })
})
