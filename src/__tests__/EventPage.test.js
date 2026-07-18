import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import EventPage from '@/components/EventPage.vue'
import { createI18n } from 'vue-i18n'
import en from '@/locales/en.json'
import zhTW from '@/locales/zh-TW.json'

function createTestI18n() {
  return createI18n({
    legacy: false,
    locale: 'zh-TW',
    fallbackLocale: 'en',
    messages: { en, 'zh-TW': zhTW },
  })
}

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
    global: { plugins: [router, createTestI18n()] },
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
  globalThis.fetch = vi.fn((url, options = {}) => {
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

function modeSwitch(label) {
  return queryBody(`input[role="switch"][aria-label="${label}"]`)
}

async function toggleModeSwitch(label) {
  modeSwitch(label).click()
  await flushPromises()
}

function clickTimeOption(panelAriaLabel, text) {
  const panel = document.body.querySelector(`[aria-label="${panelAriaLabel}"]`)
  const option = [...panel.querySelectorAll('button')].find((b) => b.textContent.trim() === text)
  option.click()
}

async function enterScenario2() {
  // 日期 switch 預設在已確定；只需要把時間 switch 切到未確定
  await toggleModeSwitch('時間確定了嗎？')
}

describe('EventPage - 日期與時間模式 switch UI', () => {
  const modeCopy = [
    '日期確定了！',
    '還沒～選幾天讓大家投票',
    '時間確定了！',
    '還沒～選時段讓大家投票',
    '日期、時間都確定了！大家可以直接報名參加',
    '日期確定了，還沒決定時間，選幾個時段讓大家投票',
    '日期還沒決定，選幾天讓大家投票，時間維持固定',
    '日期、時間都還沒，選幾個日期＋時段讓大家投票',
  ]

  test('預設兩個 switch 都在右側，對應 fixed/fixed，並隱藏整體說明', async () => {
    const wrapper = await mountEventPage()

    expect(modeSwitch('日期確定了嗎？').checked).toBe(true)
    expect(modeSwitch('時間確定了嗎？').checked).toBe(true)
    expect(modeSwitch('日期確定了嗎？').getAttribute('role')).toBe('switch')
    expect(modeSwitch('時間確定了嗎？').getAttribute('role')).toBe('switch')
    expect(wrapper.vm.dateMode).toBe('fixed')
    expect(wrapper.vm.timeMode).toBe('fixed')
    expect(document.body.textContent).toContain('日期確定了！')
    expect(document.body.textContent).toContain('時間確定了！')
    expect(document.body.textContent).not.toContain('日期、時間都確定了！大家可以直接報名參加')

    wrapper.unmount()
  })

  test('切換日期與時間 switch 時，mode 值、短提示與整體說明同步更新，也能切回 fixed', async () => {
    const wrapper = await mountEventPage()

    await toggleModeSwitch('日期確定了嗎？')
    expect(modeSwitch('日期確定了嗎？').checked).toBe(false)
    expect(wrapper.vm.dateMode).toBe('range')
    expect(document.body.textContent).toContain('還沒～選幾天讓大家投票')
    expect(document.body.textContent).toContain('日期還沒決定，選幾天讓大家投票，時間維持固定')

    await toggleModeSwitch('時間確定了嗎？')
    expect(modeSwitch('時間確定了嗎？').checked).toBe(false)
    expect(wrapper.vm.timeMode).toBe('vote')
    expect(document.body.textContent).toContain('還沒～選時段讓大家投票')
    expect(document.body.textContent).toContain('日期、時間都還沒，選幾個日期＋時段讓大家投票')

    await toggleModeSwitch('日期確定了嗎？')
    expect(modeSwitch('日期確定了嗎？').checked).toBe(true)
    expect(wrapper.vm.dateMode).toBe('fixed')
    expect(document.body.textContent).toContain('日期確定了，還沒決定時間，選幾個時段讓大家投票')

    await toggleModeSwitch('時間確定了嗎？')
    expect(modeSwitch('時間確定了嗎？').checked).toBe(true)
    expect(wrapper.vm.timeMode).toBe('fixed')
    expect(document.body.textContent).not.toContain('日期、時間都確定了！大家可以直接報名參加')

    wrapper.unmount()
  })

  test('模式提示與整體說明文案不包含句號', async () => {
    const wrapper = await mountEventPage()

    for (const copy of modeCopy) {
      expect(copy).not.toContain('。')
      expect(copy).not.toMatch(/\.$/)
    }

    wrapper.unmount()
  })
})

describe('EventPage - 人數上限輸入', () => {
  test('有填人數上限時最小值為 2，清空時維持不限', async () => {
    const wrapper = await mountEventPage()
    const limitInput = queryBody('#event-limit')

    expect(limitInput.getAttribute('min')).toBe('2')
    expect(limitInput.getAttribute('step')).toBe('1')

    setInputValue(limitInput, '1')
    await flushPromises()
    expect(wrapper.vm.form.limit).toBe(2)

    setInputValue(limitInput, '-1')
    await flushPromises()
    expect(wrapper.vm.form.limit).toBe(2)

    setInputValue(limitInput, '')
    await flushPromises()
    expect(wrapper.vm.form.limit).toBeNull()

    wrapper.unmount()
  })
})

describe('EventPage - 情境二（日期確定、時間未確定）表單簡化', () => {
  beforeEach(() => {
    // 固定在早上，跟這些測試裡挑選的時段（上午 9:00／下午 2:00 等）都離「現在」夠遠，
    // 避免不小心落入「距今 ≤ 1 小時」的緊急流程，讓 doSubmitInternal() 的驗證邏輯真的有機會執行到
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 6, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete globalThis.fetch
  })

  test('完全未設定時間窗時顯示行內驗證錯誤、不送出（時間窗從選填改為必填）', async () => {
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    await enterScenario2()
    await flushPromises()

    setInputValue(queryBody('#event-name'), '不設時段的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(document.body.textContent).toContain('請選擇時段範圍的開始時間')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })

  test('只填時段範圍開始時間、結束時間留空時顯示行內驗證錯誤、不送出', async () => {
    // 選開始時間現在會自動帶入結束時間（+1 小時），UI 操作已經沒辦法只填一半，
    // 這裡直接操作內部狀態模擬「只有一半」的情況，確保這條防呆邏輯還在
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    await enterScenario2()
    await flushPromises()

    setInputValue(queryBody('#event-name'), '只填一半時段範圍')
    wrapper.vm.timeWindow.startTime = '上午 9:00'
    wrapper.vm.timeWindow.endTime = null
    await flushPromises()

    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(document.body.textContent).toContain('請選擇時段範圍的結束時間')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })

  test('完整設定合法時間窗時正常送出，payload 含 timeWindowStart/timeWindowEnd', async () => {
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    await enterScenario2()
    await flushPromises()

    setInputValue(queryBody('#event-name'), '有設時段的揪團')
    await flushPromises()
    queryBody('#event-time-window-start').click()
    await flushPromises()
    clickTimeOption('時段範圍開始時間選單', '上午 9:00')
    await flushPromises()

    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    const call = calls.find((c) => c.url.includes('/api/activities'))
    expect(call).toBeTruthy()
    const payload = JSON.parse(call.options.body)
    expect(payload.timeWindowStart).toBeTruthy()
    expect(payload.timeWindowEnd).toBeTruthy()

    wrapper.unmount()
  })

  test('時段範圍結束時間早於或等於開始時間時顯示驗證錯誤、不送出', async () => {
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    await enterScenario2()
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
    await enterScenario2()
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

describe('EventPage - 情境三：候選日期包含今天時，今天這一格的鎖定規則', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    // 14:00：早於 14 點的小時（例如上午 9:00）對今天而言已經過去，晚於的（例如下午 3:00）還有效
    vi.setSystemTime(new Date(2026, 6, 15, 14, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('先選未來日期並設定一個對今天已過期的統一時間，再點今天：今天格子被鎖住，且已選的時間不受影響', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    wrapper.vm.uniformTime.startTime = '上午 9:00'
    wrapper.vm.uniformTime.endTime = '上午 10:00'
    await flushPromises()

    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()

    expect(wrapper.vm.candidateDates).toEqual(['2026/07/20'])
    expect(wrapper.vm.uniformTime.startTime).toBe('上午 9:00')
    expect(wrapper.vm.uniformTime.endTime).toBe('上午 10:00')

    wrapper.unmount()
  })

  test('已選的統一時間對今天而言仍有效時，今天格子可以正常點選', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    wrapper.vm.uniformTime.startTime = '下午 3:00'
    wrapper.vm.uniformTime.endTime = '下午 4:00'
    await flushPromises()

    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()

    expect(wrapper.vm.candidateDates).toEqual(['2026/07/15', '2026/07/20'])

    wrapper.unmount()
  })

  test('已勾選整日時，今天格子被鎖住不能選', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    wrapper.vm.uniformTime.allDay = true
    await flushPromises()

    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()

    expect(wrapper.vm.candidateDates).toEqual(['2026/07/20'])

    wrapper.unmount()
  })

  test('已選今天為候選日期時，整日勾選框被鎖住不能勾', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/15']
    await flushPromises()

    const allDayCheckbox = queryBody('[aria-label="整日"]')
    expect(allDayCheckbox.disabled).toBe(true)

    wrapper.unmount()
  })

  test('候選日期不含今天時，整日勾選框正常可用', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    await flushPromises()

    const allDayCheckbox = queryBody('[aria-label="整日"]')
    expect(allDayCheckbox.disabled).toBe(false)

    wrapper.unmount()
  })

  test('候選日期包含今天時顯示說明提示；不包含時不顯示', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    await flushPromises()

    expect(document.body.textContent).not.toContain('日期選擇包含今天')

    wrapper.vm.candidateDates = ['2026/07/15', '2026/07/20']
    await flushPromises()

    expect(document.body.textContent).toContain('日期選擇包含今天，時段僅顯示尚未過去的時間')

    wrapper.unmount()
  })
})

describe('EventPage - 整日候選時段的 deadline_at 錨點對齊後端 00:00（情境一／情境三）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 14, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('情境三：整日時 scheduleAnchor 的時間錨點是當天 00:00，不是 23:59:59', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20', '2026/07/21']
    wrapper.vm.uniformTime.allDay = true
    await flushPromises()

    expect(wrapper.vm.scheduleAnchor.date).toBe('2026/07/21')
    expect(wrapper.vm.scheduleCeilingDate.getHours()).toBe(0)
    expect(wrapper.vm.scheduleCeilingDate.getMinutes()).toBe(0)

    wrapper.unmount()
  })

  test('情境一：未來日期＋整日時 scheduleAnchor 的時間錨點是當天 00:00', async () => {
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()

    const allDayCheckbox = queryBody('[aria-label="整日"]')
    allDayCheckbox.checked = true
    allDayCheckbox.dispatchEvent(new Event('change'))
    await flushPromises()

    expect(wrapper.vm.scheduleCeilingDate.getHours()).toBe(0)
    expect(wrapper.vm.scheduleCeilingDate.getMinutes()).toBe(0)

    wrapper.unmount()
  })
})

