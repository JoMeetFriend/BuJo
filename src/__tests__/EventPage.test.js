import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import EventPage from '@/components/EventPage.vue'

// EventPage 用 <Teleport to="body">，實際 DOM 會掛在 document.body 底下，
// 不在 wrapper 自己的節點內，所以要直接查 document 才找得到內容
function queryBody(selector) {
  return document.body.querySelector(selector)
}

// 測試中斷言失敗時 wrapper.unmount() 不會被呼叫到，attachTo: document.body 掛上去的 DOM 會殘留、
// 汙染下一個測試（例如 id 選到舊的節點）。每個測試結束後強制清空，確保彼此獨立。
afterEach(() => {
  document.body.innerHTML = ''
})

async function mountEventPage() {
  const router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/', component: { template: '<div />' } },
      { path: '/login', component: { template: '<div>Login</div>' } },
    ],
  })
  await router.push('/')
  await router.isReady()

  return mount(EventPage, {
    props: { isOpen: true },
    global: { plugins: [router] },
    attachTo: document.body,
  })
}

describe('EventPage - 情境一（日期X時間皆已確定）開始日期為今天時不能整日', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 固定在月中，避免月初/月底邊界造成測試不穩定
    vi.setSystemTime(new Date(2026, 6, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('預設開始日期就是今天，整日選項應該隱藏', async () => {
    const wrapper = await mountEventPage()

    expect(queryBody('[aria-label="整日"]')).toBeNull()

    wrapper.unmount()
  })

  test('把開始日期改成未來日期後才會出現整日選項；改回今天後會再次隱藏並取消勾選', async () => {
    const wrapper = await mountEventPage()

    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()

    expect(queryBody('[aria-label="整日"]')).not.toBeNull()

    const allDayCheckbox = queryBody('[aria-label="整日"]')
    allDayCheckbox.checked = true
    allDayCheckbox.dispatchEvent(new Event('change'))
    await flushPromises()
    expect(allDayCheckbox.checked).toBe(true)

    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()

    expect(queryBody('[aria-label="整日"]')).toBeNull()

    wrapper.unmount()
  })
})

function stubActivitiesFetch() {
  const calls = []
  global.fetch = vi.fn((url, options = {}) => {
    calls.push({ url, options })
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ activity: { id: 'act-1' } }),
    })
  })
  return calls
}

function setInputValue(el, value) {
  el.value = value
  el.dispatchEvent(new Event('input'))
}

function clickTimeOption(panelAriaLabel, text) {
  const panel = document.body.querySelector(`[aria-label="${panelAriaLabel}"]`)
  const option = [...panel.querySelectorAll('button')].find((b) => b.textContent.trim() === text)
  option.click()
}

function enterScenario2() {
  // 「日期確定了嗎？已確定」是預設值，不用點；只需要把「時間確定了嗎？」切到「讓大家選」
  const voteButton = [...document.body.querySelectorAll('button')].find(
    (b) => b.textContent.trim() === '讓大家選',
  )
  voteButton.click()
}

describe('EventPage - 情境二（日期X時間讓大家選）表單簡化', () => {
  beforeEach(() => {
    // 固定在早上，跟這些測試裡挑選的時段（上午 9:00／下午 2:00 等）都離「現在」夠遠，
    // 避免不小心落入「距今 ≤ 1 小時」的緊急流程，讓 doSubmitInternal() 的驗證邏輯真的有機會執行到
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 6, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete global.fetch
  })

  test('只填 singleDate、不填時段範圍送出時，payload 不含 timeWindowStart/timeWindowEnd/slots/creatorSlotIndexes', async () => {
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    enterScenario2()
    await flushPromises()

    setInputValue(queryBody('#event-name'), '不設時段的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    const call = calls.find((c) => c.url.includes('/api/activities'))
    expect(call).toBeTruthy()
    const payload = JSON.parse(call.options.body)
    expect(payload).not.toHaveProperty('timeWindowStart')
    expect(payload).not.toHaveProperty('timeWindowEnd')
    expect(payload).not.toHaveProperty('slots')
    expect(payload).not.toHaveProperty('creatorSlotIndexes')

    wrapper.unmount()
  })

  test('只填時段範圍其中一個欄位時顯示驗證錯誤、不送出', async () => {
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    enterScenario2()
    await flushPromises()

    setInputValue(queryBody('#event-name'), '只填一半時段範圍')
    await flushPromises()
    queryBody('#event-time-window-start').click()
    await flushPromises()
    clickTimeOption('時段範圍開始時間選單', '上午 9:00')
    await flushPromises()

    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(document.body.textContent).toContain('時段範圍要嘛都填，要嘛都不填')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })

  test('時段範圍結束時間早於或等於開始時間時顯示驗證錯誤、不送出', async () => {
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    enterScenario2()
    await flushPromises()

    setInputValue(queryBody('#event-name'), '無效時段範圍')
    await flushPromises()
    queryBody('#event-time-window-start').click()
    await flushPromises()
    clickTimeOption('時段範圍開始時間選單', '下午 2:00')
    await flushPromises()

    // hourOptions 沒有 timeWindow 限制時，結束時間下拉本來就會濾掉「不晚於開始」的選項，
    // 直接改寫 script setup 的 reactive 狀態來模擬「結束時間 <= 開始時間」這個不合法狀態
    wrapper.vm.timeWindow.endTime = '上午 10:00'
    await flushPromises()

    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(document.body.textContent).toContain('時段範圍的結束時間要晚於開始時間')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })
})

function getTimeOptionsIn(panelAriaLabel) {
  const panel = document.body.querySelector(`[aria-label="${panelAriaLabel}"]`)
  return [...panel.querySelectorAll('button')].map((b) => b.textContent.trim())
}

describe('EventPage - 情境二/三/四開始時間選單排除今天已過去時段', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('情境二：singleDate 是今天時，時段範圍開始時間選單排除已過去的小時', async () => {
    const wrapper = await mountEventPage()
    enterScenario2()
    await flushPromises()

    queryBody('#event-time-window-start').click()
    await flushPromises()
    const options = getTimeOptionsIn('時段範圍開始時間選單')

    expect(options).not.toContain('上午 9:00')
    expect(options[0]).toBe('上午 10:00')

    wrapper.unmount()
  })

  test('情境三：今天的日期存在於 candidateDates 時，統一開始時間選單排除已過去的小時', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/15', '2026/07/20']
    await flushPromises()

    expect(wrapper.vm.uniformStartTimeOptions.map((t) => t)).not.toContain('上午 9:00')
    expect(wrapper.vm.uniformStartTimeOptions[0]).toBe('上午 10:00')

    wrapper.unmount()
  })

  test('情境三：candidateDates 都不是今天時，統一開始時間選單不受目前時間影響', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20', '2026/07/21']
    await flushPromises()

    expect(wrapper.vm.uniformStartTimeOptions[0]).toBe('上午 12:00')

    wrapper.unmount()
  })

  test('情境四：候選時段自己的日期是今天時，該時段的開始時間選單排除已過去的小時，不受其他候選時段日期影響', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    expect(wrapper.vm.slotStartTimeOptions('2026/07/15')).not.toContain('上午 9:00')
    expect(wrapper.vm.slotStartTimeOptions('2026/07/15')[0]).toBe('上午 10:00')
    expect(wrapper.vm.slotStartTimeOptions('2026/07/20')[0]).toBe('上午 12:00')

    wrapper.unmount()
  })
})

