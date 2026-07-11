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
    // 票數並列（沒有唯一最高票），不會自動預選，維持測試「手動選取才啟用按鈕」的意圖
    const activity = makeActivity({
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 1,
        },
        {
          id: 'slot-b',
          slot_start: '2026-07-11T10:00:00Z',
          slot_end: '2026-07-11T12:00:00Z',
          count: 1,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('候選時段（目前票數，可提前手動成團）')
    expect(wrapper.text()).toContain('1 票')

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

    expect(wrapper.text()).toContain('候選時段（依票數排序')
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
    expect(wrapper.text()).toContain('候選時段（依票數排序')
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

    expect(wrapper.text()).toContain('點擊「報名參加」選取你方便的日期')
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

  test('已經過去的候選日期不會出現在報名者可選的日期清單裡——那天已經開始/結束，選了沒有意義', async () => {
    vi.useFakeTimers()
    // 8/1 這個候選日的時段是 19:00-21:00，設在 8/2 代表 8/1 已經完全過去；8/3、8/9 都還沒到
    vi.setSystemTime(new Date('2026-08-02T00:00:00'))

    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.props('allowedDates')).toEqual(['2026-08-03', '2026-08-09'])

    vi.useRealTimers()
  })

  test('時間欄位顯示候選時段的固定時間，不是「候選時段投票中」，並提示日期投票中', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    // Mode C 的時間本來就是固定的，投票的是日期不是時段，不該顯示「候選時段投票中」
    expect(wrapper.text()).not.toContain('候選時段投票中')
    expect(wrapper.text()).toContain('下午 7:00')
    expect(wrapper.text()).toContain('下午 9:00')
    expect(wrapper.text()).toContain('日期投票中')
  })

  test('已成團（confirmed_slot 存在）時不顯示「日期投票中」', async () => {
    const activity = makeScenarioCActivity({
      status: 'confirmed',
      has_joined: true,
      confirmed_slot: { slot_start: '2026-08-01T19:00:00', slot_end: '2026-08-01T21:00:00' },
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('日期投票中')
    expect(wrapper.text()).toContain('8/1')
  })

  test('尚未成團時，「日期」欄位顯示「日期投票中」', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('日期投票中')
  })

  test('尚未成團時，「日期」欄位直接列出實際候選日期 chip，不用點進 picker', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('8/3')
    expect(wrapper.text()).toContain('8/9')
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

    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('8/9')
    expect(wrapper.text()).not.toContain('修改日期')
  })
})

function makeScenarioDActivity(overrides = {}) {
  return makeActivity({
    availability_mode: 'slot',
    schedule_variant: 'find_date_time',
    requires_voting: true,
    is_creator: false,
    has_joined: false,
    status: 'recruiting',
    candidate_slots: [
      { id: 'slot-a', slot_start: '2026-08-01T14:00:00', slot_end: '2026-08-01T16:00:00' },
      { id: 'slot-b', slot_start: '2026-08-03T09:00:00', slot_end: '2026-08-03T12:00:00' },
    ],
    decision_candidates: [
      {
        id: 'slot-a',
        slot_start: '2026-08-01T14:00:00',
        slot_end: '2026-08-01T16:00:00',
        count: 1,
        perfect_overlap: [],
        partial_overlap: [],
      },
      {
        id: 'slot-b',
        slot_start: '2026-08-03T09:00:00',
        slot_end: '2026-08-03T12:00:00',
        count: 1,
        perfect_overlap: [],
        partial_overlap: [],
      },
    ],
    ...overrides,
  })
}