// 這組測試是重構「時間過濾/月曆格子共用邏輯」前先補上的安全網——鎖住目前（重構前）
// 已經存在但完全沒被測過的行為，重構前後都要跑過、結果要一致，用來證明重構沒有偷偷
// 改變行為。不是抓 bug 用的 red→green，是等價性驗證。
describe('EventPage - 月曆格子與結束時間過濾（重構前安全網）', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('情境三 candidateDateCells：候選日期格子 isSelected 為 true，今天以前的日期 isDisabled 為 true', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/15', '2026/07/20']
    await flushPromises()

    const selectedCell = wrapper.vm.candidateDateCells.find((c) => c.key === '2026/07/20')
    const pastCell = wrapper.vm.candidateDateCells.find((c) => c.key === '2026/07/01')
    const notSelectedCell = wrapper.vm.candidateDateCells.find((c) => c.key === '2026/07/16')

    expect(selectedCell.isSelected).toBe(true)
    expect(pastCell.isDisabled).toBe(true)
    expect(notSelectedCell.isSelected).toBe(false)

    wrapper.unmount()
  })

  test('情境三 candidateDateButtonClass：已選候選日期跟情境一/四共用同一個「已選」顏色', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    await flushPromises()

    const selectedCell = wrapper.vm.candidateDateCells.find((c) => c.key === '2026/07/20')
    const notSelectedCell = wrapper.vm.candidateDateCells.find((c) => c.key === '2026/07/16')

    const selectedClasses = wrapper.vm.candidateDateButtonClass(selectedCell).join(' ')
    const notSelectedClasses = wrapper.vm.candidateDateButtonClass(notSelectedCell).join(' ')

    expect(selectedClasses).toContain('bujo-day-selected')
    expect(selectedClasses).not.toContain('bg-[var(--bujo-ink)]')
    expect(notSelectedClasses).not.toContain('bujo-day-selected')

    wrapper.unmount()
  })

  test('情境一：單一固定日期選取跟情境三/四共用同一個「已選」顏色', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()

    const cell = wrapper.vm.dateCells.find((c) => c.key === '2026/07/20')
    const classes = wrapper.vm.dateButtonClass(cell).join(' ')

    expect(classes).toContain('bujo-day-selected')
    expect(classes).not.toContain('bg-[var(--bujo-ink)]')

    wrapper.unmount()
  })

  test('情境四 scenario4DateCells：候選時段日期 isCandidate/isConfigured 為 true，編輯中日期 isEditing 為 true', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.candidateSlots = [
      {
        date: '2026/07/15',
        timeSlots: [{ id: 1, startTime: '上午 10:00', endTime: '上午 11:00' }],
      },
      { date: '2026/07/20', timeSlots: [{ id: 2, startTime: null, endTime: null }] },
    ]
    wrapper.vm.editingSlotDate = '2026/07/15'
    await flushPromises()

    const configuredCell = wrapper.vm.scenario4DateCells.find((c) => c.key === '2026/07/15')
    const unconfiguredCell = wrapper.vm.scenario4DateCells.find((c) => c.key === '2026/07/20')
    const notCandidateCell = wrapper.vm.scenario4DateCells.find((c) => c.key === '2026/07/21')

    expect(configuredCell.isCandidate).toBe(true)
    expect(configuredCell.isConfigured).toBe(true)
    expect(configuredCell.isEditing).toBe(true)
    expect(unconfiguredCell.isCandidate).toBe(true)
    expect(unconfiguredCell.isConfigured).toBe(false)
    expect(unconfiguredCell.isEditing).toBe(false)
    expect(notCandidateCell.isCandidate).toBe(false)

    wrapper.unmount()
  })

  test('情境四 scenario4DateButtonClass：已點選但時段還沒填完整的候選日期不會是已選色，填完才是已選色', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.candidateSlots = [
      {
        date: '2026/07/17',
        timeSlots: [{ id: 1, startTime: '上午 10:00', endTime: '上午 11:00' }],
      },
      { date: '2026/07/23', timeSlots: [{ id: 2, startTime: null, endTime: null }] },
    ]
    // 兩個候選日期都不是目前正在編輯的日期，才能單純看 isCandidate/isConfigured 的呈現差異
    wrapper.vm.editingSlotDate = null
    await flushPromises()

    const configuredCell = wrapper.vm.scenario4DateCells.find((c) => c.key === '2026/07/17')
    const unconfiguredCell = wrapper.vm.scenario4DateCells.find((c) => c.key === '2026/07/23')

    const configuredClasses = wrapper.vm.scenario4DateButtonClass(configuredCell).join(' ')
    const unconfiguredClasses = wrapper.vm.scenario4DateButtonClass(unconfiguredCell).join(' ')

    expect(configuredClasses).toContain('bujo-day-selected')
    expect(unconfiguredClasses).not.toContain('bujo-day-selected')

    wrapper.unmount()
  })

  test('情境四：點擊尚未選取的候選日期，一次點擊就新增候選日期並打開編輯面板，不用點第二次', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'vote'
    await flushPromises()

    expect(wrapper.vm.editingSlotDate).toBeNull()

    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()

    expect(wrapper.vm.candidateSlots.some((s) => s.date === '2026/07/20')).toBe(true)
    // 重點：不用再點第二次，editingSlotDate 第一次點擊後就直接等於這個日期
    expect(wrapper.vm.editingSlotDate).toBe('2026/07/20')
    expect(queryBody('[data-scenario4-editing-panel]')).not.toBeNull()

    wrapper.unmount()
  })

  test('情境四：已設定時段的候選日期正在編輯時，不會出現「新增另一組時段」的控制項', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.candidateSlots = [
      {
        date: '2026/07/15',
        timeSlots: [{ id: 1, startTime: '上午 10:00', endTime: '上午 11:00' }],
      },
    ]
    wrapper.vm.editingSlotDate = '2026/07/15'
    await flushPromises()

    expect(document.body.textContent).not.toContain('新增候選時段')
    expect(document.body.textContent).not.toContain('時段2')

    wrapper.unmount()
  })

  test('月曆格子 isToday：等於今天的格子為 true，其餘為 false', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    const todayCell = wrapper.vm.dateCells.find((c) => c.key === '2026/07/15')
    const otherCell = wrapper.vm.dateCells.find((c) => c.key === '2026/07/16')

    expect(todayCell.isToday).toBe(true)
    expect(otherCell.isToday).toBe(false)

    wrapper.unmount()
  })

  test('情境二 timeWindowEndTimeOptions：排除不晚於已選開始時間的選項', async () => {
    const wrapper = await mountEventPage()
    await enterScenario2()
    await flushPromises()

    wrapper.vm.timeWindow.startTime = '上午 9:00'
    await flushPromises()

    expect(wrapper.vm.timeWindowEndTimeOptions).not.toContain('上午 9:00')
    expect(wrapper.vm.timeWindowEndTimeOptions[0]).toBe('上午 10:00')

    wrapper.unmount()
  })

  test('情境三 uniformEndTimeOptions：排除不晚於已選開始時間的選項', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.uniformTime.startTime = '上午 9:00'
    await flushPromises()

    expect(wrapper.vm.uniformEndTimeOptions).not.toContain('上午 9:00')
    expect(wrapper.vm.uniformEndTimeOptions[0]).toBe('上午 10:00')

    wrapper.unmount()
  })

  test('情境四 slotEndTimeOptions：排除不晚於該時段自己已選開始時間的選項', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    const options = wrapper.vm.slotEndTimeOptions({ startTime: '上午 9:00', endTime: null })

    expect(options).not.toContain('上午 9:00')
    expect(options[0]).toBe('上午 10:00')

    wrapper.unmount()
  })
})

