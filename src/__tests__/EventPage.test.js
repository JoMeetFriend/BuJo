import { mount, flushPromises } from '@vue/test-utils'
import { createRouter, createMemoryHistory } from 'vue-router'
import { describe, expect, test, beforeEach, afterEach, vi } from 'vitest'
import EventPage from '@/components/EventPage.vue'

// EventPage 用 <Teleport to="body">，實際 DOM 會掛在 document.body 底下，
// 不在 wrapper 自己的節點內，所以要直接查 document 才找得到內容
function queryBody(selector) {
  return document.body.querySelector(selector)
}

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
  afterEach(() => {
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
