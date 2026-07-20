import { mount, flushPromises } from '@vue/test-utils'
import { describe, expect, test, it, vi, beforeEach, afterEach } from 'vitest'
import ActivityDetailModal from '@/components/ActivityDetailModal.vue'
import AvailabilityPickerModal from '@/components/AvailabilityPickerModal.vue'
import { createTestI18n } from './testUtils'

// 決選候選清單現在會依 slot_start 判斷過期，多數既有測試把候選時段固定寫死在 2026-07-10~11，
// 全域固定一個早於這些日期的「現在」，避免這些寫死的固定日期隨著真實時間推進變成「已過期」
// 而讓一堆既有測試意外壞掉；個別測試需要不同時間點時，可以再呼叫自己的 vi.setSystemTime() 覆蓋
beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 6, 1))
})

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
  vi.useRealTimers()
})

describe('ActivityDetailModal - 活動標題顯示保護', () => {
  test('長標題仍保留完整 title 屬性供 hover 或輔助工具讀取', async () => {
    const longTitle = '嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨嗨'
    stubFetch(makeActivity({ title: longTitle }))

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-header h2').attributes('title')).toBe(longTitle)
  })
})

describe('ActivityDetailModal - 地點外部地圖連結', () => {
  test('有地點時顯示可點擊的 Google Maps 搜尋連結', async () => {
    const activity = makeActivity({ location: '台北車站' })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const link = wrapper.findAll('a').find((a) => a.text().includes('台北車站'))
    expect(link).toBeTruthy()
    expect(link.attributes('href')).toBe(
      'https://www.google.com/maps/search/?api=1&query=%E5%8F%B0%E5%8C%97%E8%BB%8A%E7%AB%99',
    )
    expect(link.attributes('target')).toBe('_blank')
  })

  test('沒有地點時不顯示地點區塊', async () => {
    const activity = makeActivity({ location: '' })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('地點')
  })
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('目前票數')
    // 沒有其他真人參與者（participants: []），分母為 0，只顯示人數，不顯示 X/Y人 比例
    expect(wrapper.text()).toContain('1人')

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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('候選時段投票中')
    expect(wrapper.text()).not.toContain('目前票數')
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('候選時段投票中')
    expect(wrapper.text()).toContain('取消報名')

    expect(wrapper.text()).not.toContain('目前票數')
  })
})