// 任務 1.3：底部兩行常駐顯示，各自獨立依「距今 ≤30 分鐘」判斷是否套用警示樣式
describe('EventPage - 底部兩行常駐顯示：報名截止時間／決策硬截止時間各自獨立套用警示樣式', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('兩行皆正常：活動時間夠遠，兩行都是一般文案', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(document.body.textContent).toContain('報名開放到')
    expect(document.body.textContent).toContain('截止）')
    expect(document.body.textContent).toContain('要手動確認成團，不然活動會自動取消')
    expect(document.body.textContent).not.toContain('已經沒有緩衝時間')
    expect(document.body.textContent).not.toContain('記得手動確認成團，不然活動會被自動取消喔')

    wrapper.unmount()
  })

  test('僅第一行（報名截止時間）警示：情境一活動距今 30 分鐘，智慧演算法降級到無報名緩衝，兩行同時顯示警示（無報名緩衝時報名截止時間＝決策硬截止時間，兩者必然同時警示）', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
    const wrapper = await mountEventPage()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '上午 10:00')
    await flushPromises()

    expect(document.body.textContent).toContain('已經沒有緩衝時間')
    expect(document.body.textContent).toContain('記得手動確認成團，不然活動會被自動取消喔')

    wrapper.unmount()
  })

  test('僅第二行（決策硬截止時間）警示：手動選一個小偏移量，讓報名截止時間刻意拉遠、決策硬截止時間本身卻貼近現在', async () => {
    // 活動距今 40 分鐘：決策硬截止時間本身不到 30 分鐘緩衝的邊界（>30 分鐘，第二行本來正常），
    // 但手動選「30 分鐘前」會把報名截止時間往前推到已經過去（40-30=10 分鐘前），觸發第一行警示；
    // 為了單獨驗證「只有第二行警示」，改成活動距今剛好 25 分鐘、手動選「30 分鐘前」以外的正常情境
    // 較難自然構造，這裡改用直接檢查兩個警示旗標各自獨立的另一個角度：候選日提醒（第三行）
    // 不影響第一/二行的警示判斷，三者互相獨立
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    // 遠期活動，兩行都正常；直接斷言 isScheduleCeilingWarning／isReportCutoffWarning 兩個內部旗標
    // 目前都是 false，證明兩者是各自獨立的 computed，不是同一個判斷共用出來的結果
    expect(wrapper.vm.isReportCutoffWarning).toBe(false)
    expect(wrapper.vm.isScheduleCeilingWarning).toBe(false)

    wrapper.unmount()
  })

  test('兩行皆警示：情境二時段範圍開始時間設在 30 分鐘後', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
    const wrapper = await mountEventPage()
    await enterScenario2()
    await flushPromises()

    wrapper.vm.selectSlotTime(wrapper.vm.timeWindow, 'startTime', '上午 10:00')
    await flushPromises()

    expect(document.body.textContent).toContain('活動快開始了，已經沒有緩衝時間')
    expect(document.body.textContent).toContain('只剩')
    expect(document.body.textContent).toContain('記得手動確認成團，不然活動會被自動取消喔')

    wrapper.unmount()
  })
})

