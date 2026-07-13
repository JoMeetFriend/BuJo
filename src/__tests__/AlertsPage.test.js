import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AlertsPage from '@/components/AlertsPage.vue'
import alertsPageSource from '@/components/AlertsPage.vue?raw'
import { useNotificationStore } from '@/stores/notificationStore'

const api = vi.hoisted(() => ({
  get: vi.fn(),
  patch: vi.fn(),
  post: vi.fn(),
}))

vi.mock('axios', () => ({
  default: {
    create: vi.fn(() => api),
  },
}))

const notifications = [
  {
    id: 'notification-1',
    type: 'activity_created',
    category: 'activity',
    message: 'A 建立了新活動',
    timeText: '剛剛',
    isRead: false,
    actions: [],
  },
]

const secondNotification = {
  ...notifications[0],
  id: 'notification-2',
  message: 'B 接受了好友邀請',
  isRead: true,
}

function mountAlerts() {
  const pinia = createPinia()
  setActivePinia(pinia)
  return mount(AlertsPage, {
    global: {
      plugins: [pinia],
      stubs: {
        PixelButton: {
          props: ['disabled'],
          emits: ['click'],
          template: '<button :disabled="disabled" @click="$emit(\'click\')"><slot /></button>',
        },
      },
    },
  })
}

function setRowWidth(row, width = 300) {
  Object.defineProperty(row.element, 'clientWidth', {
    configurable: true,
    value: width,
  })
  row.element.setPointerCapture = vi.fn()
  row.element.releasePointerCapture = vi.fn()
}

async function pointer(row, type, { x, y = 0, pointerId = 1 } = {}) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
    button: 0,
  })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: 'touch' },
  })
  row.element.dispatchEvent(event)
  await nextTick()
}

async function dragLeft(row, { from = 300, to, pointerId = 1 } = {}) {
  setRowWidth(row)
  await pointer(row, 'pointerdown', { x: from, pointerId })
  await pointer(row, 'pointermove', { x: to, pointerId })
  await pointer(row, 'pointerup', { x: to, pointerId })
}

beforeEach(() => {
  vi.clearAllMocks()
  api.get.mockResolvedValue({ data: { notifications } })
  api.patch.mockResolvedValue({ data: { message: 'ok' } })
  api.post.mockResolvedValue({ data: { message: 'ok' } })
})