describe('ActivityDetailModal - voting 狀態下，決選候選清單只有建立者看得到', () => {
  test('非建立者在 voting 狀態看不到候選時段清單，footer 顯示「已報名」', async () => {
    const activity = makeActivity({
      is_creator: false,
      has_joined: true,
      status: 'voting',
      decision_candidates: null,
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('目前票數')
    expect(wrapper.find('input[type="radio"]').exists()).toBe(false)

    const joinedBadge = wrapper.findAll('span').find((s) => s.text() === '已報名')
    expect(joinedBadge).toBeTruthy()
  })

  test('建立者在 voting 狀態看得到候選時段的圈圈可以裁決', async () => {
    const activity = makeActivity({ is_creator: true, status: 'voting' })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('input[type="radio"]').exists()).toBe(true)
    expect(wrapper.text()).toContain('目前票數')
  })

  test('尚未有人投票時，不顯示目前票數標題與候選裁決清單', async () => {
    const activity = makeActivity({
      is_creator: true,
      status: 'recruiting',
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 0,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('目前票數')
    expect(wrapper.find('.activity-detail-options').exists()).toBe(false)
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const date = wrapper.find('.activity-detail-date')
    expect(date.text()).toBe('7/15~7/17')
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-date').text()).toBe('7/15')
  })
})

describe('ActivityDetailModal - 人數上限顯示精簡', () => {
  test('recruiting 狀態下且未達標時，不顯示人數上限提示與還差提示', async () => {
    const activity = makeActivity({
      participant_target: 5,
      current_count: 2,
      status: 'recruiting',
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-count').text()).toBe('2 / 5 人')
    expect(wrapper.text()).not.toContain('人數上限 5 人')
    expect(wrapper.text()).not.toContain('還差 3 人')
  })

  test('沒有設定人數上限時，不顯示人數上限提示，已報名人數顯示 ∞', async () => {
    const activity = makeActivity({ participant_target: null, current_count: 2 })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('還差')
    expect(wrapper.text()).not.toContain('人數上限')
    expect(wrapper.text()).not.toContain('沒有限制報名人數')
    expect(wrapper.find('.activity-detail-count').text()).toBe('2 / ∞ 人')
    expect(wrapper.find('.activity-detail-infinity').exists()).toBe(true)
  })

  test('有設定人數上限時，不顯示額外人數說明，只保留計數', async () => {
    const activity = makeActivity({ participant_target: 5, current_count: 2 })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('沒有限制報名人數')
    expect(wrapper.text()).not.toContain('人數上限 5 人')
    expect(wrapper.text()).not.toContain('還差')
    expect(wrapper.find('.activity-detail-count').text()).toBe('2 / 5 人')
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-creator').text()).toBe('小明')
    expect(wrapper.text()).not.toContain('小明 發起')
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-close').exists()).toBe(false)
  })

  test('closable 為 true 時顯示關閉按鈕，且跟日期文字分開顯示', async () => {
    const activity = makeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1', closable: true },
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('目前票數')
    expect(wrapper.text()).toContain('2人')

    await wrapper.find('input[type="radio"][value="slot-a"]').setValue(true)
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('提前成團'))
    await confirmButton.trigger('click')
    await flushPromises()

    const confirmCall = calls.find((c) => c.url.includes('/confirm-formation'))
    expect(JSON.parse(confirmCall.options.body)).toEqual({ candidateSlotId: 'slot-a' })
  })

  test('非建立者在 slot 模式下點「報名參加」會開啟 AvailabilityPickerModal 並正確送出 join', async () => {
    const activity = makeActivity({
      availability_mode: 'slot',
      requires_voting: false,
      is_creator: false,
      has_joined: false,
    })
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(joinCall).toBeTruthy()
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
    decision_candidates: [],
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
  test('已報名但沒有已選日期資料時，不顯示「尚未選擇日期」', async () => {
    const activity = makeScenarioCActivity({ has_joined: true })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('你報名的日期')
    expect(wrapper.text()).not.toContain('尚未選擇日期')
  })

  test('voting 狀態已報名但沒有已選日期資料時，不顯示「尚未選擇日期」', async () => {
    const activity = makeScenarioCActivity({ has_joined: true, status: 'voting' })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('你報名的日期')
    expect(wrapper.text()).not.toContain('尚未選擇日期')
  })

  test('Scenario C join uses a date-only availability picker', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('點擊「報名參加」選取你方便的日期')
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

  test('已經過去的候選日期仍會傳給 AvailabilityPickerModal（不整個濾掉），停用樣式交給 picker 自己的 isExpired 處理', async () => {
    vi.useFakeTimers()
    // 8/1 這個候選日的時段是 19:00-21:00，設在 8/2 代表 8/1 已經完全過去；8/3、8/9 都還沒到
    vi.setSystemTime(new Date('2026-08-02T00:00:00'))

    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    // 過期的 8/1 不能整個濾掉，不然 picker 收不到這個日期，isExpired 停用樣式永遠套用不到
    expect(picker.props('allowedDates')).toEqual(['2026-08-01', '2026-08-03', '2026-08-09'])

    vi.useRealTimers()
  })

  test('傳給 AvailabilityPickerModal 的 dateWindows 帶有每個候選日自己的實際起訖時間，不是空物件', async () => {
    // 迴歸測試：情境三如果沒有把 dateWindows 傳給 picker，picker 的 isExpired 只能退回用
    // 「當天 23:59」當過期邊界，導致候選時段其實已經過去（例如統一時間是 19:00-21:00，
    // 現在是同一天 22:00），日曆格子卻要等到隔天 00:00 之後才會被判定過期，這段期間會被
    // 誤判成還能選、還能點擊送出報名
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const picker = wrapper.findComponent(AvailabilityPickerModal)
    expect(picker.props('dateWindows')).toEqual({
      '2026-08-01': { start: '19:00', end: '21:00', slotId: 'slot-a' },
      '2026-08-03': { start: '19:00', end: '21:00', slotId: 'slot-b' },
      '2026-08-09': { start: '19:00', end: '21:00', slotId: 'slot-c' },
    })
  })

  test('時間欄位顯示候選時段的固定時間，不是「候選時段投票中」，並提示日期投票中', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    // Mode C 的時間本來就是固定的，投票的是日期不是時段，不該顯示「候選時段投票中」
    expect(wrapper.text()).not.toContain('候選時段投票中')
    expect(wrapper.text()).toContain('19:00')
    expect(wrapper.text()).toContain('21:00')
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('日期投票中')
  })

  test('尚未成團時，「日期」欄位直接列出實際候選日期 chip，不用點進 picker', async () => {
    const activity = makeScenarioCActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('8/3')
    expect(wrapper.text()).toContain('8/9')
  })

  test('未提供 schedule_variant 時透過 AvailabilityPickerModal 選擇日期報名', async () => {
    const activity = makeScenarioCActivity({ schedule_variant: undefined, requires_voting: false })
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('報名參加')
    const joinButton = wrapper.findAll('button').find((b) => b.text().includes('報名參加'))
    await joinButton.trigger('click')
    await flushPromises()

    const joinCall = calls.find((c) => c.url.includes('/join'))
    expect(joinCall).toBeTruthy()
  })

  test('Participant confirms selected dates', async () => {
    const activity = makeScenarioCActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
        segments: [],
      },
      {
        id: 'slot-b',
        slot_start: '2026-08-03T09:00:00',
        slot_end: '2026-08-03T12:00:00',
        count: 1,
        segments: [],
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('選擇你方便的候選時段（可複選）')
    expect(wrapper.text()).not.toContain('點擊「報名參加」選取你方便的時段')
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('日期、時段投票中')
    expect(wrapper.text()).not.toContain('日期、時段投票中（2）')
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('日期、時段投票中')
    expect(wrapper.text()).not.toContain('日期、時段投票中（5）')
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('已報名的時段')
    expect(wrapper.text()).toContain('8/1')
    expect(wrapper.text()).toContain('14:00')
    expect(wrapper.text()).not.toContain('選擇你方便的候選時段（可複選）')
  })

  test('已選擇的候選時段摘要顯示參與者實際選的子區間（my_range），不是候選時段整個窗口', async () => {
    const activity = makeScenarioDActivity({
      has_joined: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          // 候選時段窗口是 14:00-16:00，但參與者實際只選了窗口內的 14:00-14:30 子區間
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          is_selected: true,
          my_range: { start: '2026-08-01T14:00:00', end: '2026-08-01T14:30:00' },
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const summary = wrapper
      .findAll('.activity-detail-options')
      .find((el) => el.text().includes('已報名的時段'))
    expect(summary.text()).toContain('14:30')
    expect(summary.text()).not.toContain('16:00')

    wrapper.unmount()
  })

  test('已選擇的候選時段沒有 my_range（例如舊資料）時，摘要 fallback 顯示整個候選時段窗口', async () => {
    const activity = makeScenarioDActivity({
      has_joined: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          is_selected: true,
          my_range: null,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('14:00')
    expect(wrapper.text()).toContain('16:00')

    wrapper.unmount()
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
      global: { plugins: [createTestI18n()] },
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
          segments: [
            {
              id: 'temp-2026-08-01T14:00:00.000Z',
              slot_start: '2026-08-01T14:00:00',
              slot_end: '2026-08-01T15:00:00',
              count: 2,
              is_unanimous: true,
              supporters: [],
            },
            {
              id: 'temp-2026-08-01T15:00:00.000Z',
              slot_start: '2026-08-01T15:00:00',
              slot_end: '2026-08-01T16:00:00',
              count: 1,
              is_unanimous: false,
              supporters: [],
            },
          ],
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T09:00:00',
          slot_end: '2026-08-03T12:00:00',
          count: 1,
          segments: [
            {
              id: 'temp-2026-08-03T09:00:00.000Z',
              slot_start: '2026-08-03T09:00:00',
              slot_end: '2026-08-03T10:00:00',
              count: 1,
              is_unanimous: false,
              supporters: [],
            },
          ],
        },
      ],
      ...overrides,
    })
  }

  test('兩個候選時段各自有自己的 segments 資料時，決策區塊渲染兩組獨立的巢狀清單', async () => {
    const activity = makeScenarioDDecisionActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const text = wrapper.text()
    expect(text).toContain('8/1')
    expect(text).toContain('8/3')
    // 不再有「完全重疊」「部分重疊」分類標題
    expect(text).not.toContain('完全重疊')
    expect(text).not.toContain('部分重疊')

    // slot-a、slot-b 底下各自的窄窗口都要直接顯示完整時間，是重點資訊不需要 hover 才看得到
    expect(text).toContain('15:00')
    expect(text).toContain('10:00')
  })

  test('選定某個候選時段底下的窄窗口並確認時，正確送出 candidateSlotId+slotStart+slotEnd', async () => {
    const activity = makeScenarioDDecisionActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-date').text()).toBe('7/12')
  })

  test('卡片內文的「日期」欄位也顯示 fixed_date，不是「投票中」——range 模式日期本來就是固定的', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    // 標籤本身就改成「時間投票中」，值只留純時間窗文字，不用再重複一次「時間投票中」
    const timeLabel = wrapper
      .findAll('.activity-detail-label')
      .find((l) => l.text() === '時間投票中')
    expect(timeLabel).toBeTruthy()
    expect(timeLabel.element.nextElementSibling.textContent).toBe('10:00–18:00區間')
    expect(wrapper.text()).not.toContain('候選時段投票中')
  })

  test('沒有設定時間窗（整天皆可）時，時間欄位顯示「整天皆可回報」', async () => {
    const activity = makeRangeActivity({ time_window_start: null, time_window_end: null })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('整天皆可回報')
  })

  test('未報名時不顯示可複選候選時段或報名提示文案', async () => {
    const activity = makeRangeActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('點擊「報名參加」選取你方便的時間')
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
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('已報名')
    expect(wrapper.text()).toContain('7/12')
    expect(wrapper.text()).toContain('時間投票中')
    expect(wrapper.text()).toContain('修改時間')
  })

  test('確認彈窗選取後，把回傳結果轉成 {ranges} 呼叫 join API；整天視為當日 00:00–23:59 的單一 range', async () => {
    const activity = makeRangeActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
      global: { plugins: [createTestI18n()] },
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
    decision_candidates: [
      {
        id: 'temp-2026-07-12T10:00:00.000Z',
        slot_start: '2026-07-12T10:00:00Z',
        slot_end: '2026-07-12T12:00:00Z',
        count: 3,
        is_unanimous: true,
        supporters: [],
      },
      {
        id: 'temp-2026-07-12T14:00:00.000Z',
        slot_start: '2026-07-12T14:00:00Z',
        slot_end: '2026-07-12T16:00:00Z',
        count: 2,
        is_unanimous: false,
        supporters: [],
      },
      {
        id: 'temp-2026-07-12T16:00:00.000Z',
        slot_start: '2026-07-12T16:00:00Z',
        slot_end: '2026-07-12T18:00:00Z',
        count: 1,
        is_unanimous: false,
        supporters: [],
      },
    ],
    ...overrides,
  })
}

describe('ActivityDetailModal - availability_mode: range 的決選畫面', () => {
  test('建立者的決選畫面渲染單一排序清單，不再有完全重疊／部分重疊分類', async () => {
    const activity = makeRangeDecisionActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toContain('完全重疊')
    expect(wrapper.text()).not.toContain('部分重疊')

    const radios = wrapper.findAll('input[type="radio"][name="decision-slot"]')
    expect(radios).toHaveLength(3)
  })

  test('建立者選取第三筆候選並確認成團時，呼叫 confirm-formation 帶上 {slotStart, slotEnd}', async () => {
    const activity = makeRangeDecisionActivity()
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const radios = wrapper.findAll('input[type="radio"][name="decision-slot"]')
    // 第三筆：16:00–18:00（count 最低，不會被自動預選，需要手動點選第 3 筆）
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

describe('ActivityDetailModal - 決策項目比例文字（X/Y人）', () => {
  test('分母大於 0 時顯示 X/Y人 比例文字', async () => {
    const activity = makeActivity({
      // 建立者 + 2 個真人參與者，分母 = 3 - 1 = 2
      participants: [
        { id: 'creator-1', display_name: '小明', avatar_url: '' },
        { id: 'p-1', display_name: '小華', avatar_url: '' },
        { id: 'p-2', display_name: '小美', avatar_url: '' },
      ],
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 2,
          supporters: [],
        },
        {
          id: 'slot-b',
          slot_start: '2026-07-11T10:00:00Z',
          slot_end: '2026-07-11T12:00:00Z',
          count: 1,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('2/2人')
    expect(wrapper.text()).toContain('1/2人')
  })

  test('沒有其他真人參與者且尚未有人投票時，不顯示目前票數區與 X/0人', async () => {
    const activity = makeActivity({
      participants: [{ id: 'creator-1', display_name: '小明', avatar_url: '' }],
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 0,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).not.toMatch(/\/0人/)
    expect(wrapper.text()).not.toContain('目前票數')
    expect(wrapper.find('.activity-detail-options').exists()).toBe(false)
  })
})

describe('ActivityDetailModal - 決策清單預設前 3 名 + 顯示更多每次多展開 3 筆', () => {
  function makeSevenEntryActivity() {
    return makeActivity({
      decision_candidates: Array.from({ length: 7 }, (_, i) => ({
        id: `c${i + 1}`,
        slot_start: `2026-07-${10 + i}T10:00:00Z`,
        slot_end: `2026-07-${10 + i}T12:00:00Z`,
        count: 7 - i,
        supporters: [],
      })),
    })
  }

  test('預設只顯示前 3 筆，超過 3 筆時顯示「顯示更多」按鈕', async () => {
    const activity = makeSevenEntryActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.findAll('.activity-detail-option')).toHaveLength(3)
    const moreButton = wrapper.findAll('button').find((b) => b.text().includes('顯示更多'))
    expect(moreButton).toBeTruthy()
  })

  test('點擊「顯示更多」只多展開 3 筆，全部展開後可收合回前 3 筆', async () => {
    const activity = makeSevenEntryActivity()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const moreButton = () => wrapper.findAll('button').find((b) => b.text().includes('顯示更多'))
    const collapseButton = () => wrapper.findAll('button').find((b) => b.text().includes('收合'))
    await moreButton().trigger('click')
    expect(wrapper.findAll('.activity-detail-option')).toHaveLength(6)
    expect(moreButton()).toBeTruthy()

    await moreButton().trigger('click')
    expect(wrapper.findAll('.activity-detail-option')).toHaveLength(7)
    expect(moreButton()).toBeFalsy()
    expect(collapseButton()).toBeTruthy()

    await collapseButton().trigger('click')
    expect(wrapper.findAll('.activity-detail-option')).toHaveLength(3)
    expect(moreButton()).toBeTruthy()
  })

  test('清單 3 筆以下時不顯示「顯示更多」按鈕', async () => {
    const activity = makeActivity({
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 1,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.findAll('button').find((b) => b.text().includes('顯示更多'))).toBeFalsy()
  })
})

describe('ActivityDetailModal - 支持者頭像 hover(桌面)/長按(行動裝置) 顯示名單', () => {
  function makeActivityWithSupporters() {
    return makeActivity({
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 1,
          supporters: [{ user_id: 'p-1', display_name: 'Alice', avatar_url: '' }],
        },
      ],
    })
  }

  test('桌面 mouseenter 顯示名單，mouseleave 隱藏', async () => {
    const activity = makeActivityWithSupporters()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const supporters = wrapper.find('.activity-detail-supporters')
    expect(wrapper.find('.activity-detail-chip-popover').exists()).toBe(false)

    await supporters.trigger('mouseenter')
    expect(wrapper.find('.activity-detail-chip-popover').text()).toContain('Alice')

    await supporters.trigger('mouseleave')
    expect(wrapper.find('.activity-detail-chip-popover').exists()).toBe(false)
  })

  test('行動裝置短按（500ms 內放開）不顯示名單', async () => {
    vi.useFakeTimers()
    const activity = makeActivityWithSupporters()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const supporters = wrapper.find('.activity-detail-supporters')
    await supporters.trigger('touchstart')
    vi.advanceTimersByTime(300)
    await supporters.trigger('touchend')
    vi.advanceTimersByTime(300)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.activity-detail-chip-popover').exists()).toBe(false)
  })

  test('行動裝置長按滿 500ms 顯示名單', async () => {
    vi.useFakeTimers()
    const activity = makeActivityWithSupporters()
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const supporters = wrapper.find('.activity-detail-supporters')
    await supporters.trigger('touchstart')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.activity-detail-chip-popover').text()).toContain('Alice')
  })
})

describe('ActivityDetailModal - Scenario D 決選候選清單不分日期分組，全域攤平排序', () => {
  test('多個候選日期的子時段攤平成單一全域排序，預設只顯示全域前 3 名，顯示更多展開全域接下來的項目', async () => {
    const activity = makeScenarioDActivity({
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T20:00:00',
          count: 6,
          segments: Array.from({ length: 6 }, (_, i) => ({
            id: `a-seg-${i + 1}`,
            slot_start: `2026-08-01T${14 + i}:00:00`,
            slot_end: `2026-08-01T${15 + i}:00:00`,
            count: 6 - i,
            is_unanimous: false,
            supporters: [],
          })),
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T09:00:00',
          slot_end: '2026-08-03T12:00:00',
          count: 0,
          segments: [
            {
              id: 'b-seg-1',
              slot_start: '2026-08-03T09:00:00',
              slot_end: '2026-08-03T10:00:00',
              count: 0,
              is_unanimous: false,
              supporters: [],
            },
          ],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    // 全域票數排名：a-seg-1(6) > a-seg-2(5) > a-seg-3(4) > a-seg-4(3) > a-seg-5(2) > a-seg-6(1) > b-seg-1(0)
    // 預設只顯示全域前 3 名（不分日期），不是「slot-a 前 3 筆 + slot-b 1 筆」這種每組各自顯示
    const optionTexts = wrapper.findAll('.activity-detail-option').map((el) => el.text())
    expect(optionTexts).toHaveLength(3)
    expect(optionTexts[0]).toContain('8/1')
    expect(optionTexts[0]).toContain('14:00')
    expect(optionTexts[1]).toContain('15:00')
    expect(optionTexts[2]).toContain('16:00')

    const moreButton = wrapper.findAll('button').find((b) => b.text().includes('顯示更多'))
    await moreButton.trigger('click')

    // 顯示更多展開的是全域排序接下來的第 4~6 名（a-seg-4/5/6），不是 slot-b 的項目
    const expandedTexts = wrapper.findAll('.activity-detail-option').map((el) => el.text())
    expect(expandedTexts).toHaveLength(6)
    expect(expandedTexts.some((t) => t.includes('8/3'))).toBe(false)
  })
})

describe('ActivityDetailModal - 情境二只有唯一最高票時自動預選', () => {
  test('情境二只有一筆最高票時，自動預選該筆，「提前成團」按鈕直接可用', async () => {
    const activity = makeRangeActivity({
      requires_voting: true,
      is_creator: true,
      status: 'recruiting',
      decision_candidates: [
        {
          id: 'temp-2026-07-12T10:00:00.000Z',
          slot_start: '2026-07-12T10:00:00Z',
          slot_end: '2026-07-12T12:00:00Z',
          count: 3,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('input[type="radio"]').element.checked).toBe(true)
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('提前成團'))
    expect(confirmButton.attributes('disabled')).toBeUndefined()
  })
})

describe('ActivityDetailModal - 情境一（fixed，免投票）已報名人數/頭像可見性', () => {
  test('fixed 情境進入 voting 狀態時建立者可直接立即成團', async () => {
    const activity = makeActivity({
      is_creator: true,
      status: 'voting',
      requires_voting: false,
      schedule_variant: 'fixed',
      current_count: 2,
      participant_target: 2,
      decision_candidates: null,
    })
    const calls = stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('立即成團'))
    expect(confirmButton).toBeTruthy()
    expect(confirmButton.attributes('disabled')).toBeUndefined()

    await confirmButton.trigger('click')
    await flushPromises()

    const confirmCall = calls.find((c) => c.url.includes('/confirm-formation'))
    expect(confirmCall).toBeTruthy()
    expect(confirmCall.options.body).toBeUndefined()
  })

  test('fixed 情境的活動詳情正確顯示已報名人數與參與者頭像', async () => {
    const activity = makeActivity({
      requires_voting: false,
      schedule_variant: 'fixed',
      current_count: 2,
      participants: [
        { id: 'creator-1', display_name: '小明', avatar_url: '' },
        { id: 'p-1', display_name: '小華', avatar_url: '/uploads/avatars/p1.png' },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-count').text()).toContain('2 /')
    expect(wrapper.findAll('.activity-detail-avatars .activity-detail-avatar')).toHaveLength(2)
    expect(wrapper.find('.activity-detail-avatars img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/p1.png',
    )
  })

  test('已報名人數超過 5 人時，用圓形 + 展開與收合參與者頭像', async () => {
    const participants = Array.from({ length: 7 }, (_, index) => ({
      id: `p-${index + 1}`,
      display_name: `P${index + 1}`,
      avatar_url: '',
    }))
    const activity = makeActivity({
      requires_voting: false,
      schedule_variant: 'fixed',
      current_count: 7,
      participants,
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.findAll('.activity-detail-participant-avatar')).toHaveLength(5)
    const toggle = wrapper.find('.activity-detail-avatar-toggle')
    expect(toggle.exists()).toBe(true)
    expect(toggle.text()).toBe('+')
    expect(toggle.attributes('aria-expanded')).toBe('false')

    await toggle.trigger('click')
    expect(wrapper.findAll('.activity-detail-participant-avatar')).toHaveLength(7)
    expect(wrapper.find('.activity-detail-avatar-toggle').attributes('aria-expanded')).toBe('true')

    await wrapper.find('.activity-detail-avatar-toggle').trigger('click')
    expect(wrapper.findAll('.activity-detail-participant-avatar')).toHaveLength(5)
    expect(wrapper.find('.activity-detail-avatar-toggle').attributes('aria-expanded')).toBe('false')
  })

  test('hover 已報名參與者頭像顯示姓名清單', async () => {
    const activity = makeActivity({
      requires_voting: false,
      schedule_variant: 'fixed',
      current_count: 2,
      participants: [
        { id: 'creator-1', display_name: '小明', avatar_url: '' },
        { id: 'p-1', display_name: '小華', avatar_url: '' },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-chip-popover').exists()).toBe(false)
    await wrapper.find('.activity-detail-avatars').trigger('mouseenter')
    expect(wrapper.find('.activity-detail-chip-popover').text()).toContain('小明')
    expect(wrapper.find('.activity-detail-chip-popover').text()).toContain('小華')
    await wrapper.find('.activity-detail-avatars').trigger('mouseleave')
    expect(wrapper.find('.activity-detail-chip-popover').exists()).toBe(false)
  })
})

describe('ActivityDetailModal - 頭像與比例文字維持在同一行（不套用 flex-wrap 換行）', () => {
  test('決策項目右側容器 (avatar + 比例) 不換行', async () => {
    const activity = makeActivity({
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 1,
          supporters: [{ user_id: 'p-1', display_name: 'Alice', avatar_url: '' }],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const right = wrapper.find('.activity-detail-option-right')
    expect(right.exists()).toBe(true)
    expect(right.find('.activity-detail-supporters').exists()).toBe(true)
    expect(right.find('.activity-detail-ratio').exists()).toBe(true)
  })
})

describe('ActivityDetailModal - 狀態徽章文案依角色分流', () => {
  async function mountWithStatus(status, { isCreator, hasJoined }) {
    const activity = makeActivity({
      status,
      is_creator: isCreator,
      has_joined: hasJoined,
      requires_voting: status === 'voting',
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()
    return wrapper
  }

  function statusBadgeText(wrapper) {
    return wrapper.find('.activity-detail-badges .activity-detail-badge').text()
  }

  it('recruiting：建立者看到「揪團中」，已報名非建立者看到「已報名」', async () => {
    const creatorWrapper = await mountWithStatus('recruiting', { isCreator: true, hasJoined: true })
    expect(statusBadgeText(creatorWrapper)).toBe('揪團中')

    const participantWrapper = await mountWithStatus('recruiting', {
      isCreator: false,
      hasJoined: true,
    })
    expect(statusBadgeText(participantWrapper)).toBe('已報名')
  })

  it('voting：建立者看到「建立者決選中」，已報名非建立者看到「已報名」', async () => {
    const creatorWrapper = await mountWithStatus('voting', { isCreator: true, hasJoined: true })
    expect(statusBadgeText(creatorWrapper)).toBe('建立者決選中')

    const participantWrapper = await mountWithStatus('voting', {
      isCreator: false,
      hasJoined: true,
    })
    expect(statusBadgeText(participantWrapper)).toBe('已報名')
  })

  it('confirmed／cancelled 不分角色維持原文字', async () => {
    const confirmedCreator = await mountWithStatus('confirmed', {
      isCreator: true,
      hasJoined: true,
    })
    expect(statusBadgeText(confirmedCreator)).toBe('已成團')
    const confirmedParticipant = await mountWithStatus('confirmed', {
      isCreator: false,
      hasJoined: true,
    })
    expect(statusBadgeText(confirmedParticipant)).toBe('已成團')

    const cancelledCreator = await mountWithStatus('cancelled', {
      isCreator: true,
      hasJoined: true,
    })
    expect(statusBadgeText(cancelledCreator)).toBe('已取消')
    const cancelledParticipant = await mountWithStatus('cancelled', {
      isCreator: false,
      hasJoined: true,
    })
    expect(statusBadgeText(cancelledParticipant)).toBe('已取消')
  })

  it('未報名的非建立者維持原本的狀態文字，不會顯示「已報名」', async () => {
    const wrapper = await mountWithStatus('recruiting', { isCreator: false, hasJoined: false })
    expect(statusBadgeText(wrapper)).toBe('揪團中')
  })
})

describe('ActivityDetailModal - 決選候選清單只渲染給建立者', () => {
  it('非建立者在 voting 狀態下看不到決選候選清單；建立者不受影響', async () => {
    const baseActivity = makeActivity({
      status: 'voting',
      requires_voting: true,
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-07-10T10:00:00Z',
          slot_end: '2026-07-10T12:00:00Z',
          count: 1,
          supporters: [],
        },
      ],
    })

    const participantActivity = {
      ...baseActivity,
      is_creator: false,
      has_joined: true,
      decision_candidates: null,
    }
    stubFetch(participantActivity)
    const participantWrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()
    expect(participantWrapper.find('.activity-detail-option').exists()).toBe(false)
    expect(participantWrapper.text()).not.toContain('目前票數')

    const creatorActivity = { ...baseActivity, is_creator: true, has_joined: true }
    stubFetch(creatorActivity)
    const creatorWrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()
    expect(creatorWrapper.find('.activity-detail-option').exists()).toBe(true)
    expect(creatorWrapper.text()).toContain('目前票數')
  })
})

describe('ActivityDetailModal - 三個唯讀區塊新增 co_participants 頭像列', () => {
  it('情境二「你報名的時段」：co_participants 頭像預設顯示，hover 顯示姓名，空陣列不渲染頭像', async () => {
    const activity = makeRangeActivity({
      is_creator: false,
      has_joined: true,
      status: 'recruiting',
      my_ranges: [
        {
          start: '2026-08-01T18:00:00.000Z',
          end: '2026-08-01T19:00:00.000Z',
          co_participants: [{ user_id: 'p-2', display_name: 'Bob', avatar_url: '' }],
        },
        {
          start: '2026-08-01T20:00:00.000Z',
          end: '2026-08-01T21:00:00.000Z',
          co_participants: [],
        },
      ],
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.text()).toContain('已報名')
    expect(wrapper.text()).toContain('修改時間')
    expect(wrapper.text()).toContain('7/12')
    expect(wrapper.text()).toContain('時間投票中')
  })

  it('情境三「你報名的日期」：co_participants 頭像預設顯示，hover 顯示姓名', async () => {
    const activity = makeScenarioCActivity({
      is_creator: false,
      has_joined: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T19:00:00',
          slot_end: '2026-08-01T21:00:00',
          is_selected: true,
          co_participants: [{ user_id: 'p-2', display_name: 'Carol', avatar_url: '' }],
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T19:00:00',
          slot_end: '2026-08-03T21:00:00',
          is_selected: false,
          co_participants: [],
        },
      ],
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const entries = wrapper.findAll('.activity-detail-selection-entry')
    expect(entries).toHaveLength(1)
    expect(entries[0].find('.activity-detail-avatar').exists()).toBe(true)

    await entries[0].find('.activity-detail-supporters').trigger('mouseenter')
    expect(wrapper.find('.activity-detail-chip-popover').text()).toContain('Carol')
  })

  it('情境四「已報名的時段」：co_participants 頭像預設顯示，長按顯示姓名', async () => {
    vi.useFakeTimers()
    const activity = makeScenarioDActivity({
      is_creator: false,
      has_joined: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-08-01T14:00:00',
          slot_end: '2026-08-01T16:00:00',
          is_selected: true,
          my_range: null,
          co_participants: [{ user_id: 'p-2', display_name: 'Dave', avatar_url: '' }],
        },
      ],
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const entry = wrapper.find('.activity-detail-selection-entry')
    expect(entry.find('.activity-detail-avatar').exists()).toBe(true)

    await entry.find('.activity-detail-supporters').trigger('touchstart')
    vi.advanceTimersByTime(500)
    await wrapper.vm.$nextTick()
    expect(wrapper.find('.activity-detail-chip-popover').text()).toContain('Dave')
  })
})

describe('ActivityDetailModal - actionError 切換活動時重置', () => {
  test('actionError 有值時切換到不同 activityId，重新 fetch 後 actionError 變回空字串', async () => {
    const activity1 = makeActivity({ id: 'act-1' })
    stubFetch(activity1)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    wrapper.vm.actionError = '上一個活動報名失敗的錯誤訊息'
    await flushPromises()
    expect(wrapper.text()).toContain('上一個活動報名失敗的錯誤訊息')

    const activity2 = makeActivity({ id: 'act-2', title: '另一個活動' })
    stubFetch(activity2)
    await wrapper.setProps({ activityId: 'act-2' })
    await flushPromises()

    expect(wrapper.vm.actionError).toBe('')
    expect(wrapper.text()).not.toContain('上一個活動報名失敗的錯誤訊息')
  })

  test('新活動 fetch 完成後，該活動自己觸發的新錯誤仍正常顯示，不受重置影響', async () => {
    const activity = makeActivity({ id: 'act-1' })
    const calls = stubFetch(activity, { confirmOk: false })
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    await wrapper.find('input[type="radio"][value="slot-a"]').setValue(true)
    const confirmButton = wrapper.findAll('button').find((b) => b.text().includes('提前成團'))
    await confirmButton.trigger('click')
    await flushPromises()

    expect(wrapper.vm.actionError).toBe('操作失敗')
    expect(calls.some((c) => c.url.includes('/confirm-formation'))).toBe(true)
  })
})

describe('ActivityDetailModal - 決選候選清單過期項目呈現：維持顯示＋停用樣式＋已過期標籤', () => {
  test('情境三/四：slot_start 早於現在的候選項目維持顯示但停用，未過期項目不受影響', async () => {
    const activity = makeScenarioCActivity({
      is_creator: true,
      status: 'voting',
      candidate_slots: [
        { id: 'slot-a', slot_start: '2026-06-01T19:00:00', slot_end: '2026-06-01T21:00:00' },
        { id: 'slot-b', slot_start: '2026-08-03T19:00:00', slot_end: '2026-08-03T21:00:00' },
      ],
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-06-01T19:00:00',
          slot_end: '2026-06-01T21:00:00',
          count: 2,
          supporters: [],
        },
        {
          id: 'slot-b',
          slot_start: '2026-08-03T19:00:00',
          slot_end: '2026-08-03T21:00:00',
          count: 1,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const options = wrapper.findAll('.activity-detail-option')
    expect(options).toHaveLength(2)

    // slot-a（6/1，已過期，現在是 7/1）：維持顯示、套用停用樣式、顯示已過期標籤、radio 被停用
    expect(options[0].classes()).toContain('activity-detail-option--expired')
    expect(options[0].text()).toContain('已過期')
    expect(options[0].find('input[type="radio"]').attributes('disabled')).toBeDefined()

    // slot-b（8/3，未過期）：不受影響，維持原本互動樣式
    expect(options[1].classes()).not.toContain('activity-detail-option--expired')
    expect(options[1].text()).not.toContain('已過期')
    expect(options[1].find('input[type="radio"]').attributes('disabled')).toBeUndefined()
  })

  test('情境二（range 模式）：decision_candidates 的 segment 一樣用 slot_start 判斷過期', async () => {
    const activity = makeRangeActivity({
      requires_voting: true,
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'temp-2026-06-01T10:00:00.000Z',
          slot_start: '2026-06-01T10:00:00Z',
          slot_end: '2026-06-01T12:00:00Z',
          count: 3,
          is_unanimous: true,
          supporters: [],
        },
        {
          id: 'temp-2026-08-03T10:00:00.000Z',
          slot_start: '2026-08-03T10:00:00Z',
          slot_end: '2026-08-03T12:00:00Z',
          count: 2,
          is_unanimous: false,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const options = wrapper.findAll('.activity-detail-option')
    expect(options).toHaveLength(2)
    expect(options[0].classes()).toContain('activity-detail-option--expired')
    expect(options[0].text()).toContain('已過期')
    expect(options[1].classes()).not.toContain('activity-detail-option--expired')
  })

  test('情境四：巢狀 segments 裡過期的候選時段一樣維持顯示但停用', async () => {
    const activity = makeScenarioDActivity({
      is_creator: true,
      status: 'voting',
      candidate_slots: [
        {
          id: 'slot-a',
          slot_start: '2026-06-01T14:00:00',
          slot_end: '2026-06-01T18:00:00',
        },
      ],
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-06-01T14:00:00',
          slot_end: '2026-06-01T18:00:00',
          count: 1,
          segments: [
            {
              id: '2026-06-01T14:00:00.000Z',
              slot_start: '2026-06-01T14:00:00Z',
              slot_end: '2026-06-01T16:00:00Z',
              count: 1,
              is_unanimous: true,
              supporters: [],
            },
          ],
        },
      ],
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const option = wrapper.find('.activity-detail-option')
    expect(option.classes()).toContain('activity-detail-option--expired')
    expect(option.text()).toContain('已過期')
    expect(option.find('input[type="radio"]').attributes('disabled')).toBeDefined()
  })

  test('情境一：沒有候選時段，過期呈現這條規則不適用', async () => {
    const activity = makeActivity({
      requires_voting: false,
      status: 'recruiting',
      is_creator: true,
      decision_candidates: null,
    })
    stubFetch(activity)
    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    expect(wrapper.find('.activity-detail-option').exists()).toBe(false)
  })
})

// 全域 beforeEach 已把假時鐘固定在 2026-07-01 00:00（本地時區），這裡的候選時段日期
// 都相對這個基準點設計，不需要在個別測試裡再另外設定系統時間
describe('ActivityDetailModal - 決選候選清單同票時，離現在最近的排前面', () => {
  test('情境二（range 模式）：同票時，slot_start 離現在較近的排前面', async () => {
    const activity = makeRangeActivity({
      requires_voting: true,
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'far',
          slot_start: '2026-07-20T10:00:00Z',
          slot_end: '2026-07-20T12:00:00Z',
          count: 2,
          is_unanimous: false,
          supporters: [],
        },
        {
          id: 'near',
          slot_start: '2026-07-03T10:00:00Z',
          slot_end: '2026-07-03T12:00:00Z',
          count: 2,
          is_unanimous: false,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const options = wrapper.findAll('.activity-detail-option')
    expect(options[0].text()).toContain('7/3')
    expect(options[1].text()).toContain('7/20')
  })

  test('情境三（find_date）：同票時，slot_start 離現在較近的排前面', async () => {
    const activity = makeScenarioCActivity({
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'slot-far',
          slot_start: '2026-08-09T19:00:00',
          slot_end: '2026-08-09T21:00:00',
          count: 2,
        },
        {
          id: 'slot-near',
          slot_start: '2026-07-15T19:00:00',
          slot_end: '2026-07-15T21:00:00',
          count: 2,
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const options = wrapper.findAll('.activity-detail-option')
    expect(options[0].text()).toContain('7/15')
    expect(options[1].text()).toContain('8/9')
  })

  test('情境四（find_date_time）：攤平後同票時，slot_start 離現在較近的排前面', async () => {
    const activity = makeScenarioDActivity({
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'slot-a',
          slot_start: '2026-08-09T14:00:00',
          slot_end: '2026-08-09T16:00:00',
          count: 2,
          segments: [
            {
              id: 'a-seg',
              slot_start: '2026-08-09T14:00:00',
              slot_end: '2026-08-09T15:00:00',
              count: 2,
              is_unanimous: false,
              supporters: [],
            },
          ],
        },
        {
          id: 'slot-b',
          slot_start: '2026-07-15T09:00:00',
          slot_end: '2026-07-15T11:00:00',
          count: 2,
          segments: [
            {
              id: 'b-seg',
              slot_start: '2026-07-15T09:00:00',
              slot_end: '2026-07-15T10:00:00',
              count: 2,
              is_unanimous: false,
              supporters: [],
            },
          ],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const options = wrapper.findAll('.activity-detail-option')
    expect(options[0].text()).toContain('7/15')
    expect(options[1].text()).toContain('8/9')
  })

  test('同票裡混著已過期跟未過期的候選項目：離現在最近的排前面，不是單純早到晚（早到晚會誤判排出過期項目）', async () => {
    // 現在是 2026-07-01：expired 在 6/20（過去 11 天）、valid 在 7/3（未來 2 天）
    // 「早到晚」排序會把 expired（日期較早）排最前面，是錯的；「離現在最近」正確答案是 valid 排最前面
    const activity = makeRangeActivity({
      requires_voting: true,
      is_creator: true,
      status: 'voting',
      decision_candidates: [
        {
          id: 'expired',
          slot_start: '2026-06-20T10:00:00Z',
          slot_end: '2026-06-20T12:00:00Z',
          count: 2,
          is_unanimous: false,
          supporters: [],
        },
        {
          id: 'valid',
          slot_start: '2026-07-03T10:00:00Z',
          slot_end: '2026-07-03T12:00:00Z',
          count: 2,
          is_unanimous: false,
          supporters: [],
        },
      ],
    })
    stubFetch(activity)

    const wrapper = mount(ActivityDetailModal, {
      props: { isOpen: true, activityId: 'act-1' },
      global: { plugins: [createTestI18n()] },
    })
    await flushPromises()

    const options = wrapper.findAll('.activity-detail-option')
    expect(options[0].text()).toContain('7/3')
    expect(options[0].classes()).not.toContain('activity-detail-option--expired')
    expect(options[1].text()).toContain('6/20')
    expect(options[1].classes()).toContain('activity-detail-option--expired')
  })
})