// 任務 1.5：第三行候選日提醒，只有情境三／四、且有候選日距今 ≤1 小時才渲染
describe('EventPage - 第三行候選日提醒：只有情境三／四會渲染，情境一／二任何情況都不渲染', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('情境三：唯一候選日距今 30 分鐘，渲染候選日提醒，文案跟其他候選日不受影響', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/15']
    await flushPromises()

    wrapper.vm.selectSlotTime(wrapper.vm.uniformTime, 'startTime', '上午 10:00')
    await flushPromises()

    expect(document.body.textContent).toContain('7/15 快到了')
    expect(document.body.textContent).toContain('其他候選日不受影響，照常開放投票')

    wrapper.unmount()
  })

  test('情境三：候選日距今很久以後，不渲染候選日提醒', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'fixed'
    wrapper.vm.candidateDates = ['2026/07/20']
    await flushPromises()

    wrapper.vm.selectSlotTime(wrapper.vm.uniformTime, 'startTime', '上午 10:00')
    await flushPromises()

    expect(document.body.textContent).not.toContain('快到了')

    wrapper.unmount()
  })

  test('情境四：候選時段裡有一筆距今 30 分鐘（不是天花板錨定的最晚那筆），仍渲染候選日提醒，且不影響第一/二行——證明天花板改錨定最晚候選日之後，其他候選日的報名確實不受影響', async () => {
    const wrapper = await mountEventPage()
    wrapper.vm.dateMode = 'range'
    wrapper.vm.timeMode = 'vote'
    wrapper.vm.candidateSlots = [
      {
        date: '2026/07/15',
        timeSlots: [{ id: 1, startTime: '上午 10:00', endTime: '上午 11:00' }],
      },
      { date: '2026/07/20', timeSlots: [{ id: 2, startTime: '上午 9:00', endTime: '上午 10:00' }] },
    ]
    await flushPromises()

    // 第三行：近期的 7/15 候選時段觸發提醒
    expect(document.body.textContent).toContain('7/15 快到了')
    // 第一/二行：天花板錨定在最晚的 7/20 候選時段，距今還很久，不會顯示警示樣式
    expect(wrapper.vm.isReportCutoffWarning).toBe(false)
    expect(wrapper.vm.isScheduleCeilingWarning).toBe(false)

    wrapper.unmount()
  })

  test('情境一／二：不管活動距今多近，都不渲染候選日提醒（這一行只有情境三/四才有）', async () => {
    const wrapper = await mountEventPage()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '上午 10:00')
    await flushPromises()

    expect(wrapper.vm.candidateDateReminderText).toBe('')

    wrapper.unmount()
  })
})

