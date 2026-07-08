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