describe('AlertsPage notification swipe dismissal', () => {
  test('載入通知並提供固定列寬與 Pointer Events 測試基礎', async () => {
    const wrapper = mountAlerts()
    await flushPromises()

    const row = wrapper.get('.alerts-item')
    setRowWidth(row)
    await pointer(row, 'pointerdown', { x: 280 })

    expect(api.get).toHaveBeenCalledWith('/api/notifications')
    expect(row.element.clientWidth).toBe(300)
    expect(wrapper.text()).toContain('A 建立了新活動')
  })

  test('亮紅背景與垃圾桶圓環依 65% 刪除距離同步完成', async () => {
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)
    const affordance = wrapper.get('.alerts-dismiss-affordance')
    const ring = wrapper.get('.alerts-dismiss-progress-ring circle')

    expect(affordance.attributes('style')).toContain('--dismiss-progress: 0')
    expect(ring.attributes('style')).toContain('stroke-dashoffset: 100')

    await pointer(row, 'pointerdown', { x: 300 })
    await pointer(row, 'pointermove', { x: 202.5 })

    expect(row.attributes('style')).toContain('translateX(-97.5px)')
    expect(affordance.attributes('style')).toContain('--dismiss-progress: 0.5')
    expect(ring.attributes('style')).toContain('stroke-dashoffset: 50')
    expect(api.patch).not.toHaveBeenCalled()

    await pointer(row, 'pointermove', { x: 105 })

    expect(affordance.attributes('style')).toContain('--dismiss-progress: 1')
    expect(ring.attributes('style')).toContain('stroke-dashoffset: 0')
    await pointer(row, 'pointerup', { x: 105 })
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/dismiss')
  })

  test('垂直、向右與不足 10px 的手勢不移動通知', async () => {
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 200, y: 0 })
    await pointer(row, 'pointermove', { x: 196, y: 30 })
    expect(row.attributes('style')).toContain('translateX(0px)')

    await pointer(row, 'pointerup', { x: 196, y: 30 })
    await pointer(row, 'pointerdown', { x: 200, y: 0, pointerId: 2 })
    await pointer(row, 'pointermove', { x: 230, y: 0, pointerId: 2 })
    expect(row.attributes('style')).toContain('translateX(0px)')

    await pointer(row, 'pointerup', { x: 230, y: 0, pointerId: 2 })
    await pointer(row, 'pointerdown', { x: 200, y: 0, pointerId: 3 })
    await pointer(row, 'pointermove', { x: 192, y: 0, pointerId: 3 })
    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(api.patch).not.toHaveBeenCalled()
  })

  test('64% 左滑會彈回，65% 左滑才送出一次 dismissal', async () => {
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300 })
    await pointer(row, 'pointermove', { x: 108 })
    await pointer(row, 'pointerup', { x: 108 })
    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(api.patch).not.toHaveBeenCalled()

    await pointer(row, 'pointerdown', { x: 300, pointerId: 2 })
    await pointer(row, 'pointermove', { x: 105, pointerId: 2 })
    await pointer(row, 'pointerup', { x: 105, pointerId: 2 })

    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/dismiss')
  })

  test('快速短滑不會略過 65% 位移門檻', async () => {
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300 })
    await pointer(row, 'pointermove', { x: 250 })
    await pointer(row, 'pointerup', { x: 250 })

    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(api.patch).not.toHaveBeenCalled()
  })

  test('待處理好友邀請不能滑除且接受按鈕保留原功能', async () => {
    const friendRequest = {
      ...notifications[0],
      id: 'friend-request-1',
      type: 'friend_request_created',
      category: 'friend',
      reference: { id: 'friendship-1' },
      actions: ['accept', 'reject'],
    }
    api.get
      .mockResolvedValueOnce({ data: { notifications: [friendRequest] } })
      .mockResolvedValueOnce({
        data: { notifications: [{ ...friendRequest, isRead: true, actions: [] }] },
      })
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300 })
    await pointer(row, 'pointermove', { x: 60 })
    await pointer(row, 'pointerup', { x: 60 })
    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(api.patch).not.toHaveBeenCalledWith('/api/notifications/friend-request-1/dismiss')

    await wrapper.get('.alerts-inline-btn--accept').trigger('click')
    await flushPromises()
    expect(api.post).toHaveBeenCalledWith('/api/friendships/friendship-1/accept')

    const processedRow = wrapper.get('.alerts-item')
    setRowWidth(processedRow)
    await pointer(processedRow, 'pointerdown', { x: 300, pointerId: 2 })
    await pointer(processedRow, 'pointermove', { x: 100, pointerId: 2 })
    await pointer(processedRow, 'pointerup', { x: 100, pointerId: 2 })
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/friend-request-1/dismiss')
  })

  test('dismissal 成功後才移除通知、重算摘要且不寫入 Web Storage', async () => {
    const storageSpy = vi.spyOn(Storage.prototype, 'setItem')
    api.get.mockResolvedValue({ data: { notifications: [notifications[0], secondNotification] } })
    const wrapper = mountAlerts()
    await flushPromises()
    const notificationStore = useNotificationStore()

    expect(wrapper.get('[data-notification-id="notification-1"] .alerts-item').classes()).toContain(
      'alerts-item--unread',
    )
    expect(notificationStore.unreadCount).toBe(1)
    await dragLeft(wrapper.get('[data-notification-id="notification-1"] .alerts-item'), {
      to: 100,
    })

    expect(wrapper.find('[data-notification-id="notification-1"]').exists()).toBe(true)
    expect(wrapper.get('[data-notification-id="notification-1"]').classes()).toContain(
      'alerts-swipe-shell--dismissing',
    )
    await new Promise((resolve) => window.setTimeout(resolve, 230))
    await flushPromises()

    expect(wrapper.find('[data-notification-id="notification-1"]').exists()).toBe(false)
    expect(wrapper.text()).toContain('已全部讀取')
    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/dismiss')
    expect(notificationStore.unreadCount).toBe(0)
    expect(storageSpy).not.toHaveBeenCalled()
  })

  test.each([
    ['404', { response: { status: 404 } }],
    ['500', { response: { status: 500 } }],
    ['timeout', { code: 'ECONNABORTED' }],
    ['network', new Error('Network Error')],
  ])('dismissal %s 失敗會復原原順序、未讀狀態並顯示錯誤', async (_label, failure) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.get.mockResolvedValue({ data: { notifications: [notifications[0], secondNotification] } })
    api.patch.mockRejectedValueOnce(failure)
    const wrapper = mountAlerts()
    await flushPromises()

    await dragLeft(wrapper.get('[data-notification-id="notification-1"] .alerts-item'), {
      to: 100,
    })
    await flushPromises()

    const renderedIds = wrapper
      .findAll('.alerts-swipe-shell')
      .map((row) => row.attributes('data-notification-id'))
    expect(renderedIds).toEqual(['notification-1', 'notification-2'])
    expect(
      wrapper.get('[data-notification-id="notification-1"] .alerts-item').attributes('style'),
    ).toContain('translateX(0px)')
    expect(wrapper.get('[data-notification-id="notification-1"] .alerts-item').classes()).toContain(
      'alerts-item--unread',
    )
    expect(wrapper.text()).toContain('無法移除通知')
  })

  test('dismissal pending 期間不重複送出 dismissal 或已讀 request', async () => {
    let rejectDismissal
    api.patch.mockImplementationOnce(
      () =>
        new Promise((_resolve, reject) => {
          rejectDismissal = reject
        }),
    )
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')

    await dragLeft(row, { to: 100 })
    await dragLeft(row, { to: 50, pointerId: 2 })
    await row.trigger('click')
    expect(api.patch).toHaveBeenCalledTimes(1)

    rejectDismissal(new Error('Network Error'))
    await flushPromises()
    expect(wrapper.text()).toContain('無法移除通知')
  })

  test('未拖曳時保留 click、Enter、Space 與全部已讀操作', async () => {
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')

    await row.trigger('click')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')

    api.get.mockResolvedValue({ data: { notifications } })
    const keyboardWrapper = mountAlerts()
    await flushPromises()
    await keyboardWrapper.get('.alerts-item').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')

    api.get.mockResolvedValue({ data: { notifications } })
    const allReadWrapper = mountAlerts()
    await flushPromises()
    await allReadWrapper
      .findAll('button')
      .find((button) => button.text() === '全部已讀')
      .trigger('click')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/read-all')
  })

  test('水平拖曳後產生的 click 不會額外標記已讀', async () => {
    const wrapper = mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300 })
    await pointer(row, 'pointermove', { x: 240 })
    await pointer(row, 'pointerup', { x: 240 })
    await row.trigger('click')

    expect(api.patch).not.toHaveBeenCalled()
  })

  test('垃圾桶提供可存取名稱且元件包含 reduced-motion 規則', async () => {
    const wrapper = mountAlerts()
    await flushPromises()

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('移除通知')
    expect(alertsPageSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(alertsPageSource).toContain('transition-duration: 1ms')
  })
})