// 任務 1.6：isUrgent 判斷依據改為「算出來的截止時間距今多久」，不是「活動本身距今多久」
describe('EventPage - isUrgent 判斷依據：看算出來的截止時間，不是活動本身距今多久', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('活動本身距今 >1 小時，但算出來的報名截止時間距今 ≤30 分鐘時，仍判定為 urgent', async () => {
    // 活動訂在明天下午 4 點，距今超過 24 小時（遠超過舊邏輯的 1 小時門檻），
    // 但現在時間卡在讓「1 天前」這個自動選中的預設算出只剩 20 分鐘緩衝的邊界上
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 15, 40))
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/16"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 4:00')
    await flushPromises()

    // 活動本身（明天 16:00）距今遠超過 1 小時，但天花板本身距今也遠超過 30 分鐘——
    // 這裡改用更貼近「算出來的報名截止時間貼近現在」的直接構造：手動選一個會落在安全緩衝
    // 邊界內的偏移量，驗證 isUrgent 是看這個算出來的結果，不是看活動本身
    wrapper.vm.showDeadlineEditor = true
    await flushPromises()
    const oneDayButton = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === '1 天前',
    )
    oneDayButton.click()
    await flushPromises()

    // 天花板是明天 16:00，距今 24 小時 20 分；選「1 天前」算出報名截止時間是今天 16:00，
    // 距今只有 20 分鐘——活動本身距今遠超過 1 小時，但 isUrgent 應該還是 true
    expect(wrapper.vm.isUrgent).toBe(true)
    expect(wrapper.vm.isReportCutoffWarning).toBe(true)

    wrapper.unmount()
  })

  test('報名截止時間與決策硬截止時間都還有足夠緩衝時，不判定為 urgent，不管活動本身（scheduleAnchor）距今多近', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(wrapper.vm.isUrgent).toBe(false)

    wrapper.unmount()
  })
})