describe('ActivityDetailModal - Scenario D 候選時段窗口報名流程', () => {
  test('點「報名參加」對情境四活動開啟 picker 而非顯示 checkbox', async () => {
    const activity = makeScenarioDActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('選擇你方便的候選時段（可複選）')
    expect(wrapper.find('input[type="checkbox"]').exists()).toBe(false)

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.exists()).toBe(true)
    expect(picker.props('modelValue')).toBe(true)
    expect(picker.props('dateOnly')).toBe(false)
    expect(picker.props('allowedDates')).toEqual(['2026-08-01', '2026-08-03'])
    expect(picker.props('dateWindows')).toEqual({
      '2026-08-01': { start: '14:00', end: '16:00', slotId: 'slot-a' },
      '2026-08-03': { start: '09:00', end: '12:00', slotId: 'slot-b' },
    })
  })

  test('候選時段 chip 清單直接顯示實際候選日期，不用點進 picker 才看得到', async () => {
    const activity = makeScenarioDActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('日期、時段投票中（2）')
    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('8/3')
  })

  test('已報名後，自己選的候選日期 chip 有標示，沒選的沒有', async () => {
    const activity = makeScenarioDActivity({
      has_joined: true,
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          is_selected: true,
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T09:00:00',
          slot_end: '2026-08-03T12:00:00',
          is_selected: false,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const mineChip = wrapper.findAll('.activity-detail-chip').find((c) => c.text().includes('8/1'))
    const otherChip = wrapper.findAll('.activity-detail-chip').find((c) => c.text().includes('8/3'))

    expect(mineChip.classes()).toContain('activity-detail-chip--mine')
    expect(otherChip.classes()).not.toContain('activity-detail-chip--mine')
  })

  test('點擊候選日期 chip 顯示當天時段，再點一次收起來', async () => {
    const activity = makeScenarioDActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const chip = wrapper.findAll('.activity-detail-chip').find((c) => c.text().includes('8/1'))
    expect(wrapper.text()).not.toContain('14:00–16:00')

    await chip.trigger('click')
    expect(wrapper.text()).toContain('14:00–16:00')

    await chip.trigger('click')
    expect(wrapper.text()).not.toContain('14:00–16:00')
  })

  test('滑鼠移到候選日期 chip 上顯示當天時段，移開後自動消失', async () => {
    const activity = makeScenarioDActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const chip = wrapper.findAll('.activity-detail-chip').find((c) => c.text().includes('8/1'))

    await chip.trigger('mouseenter')
    expect(wrapper.text()).toContain('14:00–16:00')

    await chip.trigger('mouseleave')
    expect(wrapper.text()).not.toContain('14:00–16:00')
  })

  test('候選日期超過 3 個時只顯示前 3 個 + 「更多」，點擊展開顯示全部', async () => {
    const activity = makeScenarioDActivity({
      candidate_slots: [
        { id: 's1', slot_start: '2026-08-01T14:00:00', slot_end: '2026-08-01T16:00:00' },
        { id: 's2', slot_start: '2026-08-03T14:00:00', slot_end: '2026-08-03T16:00:00' },
        { id: 's3', slot_start: '2026-08-05T14:00:00', slot_end: '2026-08-05T16:00:00' },
        { id: 's4', slot_start: '2026-08-07T14:00:00', slot_end: '2026-08-07T16:00:00' },
        { id: 's5', slot_start: '2026-08-09T14:00:00', slot_end: '2026-08-09T16:00:00' },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('日期、時段投票中（5）')
    // panelDate 卡片標題本來就會顯示候選區間（8/1 ~ 8/9），所以不能用整頁文字判斷「8/9 沒出現」，
    // 要限定在 chip 清單本身
    let chipTexts = wrapper.findAll('.activity-detail-chip').map((c) => c.text())
    expect(chipTexts.some((t) => t.includes('8/1'))).toBe(true)
    expect(chipTexts.some((t) => t.includes('8/3'))).toBe(true)
    expect(chipTexts.some((t) => t.includes('8/5'))).toBe(true)
    expect(chipTexts.some((t) => t.includes('8/7'))).toBe(false)
    expect(chipTexts.some((t) => t.includes('8/9'))).toBe(false)

    const moreButton = wrapper.find('.activity-detail-chip--more')
    expect(moreButton.text()).toBe('+2')
    await moreButton.trigger('click')

    chipTexts = wrapper.findAll('.activity-detail-chip').map((c) => c.text())
    expect(chipTexts.some((t) => t.includes('8/7'))).toBe(true)
    expect(chipTexts.some((t) => t.includes('8/9'))).toBe(true)

    // 展開後同一顆按鈕要能再點一次收合回去，不是隻能展開不能收
    const collapseButton = wrapper.find('.activity-detail-chip--more')
    expect(collapseButton.text()).toBe('−')
    await collapseButton.trigger('click')

    chipTexts = wrapper.findAll('.activity-detail-chip').map((c) => c.text())
    expect(chipTexts.some((t) => t.includes('8/7'))).toBe(false)
    expect(chipTexts.some((t) => t.includes('8/9'))).toBe(false)
    expect(wrapper.find('.activity-detail-chip--more').text()).toBe('+2')
  })

  test('切換到不同活動時，候選時段展開/提示框狀態要重置，不能沿用上一個活動的狀態', async () => {
    const activityA = makeScenarioDActivity({
      candidate_slots: [
        { id: 's1', slot_start: '2026-08-01T14:00:00', slot_end: '2026-08-01T16:00:00' },
        { id: 's2', slot_start: '2026-08-03T14:00:00', slot_end: '2026-08-03T16:00:00' },
        { id: 's3', slot_start: '2026-08-05T14:00:00', slot_end: '2026-08-05T16:00:00' },
        { id: 's4', slot_start: '2026-08-07T14:00:00', slot_end: '2026-08-07T16:00:00' },
      ],
    })
    const activityB = makeScenarioDActivity({
      candidate_slots: [
        { id: 't1', slot_start: '2026-09-01T14:00:00', slot_end: '2026-09-01T16:00:00' },
        { id: 't2', slot_start: '2026-09-03T14:00:00', slot_end: '2026-09-03T16:00:00' },
        { id: 't3', slot_start: '2026-09-05T14:00:00', slot_end: '2026-09-05T16:00:00' },
        { id: 't4', slot_start: '2026-09-07T14:00:00', slot_end: '2026-09-07T16:00:00' },
      ],
    })
    globalThis.fetch = vi.fn((url) => {
      const activity = url.includes('act-b') ? activityB : activityA
      return Promise.resolve({ ok: true, json: () => Promise.resolve({ activity }) })
    })

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-a' },
    })
    await flushPromises()

    const moreButton = wrapper.find('.activity-detail-chip--more')
    await moreButton.trigger('click')
    let chipTexts = wrapper.findAll('.activity-detail-chip').map((c) => c.text())
    expect(chipTexts.some((t) => t.includes('9/7'))).toBe(false) // 還沒切換，這是情境A自己的日期不存在

    await wrapper.setProps({ activityId: 'act-b' })
    await flushPromises()

    // 換了活動 B 之後，B 的候選時段清單應該要是收合狀態（只顯示前 3 個），
    // 不能延續活動 A 展開過的狀態
    chipTexts = wrapper.findAll('.activity-detail-chip').map((c) => c.text())
    expect(chipTexts.some((t) => t.includes('9/7'))).toBe(false)
    expect(wrapper.find('.activity-detail-chip--more').text()).toBe('+1')
  })

  test('handleScenarioDConfirm 正確把 range 對應回 slotId，用正確欄位名稱送出 candidateSlotRanges', async () => {
    const activity = makeScenarioDActivity()
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
      { date: '2026-08-01', allDay: false, timeRanges: [{ from: '14:00', to: '16:00' }] },
      { date: '2026-08-03', allDay: false, timeRanges: [{ from: '09:00', to: '12:00' }] },
    ])
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(JSON.parse(joinCall.options.body)).toEqual({
      candidateSlotIds: ['slot-a', 'slot-b'],
      candidateSlotRanges: [
        {
          candidateSlotId: 'slot-a',
          rangeStart: '2026-08-01T14:00:00',
          rangeEnd: '2026-08-01T16:00:00',
        },
        {
          candidateSlotId: 'slot-b',
          rangeStart: '2026-08-03T09:00:00',
          rangeEnd: '2026-08-03T12:00:00',
        },
      ],
    })
  })

  test('已報名後進入 voting/confirmed 狀態，正確顯示已選候選時段摘要', async () => {
    const activity = makeScenarioDActivity({
      has_joined: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          is_selected: true,
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T09:00:00',
          slot_end: '2026-08-03T12:00:00',
          is_selected: false,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('你已選擇的候選時段')
    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('下午 2:00')
    expect(wrapper.text()).not.toContain('選擇你方便的候選時段（可複選）')
  })

  test('已報名後「修改報名時段」按鈕出現、重開 picker 帶入每個候選時段自己的 my_range 預填', async () => {
    const activity = makeScenarioDActivity({
      has_joined: true,
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          is_selected: true,
          my_range: { start: '2026-08-01T14:00:00', end: '2026-08-01T15:30:00' },
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T09:00:00',
          slot_end: '2026-08-03T12:00:00',
          is_selected: true,
          my_range: { start: '2026-08-03T09:00:00', end: '2026-08-03T11:00:00' },
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const reviseButton = wrapper.findAll('button').find((b) => b.text().includes('修改報名時段'))
    expect(reviseButton).toBeTruthy()

    await reviseButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.props('modelValue')).toBe(true)
    expect(picker.props('initialRanges')).toEqual([
      { date: '2026-08-01', from: '14:00', to: '15:30' },
      { date: '2026-08-03', from: '09:00', to: '11:00' },
    ])
  })
})

describe('ActivityDetailModal - Scenario D 建立者決策畫面巢狀交集顯示', () => {
  function makeScenarioDDecisionActivity(overrides = {}) {
    return makeScenarioDActivity({
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          count: 2,
          perfect_overlap: [
            {
              id: 'temp-2026-08-01T14:00:00.000Z',
              slot_start: '2026-08-01T14:00:00',
              slot_end: '2026-08-01T15:00:00',
              count: 2,
            },
          ],
          partial_overlap: [
            {
              id: 'temp-2026-08-01T15:00:00.000Z',
              slot_start: '2026-08-01T15:00:00',
              slot_end: '2026-08-01T16:00:00',
              count: 1,
            },
          ],
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T09:00:00',
          slot_end: '2026-08-03T12:00:00',
          count: 1,
          perfect_overlap: [],
          partial_overlap: [
            {
              id: 'temp-2026-08-03T09:00:00.000Z',
              slot_start: '2026-08-03T09:00:00',
              slot_end: '2026-08-03T10:00:00',
              count: 1,
            },
          ],
        },
      ],
      ...overrides,
    })
  }

  test('兩個候選時段各自有自己的 perfect_overlap/partial_overlap 資料時，決策區塊渲染兩組獨立的巢狀清單', async () => {
    const activity = makeScenarioDDecisionActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('8/1')
    expect(text).toContain('8/3')
    // 兩組候選時段各自都有「完全重疊」/「部分重疊」標籤，不是只顯示一份共用的
    expect((text.match(/完全重疊/g) ?? []).length).toBe(2)
    expect((text.match(/部分重疊/g) ?? []).length).toBe(2)
    // slot-a 的 perfect_overlap 窄窗口跟 slot-b 的 partial_overlap 窄窗口都要各自出現
    expect(text).toContain('下午 3:00')
    expect(text).toContain('上午 10:00')
  })

  test('選定某個候選時段底下的窄窗口並確認時，正確送出 candidateSlotId+slotStart+slotEnd', async () => {
    const activity = makeScenarioDDecisionActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const radios = wrapper.findAll('input[type="radio"]')
    const target = radios.find(
      (r) => r.attributes('value') === 'slot-b::temp-2026-08-03T09:00:00.000Z',
    )
    expect(target).toBeTruthy()
    await target.setValue(true)

    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('確認此時段成團'))
    await confirmButton.trigger('click')
    await flushPromises()

    const confirmCall = calls.find((c) => c.url.includes('/confirm-formation'))
    expect(JSON.parse(confirmCall.options.body)).toEqual({
      candidateSlotId: 'slot-b',
      slotStart: '2026-08-03T09:00:00',
      slotEnd: '2026-08-03T10:00:00',
    })
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

  test('標題日期顯示活動的 fixed_date，不是空白——range 模式沒有 candidate_slots/confirmed_slot 可以推導', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-date').text()).toBe('7/12')
  })

  test('卡片內文的「日期」欄位也顯示 fixed_date，不是「投票中」——range 模式日期本來就是固定的', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const dateLabel = wrapper.findAll('.activity-detail-label').find((l) => l.text() === '日期')
    expect(dateLabel).toBeTruthy()
    expect(dateLabel.element.nextElementSibling.textContent).toBe('7/12')
    expect(wrapper.text()).not.toContain('日期投票中')
  })

  test('時間欄位顯示建立者實際設定的可回報時間窗，不是暗示有候選清單的「候選時段投票中」', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    // 標籤本身就改成「時間投票中」，值只留純時間窗文字，不用再重複一次「時間投票中」
    const timeLabel = wrapper.findAll('.activity-detail-label').find((l) => l.text() === '時間投票中')
    expect(timeLabel).toBeTruthy()
    expect(timeLabel.element.nextElementSibling.textContent).toBe('10:00–18:00區間')
    expect(wrapper.text()).not.toContain('候選時段投票中')
  })

  test('沒有設定時間窗（整天皆可）時，時間欄位顯示「整天皆可回報」', async () => {
    const activity = makeRangeActivity({ time_window_start: null, time_window_end: null })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('整天皆可回報')
  })

  test('未報名時不顯示可複選候選時段的文案，改顯示合併後的淺色提示文字', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('點擊「報名參加」選取你方便的時間')
    expect(wrapper.text()).not.toContain('候選時段（可複選）')
  })

  test('已報名、recruiting 狀態顯示實際回報的時間摘要', async () => {
    const activity = makeRangeActivity({
      has_joined: true,
      my_ranges: [{ start: '2026-07-12T10:00:00Z', end: '2026-07-12T13:00:00Z' }],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('你已回報的時間')
    expect(wrapper.text()).toContain('7/12')
    expect(wrapper.text()).toContain('下午 6:00')
    expect(wrapper.text()).toContain('下午 9:00')
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

  test('已報名、recruiting 狀態顯示「修改時間」而不是「取消報名」，跟情境三的「修改日期」一致', async () => {
    const activity = makeRangeActivity({
      has_joined: true,
      my_ranges: [{ start: '2026-07-12T10:00:00Z', end: '2026-07-12T13:00:00Z' }],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('修改時間')
    expect(wrapper.text()).not.toContain('取消報名')
  })

  test('點「修改時間」重開 picker，會用 my_ranges 預填參與者自己先前送出的時段', async () => {
    const activity = makeRangeActivity({
      has_joined: true,
      my_ranges: [{ start: '2026-07-12T10:00:00Z', end: '2026-07-12T13:00:00Z' }],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
    })
    await flushPromises()

    const editButton = wrapper.findAll('button').find((b) => b.text().includes('修改時間'))
    await editButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.props('initialRanges')).toEqual([
      { date: '2026-07-12', from: '18:00', to: '21:00' },
    ])
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