describe('EventPage - 流團預設選項掛載/變更時立即同步', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 15:00 前 45 分鐘
    vi.setSystemTime(new Date(2026, 6, 15, 14, 15))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('選擇距今 45 分鐘的開始時間後，立即自動選中對應的流團預設，不需要額外觸發', async () => {
    const wrapper = await mountEventPage()

    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('30m')

    wrapper.unmount()
  })

  test('錨點時間改變導致原本選中的預設失效時，自動改選新清單中最大的有效預設', async () => {
    const wrapper = await mountEventPage()

    // 先選一個遠在未來的日期＋時間，五個預設都有效，預期預設選中「1 天前」
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('1d')

    // 把日期改回今天，讓原本選中的「1 天前」失效（同一天不可能提前一整天還在未來）
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('30m')

    wrapper.unmount()
  })
})

describe('EventPage - getValidDeadlinePresets：依到活動的提前量回傳可選預設清單', () => {
  const ANCHOR_DATE = '2026/07/15'
  const ANCHOR_TIME = '下午 3:00' // 15:00

  afterEach(() => {
    vi.useRealTimers()
  })

  test.each([
    {
      leadTime: '2 天',
      now: new Date(2026, 6, 13, 15, 0),
      expected: ['1 天前', '12 小時前', '3 小時前', '1 小時前', '30 分鐘前'],
    },
    {
      leadTime: '6 小時',
      now: new Date(2026, 6, 15, 9, 0),
      expected: ['3 小時前', '1 小時前', '30 分鐘前'],
    },
    {
      leadTime: '45 分鐘',
      now: new Date(2026, 6, 15, 14, 15),
      expected: ['30 分鐘前'],
    },
    {
      leadTime: '20 分鐘',
      now: new Date(2026, 6, 15, 14, 40),
      expected: [],
    },
  ])('距離活動 $leadTime 時，可選預設為 $expected', async ({ now, expected }) => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const wrapper = await mountEventPage()

    const presets = wrapper.vm.getValidDeadlinePresets(ANCHOR_DATE, ANCHOR_TIME)

    expect(presets.map((p) => p.label)).toEqual(expected)

    wrapper.unmount()
  })
})

describe('EventPage - 送出前驗證流團時間仍在未來', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete global.fetch
  })

  test('選好預設後、送出前時間已經過去，導致計算出的 deadline 不再晚於現在時，中止送出並顯示錯誤', async () => {
    // 活動訂在 15:00，掛載時是 09:00（距活動 6 小時），比對既有的「6 小時」案例會自動選中最大的有效預設「3 小時前」
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 0))
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    // 15:00 - 3 小時 = 12:00，此刻 09:00 仍在未來
    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('3h')

    // 選好之後過了很久才送出：現在是 13:00，計算出的流團時間 12:00 已經不晚於現在了；
    // 但距離活動開始還有 2 小時，不屬於既有的「距今 ≤ 1 小時」緊急流程，才能單獨驗證這個新的檢查
    vi.setSystemTime(new Date(2026, 6, 15, 13, 0))

    setInputValue(queryBody('#event-name'), '選好時間才送出的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(document.body.textContent).toContain('流團')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })

  test('deadlineISO 無法算出（例如沒有有效預設）時，同樣中止送出並顯示錯誤', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 13, 0))
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 4:00')
    await flushPromises()

    // 模擬「目前沒有任何有效預設」這個邊界狀態
    wrapper.vm.selectedDeadlinePresetKey = null
    await flushPromises()

    setInputValue(queryBody('#event-name'), '無法算出流團時間的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(document.body.textContent).toContain('流團')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })

  test('計算出的 deadline 合法且晚於現在時，仍正常送出（回歸測試）', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 13, 0))
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('1d')

    setInputValue(queryBody('#event-name'), '正常送出的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    const call = calls.find((c) => c.url.includes('/api/activities'))
    expect(call).toBeTruthy()
    const payload = JSON.parse(call.options.body)
    expect(new Date(payload.deadline).getTime()).toBeGreaterThan(Date.now())

    wrapper.unmount()
  })
})