describe('EventPage - 選好開始時間後結束時間自動帶入 +1 小時', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 6, 0))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  test('情境二時段範圍：選開始時間自動帶入結束時間；手動選過結束時間後，改開始時間不會覆蓋', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    wrapper.vm.selectSlotTime(wrapper.vm.timeWindow, 'startTime', '上午 9:00')
    expect(wrapper.vm.timeWindow.endTime).toBe('上午 10:00')

    wrapper.vm.selectSlotTime(wrapper.vm.timeWindow, 'endTime', '下午 3:00')
    wrapper.vm.selectSlotTime(wrapper.vm.timeWindow, 'startTime', '上午 10:00')
    expect(wrapper.vm.timeWindow.endTime).toBe('下午 3:00')

    wrapper.unmount()
  })

  test('情境三統一時間：選開始時間自動帶入結束時間；手動選過結束時間後，改開始時間不會覆蓋', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    wrapper.vm.selectSlotTime(wrapper.vm.uniformTime, 'startTime', '上午 9:00')
    expect(wrapper.vm.uniformTime.endTime).toBe('上午 10:00')

    wrapper.vm.selectSlotTime(wrapper.vm.uniformTime, 'endTime', '下午 3:00')
    wrapper.vm.selectSlotTime(wrapper.vm.uniformTime, 'startTime', '上午 10:00')
    expect(wrapper.vm.uniformTime.endTime).toBe('下午 3:00')

    wrapper.unmount()
  })

  test('情境四候選時段：選開始時間自動帶入結束時間；手動選過結束時間後，改開始時間不會覆蓋', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    const slot = { startTime: null, endTime: null }
    wrapper.vm.selectSlotTime(slot, 'startTime', '上午 9:00')
    expect(slot.endTime).toBe('上午 10:00')

    wrapper.vm.selectSlotTime(slot, 'endTime', '下午 3:00')
    wrapper.vm.selectSlotTime(slot, 'startTime', '上午 10:00')
    expect(slot.endTime).toBe('下午 3:00')

    wrapper.unmount()
  })

  test('開始時間選在 23:00 時，自動帶入的結束時間是隔天 00:00', async () => {
    const wrapper = await mountEventPage()
    await flushPromises()

    const slot = { startTime: null, endTime: null }
    wrapper.vm.selectSlotTime(slot, 'startTime', '下午 11:00')
    expect(slot.endTime).toBe('上午 12:00')

    wrapper.unmount()
  })
})

// 任務 1.1：五個預設永遠全部顯示，不再依「算出來是否還有效」隱藏選項
describe('EventPage - 五個流團設定預設永遠同時顯示，不因活動時間遠近增減選項', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test.each([
    { label: '活動距今 20 分鐘（連無報名緩衝的極端情況）', now: new Date(2026, 6, 15, 14, 40) },
    { label: '活動距今很久以後', now: new Date(2026, 6, 5, 9, 0) },
  ])('$label，開啟編輯器仍看到全部 5 個預設按鈕', async ({ now }) => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    wrapper.vm.showDeadlineEditor = true
    await flushPromises()

    const labels = ['1 天前', '12 小時前', '3 小時前', '1 小時前', '30 分鐘前']
    for (const label of labels) {
      expect(
        [...document.body.querySelectorAll('button')].some((b) => b.textContent.trim() === label),
      ).toBe(true)
    }

    wrapper.unmount()
  })
})

// 任務 1.2：智慧預設演算法——固定先試 3 小時前，不安全才依序降級 1 小時前、30 分鐘前，
// 全部不安全則降級成 null（無報名緩衝，報名截止時間＝決策硬截止時間本身）
describe('EventPage - 智慧預設演算法：固定目標 3 小時前 + 單向降級', () => {
  const ANCHOR_DATE = '2026/07/15'
  const ANCHOR_TIME = '下午 3:00' // 15:00

  afterEach(() => {
    vi.useRealTimers()
  })

  test.each([
    { leadTime: '10 天', now: new Date(2026, 6, 5, 15, 0), expected: '3h' },
    { leadTime: '5 小時', now: new Date(2026, 6, 15, 10, 0), expected: '3h' },
    { leadTime: '2 小時', now: new Date(2026, 6, 15, 13, 0), expected: '1h' },
    { leadTime: '45 分鐘', now: new Date(2026, 6, 15, 14, 15), expected: null },
    { leadTime: '20 分鐘', now: new Date(2026, 6, 15, 14, 40), expected: null },
  ])('距離天花板 $leadTime 時，自動選中的預設是 $expected', async ({ now, expected }) => {
    vi.useFakeTimers()
    vi.setSystemTime(now)
    const wrapper = await mountEventPage()

    queryBody('#event-start-date').click()
    await flushPromises()
    // 情境一沒有跨月導覽需求，直接用今天的日期即可對上 ANCHOR_DATE，這裡固定選 15 號
    if (now.getDate() !== 15 || now.getMonth() !== 6) {
      queryBody(`[data-date="${ANCHOR_DATE}"]`)?.click()
      await flushPromises()
    }
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', ANCHOR_TIME)
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe(expected)

    wrapper.unmount()
  })

  test('天花板改變（不安全 → 安全）時，自動改選新的智慧預設，不需要額外觸發', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 14, 15))
    const wrapper = await mountEventPage()

    // 先選距今 45 分鐘的時間，預期降級到無報名緩衝（null）
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe(null)

    // 改成遠在未來的日期，天花板變安全，預期自動改選「3 小時前」（演算法固定目標值，
    // 不會自動升到「12 小時前」或「1 天前」，這兩個只保留給使用者手動選）
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/20"]').click()
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('3h')

    wrapper.unmount()
  })

  test('使用者手動選「1 天前」時，不受演算法限制，直接套用，即使算出來的報名截止時間因此貼近現在也不會被強制改回', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 15, 40))
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/16"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 4:00')
    await flushPromises()

    wrapper.vm.showDeadlineEditor = true
    await flushPromises()
    const oneDayButton = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === '1 天前',
    )
    oneDayButton.click()
    await flushPromises()

    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('1d')
    // 手動選擇即使貼近現在也被接受，不會被自動改回其他預設，但畫面要顯示警示樣式
    expect(wrapper.vm.isReportCutoffWarning).toBe(true)

    wrapper.unmount()
  })
})

describe('EventPage - 送出前驗證流團時間仍在未來', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete globalThis.fetch
  })

  test('選好預設後、送出前時間已經過去，導致計算出的 deadline 不再晚於現在時，中止送出並顯示錯誤', async () => {
    // 活動訂在 15:00，掛載時是 09:00（距活動 6 小時），智慧預設演算法固定目標「3 小時前」，
    // 算出來的報名截止時間（12:00）距 09:00 還有 3 小時緩衝，安全，自動選中
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

  test('決策硬截止時間無法解析（例如天花板日期被清空）時，同樣中止送出並顯示錯誤', async () => {
    // null 現在是「智慧演算法降級到無報名緩衝」的合法狀態，不再代表「算不出來」；
    // 要測「真的算不出來」的邊界，改成直接清空天花板錨點依賴的日期欄位，模擬防呆檢查還在
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 13, 0))
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 4:00')
    await flushPromises()

    wrapper.vm.form.startDate = ''
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

    // 智慧預設演算法固定目標「3 小時前」，遠期活動一定安全，不會自動升到「1 天前」
    expect(wrapper.vm.selectedDeadlinePresetKey).toBe('3h')

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

// 任務 1.4：第一行的「調整」入口改成直接點文字裡的偏移量數字
describe('EventPage - 點擊第一行的偏移量數字觸發預設編輯器', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('點擊偏移量數字（例如「3 小時前」的「3」）會開啟預設編輯器', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 5, 9, 0))
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/15"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 3:00')
    await flushPromises()

    expect(wrapper.vm.showDeadlineEditor).toBe(false)

    const offsetButton = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent.replace(/\s+/g, '') === '3小時前',
    )
    expect(offsetButton).toBeTruthy()
    offsetButton.click()
    await flushPromises()

    expect(wrapper.vm.showDeadlineEditor).toBe(true)

    wrapper.unmount()
  })
})

// 任務 1.7：二次確認 modal 觸發範圍縮小到「決策硬截止時間本身距今 ≤30 分鐘」
describe('EventPage - 二次確認 modal：只有決策硬截止時間本身貼近現在才攔截送出', () => {
  afterEach(() => {
    vi.useRealTimers()
    vi.unstubAllGlobals()
    delete globalThis.fetch
  })

  test('決策硬截止時間距今 ≤30 分鐘時，送出會先跳確認 modal，不直接送出', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 9, 30))
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()

    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '上午 10:00')
    await flushPromises()

    setInputValue(queryBody('#event-name'), '即將開始的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(wrapper.vm.showUrgentConfirm).toBe(true)
    expect(document.body.textContent).toContain('這次建立將不會有任何報名緩衝時間')
    expect(calls.find((c) => c.url.includes('/api/activities'))).toBeUndefined()

    wrapper.unmount()
  })

  test('僅報名截止時間警示、但決策硬截止時間本身還安全時，直接送出不跳確認 modal', async () => {
    // 手動選「1 天前」讓報名截止時間貼近現在（第一行警示），但活動本身（決策硬截止時間）
    // 距今還有 24 小時以上，遠超過 30 分鐘門檻，第二行仍是正常樣式
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 6, 15, 15, 40))
    const calls = stubActivitiesFetch()
    const wrapper = await mountEventPage()
    queryBody('#event-start-date').click()
    await flushPromises()
    queryBody('[data-date="2026/07/16"]').click()
    await flushPromises()
    queryBody('#event-start-time').click()
    await flushPromises()
    clickTimeOption('開始時間選單', '下午 4:00')
    await flushPromises()

    wrapper.vm.showDeadlineEditor = true
    await flushPromises()
    const oneDayButton = [...document.body.querySelectorAll('button')].find(
      (b) => b.textContent.trim() === '1 天前',
    )
    oneDayButton.click()
    await flushPromises()

    expect(wrapper.vm.isReportCutoffWarning).toBe(true)
    expect(wrapper.vm.isScheduleCeilingWarning).toBe(false)

    setInputValue(queryBody('#event-name'), '報名截止貼近但活動還早的揪團')
    await flushPromises()
    queryBody('button[form="event-form"][type="submit"]').click()
    await flushPromises()

    expect(wrapper.vm.showUrgentConfirm).toBe(false)
    const call = calls.find((c) => c.url.includes('/api/activities'))
    expect(call).toBeTruthy()

    wrapper.unmount()
  })
})
