import { flushPromises, mount } from '@vue/test-utils'
import { createPinia, setActivePinia } from 'pinia'
import { nextTick } from 'vue'
import { createMemoryHistory, createRouter } from 'vue-router'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import AlertsPage from '@/components/AlertsPage.vue'
import alertsPageSource from '@/components/AlertsPage.vue?raw'
import { useNotificationStore } from '@/stores/notificationStore'
import { createTestI18n } from './testUtils'

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

let router
let notificationStoreRef

async function mountAlerts() {
  const pinia = createPinia()
  setActivePinia(pinia)
  // 須在 await 之前同步取得，否則全套並行測試時全域 active pinia 可能已被切換
  notificationStoreRef = useNotificationStore()
  router = createRouter({
    history: createMemoryHistory(),
    routes: [
      { path: '/alerts', component: AlertsPage },
      { path: '/activity', component: { template: '<div>Activity</div>' } },
    ],
  })
  router.push('/alerts')
  await router.isReady()
  return mount(AlertsPage, {
    global: {
      plugins: [pinia, router, createTestI18n()],
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

async function pointer(row, type, { x, y = 0, pointerId = 1, pointerType = 'touch' } = {}) {
  const event = new MouseEvent(type, {
    bubbles: true,
    clientX: x,
    clientY: y,
    button: 0,
  })
  Object.defineProperties(event, {
    pointerId: { value: pointerId },
    pointerType: { value: pointerType },
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

describe('AlertsPage notification actor normalization', () => {
  test('保留有效 actor 並收斂成前端契約', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            actor: {
              id: 'requester-1',
              displayName: 'Alice',
              avatarUrl: '/uploads/avatars/alice.png',
              ignored: 'server-only',
            },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.vm.notifications[0].actor).toEqual({
      id: 'requester-1',
      displayName: 'Alice',
      avatarUrl: '/uploads/avatars/alice.png',
    })
  })

  test.each([undefined, null, {}, []])('缺少或無效 actor %j 會收斂為 null', async (actor) => {
    api.get.mockResolvedValueOnce({
      data: { notifications: [{ ...notifications[0], actor }] },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.vm.notifications[0].actor).toBeNull()
  })
})

describe('AlertsPage friend notification avatars', () => {
  test('收到邀請顯示 requester 相對路徑頭像，邀請被接受顯示 receiver 絕對路徑頭像', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'friend-request-created',
            type: 'friend_request_created',
            category: 'friend',
            actor: {
              id: 'requester-1',
              displayName: 'Alice',
              avatarUrl: '/uploads/avatars/alice.png',
            },
          },
          {
            ...notifications[0],
            id: 'friend-request-accepted',
            type: 'friend_request_accepted',
            category: 'friend',
            actor: {
              id: 'receiver-1',
              displayName: 'Bob',
              avatarUrl: 'https://images.example.com/bob.png',
            },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    const createdRow = wrapper.get('[data-notification-id="friend-request-created"]')
    const acceptedRow = wrapper.get('[data-notification-id="friend-request-accepted"]')
    expect(createdRow.get('.notification-avatar').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/alice.png',
    )
    expect(acceptedRow.get('.notification-avatar').attributes('src')).toBe(
      'https://images.example.com/bob.png',
    )
    expect(createdRow.find('.notification-icon--friend').exists()).toBe(false)
    expect(acceptedRow.find('.notification-icon--friend').exists()).toBe(false)
  })

  test('活動建立通知顯示 creator 的相對與絕對路徑方形頭像', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'activity-created-relative-avatar',
            actor: {
              id: 'creator-1',
              displayName: 'Carol',
              avatarUrl: '/uploads/avatars/carol.png',
            },
          },
          {
            ...notifications[0],
            id: 'activity-created-absolute-avatar',
            actor: {
              id: 'creator-2',
              displayName: 'Dana',
              avatarUrl: 'https://images.example.com/dana.png',
            },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    const relativeRow = wrapper.get('[data-notification-id="activity-created-relative-avatar"]')
    const absoluteRow = wrapper.get('[data-notification-id="activity-created-absolute-avatar"]')
    expect(relativeRow.get('.notification-avatar').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/carol.png',
    )
    expect(absoluteRow.get('.notification-avatar').attributes('src')).toBe(
      'https://images.example.com/dana.png',
    )
    expect(relativeRow.find('.notification-icon--activity').exists()).toBe(false)
    expect(absoluteRow.find('.notification-icon--activity').exists()).toBe(false)
    expect(relativeRow.text()).not.toContain('Carol')
    expect(absoluteRow.text()).not.toContain('Dana')
  })

  test('活動建立通知缺少 actor 或 avatarUrl 時顯示既有活動圖示', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'activity-created-without-actor',
            actor: null,
          },
          {
            ...notifications[0],
            id: 'activity-created-without-avatar',
            actor: { id: 'creator-3', displayName: 'Eve', avatarUrl: null },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    for (const id of ['activity-created-without-actor', 'activity-created-without-avatar']) {
      const row = wrapper.get(`[data-notification-id="${id}"]`)
      expect(row.find('.notification-avatar').exists()).toBe(false)
      expect(row.get('.notification-icon--activity').exists()).toBe(true)
    }
  })

  test('活動建立者頭像載入失敗後移除 broken image 並顯示既有活動圖示', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'activity-created-avatar-error',
            actor: {
              id: 'creator-4',
              displayName: 'Frank',
              avatarUrl: 'https://images.example.com/missing-creator.png',
            },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('[data-notification-id="activity-created-avatar-error"]')

    expect(row.find('.notification-icon--activity').exists()).toBe(false)
    await row.get('.notification-avatar').trigger('error')

    expect(row.find('.notification-avatar').exists()).toBe(false)
    expect(row.get('.notification-icon--activity').exists()).toBe(true)
  })

  test('actor 缺少或 avatarUrl 為 null 時顯示既有好友圖示', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'friend-without-actor',
            type: 'friend_request_created',
            category: 'friend',
            actor: null,
          },
          {
            ...notifications[0],
            id: 'friend-without-avatar',
            type: 'friend_request_accepted',
            category: 'friend',
            actor: { id: 'receiver-2', displayName: 'Carol', avatarUrl: null },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    for (const id of ['friend-without-actor', 'friend-without-avatar']) {
      const row = wrapper.get(`[data-notification-id="${id}"]`)
      expect(row.find('.notification-avatar').exists()).toBe(false)
      expect(row.get('.notification-icon--friend').exists()).toBe(true)
    }
  })

  test('actor 頭像載入失敗後移除 broken image 並顯示既有好友圖示', async () => {
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'friend-avatar-error',
            type: 'friend_request_created',
            category: 'friend',
            actor: {
              id: 'requester-3',
              displayName: 'Dana',
              avatarUrl: 'https://images.example.com/missing.png',
            },
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('[data-notification-id="friend-avatar-error"]')

    expect(row.find('.notification-icon--friend').exists()).toBe(false)
    await row.get('.notification-avatar').trigger('error')

    expect(row.find('.notification-avatar').exists()).toBe(false)
    expect(row.get('.notification-icon--friend').exists()).toBe(true)
  })

  test('一般通知即使帶有 actor 仍保留既有 category icon', async () => {
    const actor = {
      id: 'actor-not-used',
      displayName: 'Eve',
      avatarUrl: 'https://images.example.com/eve.png',
    }
    api.get.mockResolvedValueOnce({
      data: {
        notifications: [
          {
            ...notifications[0],
            id: 'general-with-actor',
            type: 'system_notice',
            category: 'general',
            actor,
          },
        ],
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    const generalRow = wrapper.get('[data-notification-id="general-with-actor"]')
    expect(generalRow.find('.notification-avatar').exists()).toBe(false)
    expect(generalRow.get('.notification-icon--general').exists()).toBe(true)
  })

  test('其他活動生命週期通知即使帶有 actor 仍保留既有活動圖示', async () => {
    const actor = {
      id: 'activity-actor-not-used',
      displayName: 'Grace',
      avatarUrl: 'https://images.example.com/grace.png',
    }
    const lifecycleTypes = [
      'formation_ready',
      'time_to_pick',
      'activity_confirmed',
      'activity_cancelled',
    ]
    api.get.mockResolvedValueOnce({
      data: {
        notifications: lifecycleTypes.map((type) => ({
          ...notifications[0],
          id: `activity-lifecycle-${type}`,
          type,
          actor,
        })),
      },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    for (const type of lifecycleTypes) {
      const row = wrapper.get(`[data-notification-id="activity-lifecycle-${type}"]`)
      expect(row.find('.notification-avatar').exists()).toBe(false)
      expect(row.get('.notification-icon--activity').exists()).toBe(true)
    }
  })
})

describe('AlertsPage initial load animation', () => {
  test('等待首次 request 完成後才替非空通知列套用進場狀態', async () => {
    api.get.mockReset()
    let resolveNotifications
    api.get.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveNotifications = resolve
        }),
    )

    const wrapper = await mountAlerts()

    expect(wrapper.text()).toContain('通知讀取中...')
    expect(wrapper.find('.alerts-swipe-shell').exists()).toBe(false)

    resolveNotifications({ data: { notifications } })
    await flushPromises()

    expect(wrapper.get('.alerts-swipe-shell').classes()).toContain('alerts-swipe-shell--entering')
  })

  test('後續好友操作重新取得通知時不重播進場動畫', async () => {
    api.get.mockReset()
    const friendRequest = {
      ...notifications[0],
      id: 'friend-request-animation',
      type: 'friend_request_created',
      category: 'friend',
      reference: { id: 'friendship-animation' },
      actions: ['accept', 'reject'],
    }
    api.get
      .mockResolvedValueOnce({ data: { notifications: [friendRequest] } })
      .mockResolvedValueOnce({
        data: { notifications: [{ ...friendRequest, isRead: true, actions: [] }] },
      })

    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.get('.alerts-swipe-shell').classes()).toContain('alerts-swipe-shell--entering')

    await wrapper.get('.alerts-inline-btn--accept').trigger('click')
    await flushPromises()

    expect(wrapper.get('.alerts-swipe-shell').classes()).not.toContain(
      'alerts-swipe-shell--entering',
    )
  })

  test('首次成功取得空清單時維持既有空狀態且不產生進場列', async () => {
    api.get.mockReset()
    api.get.mockResolvedValueOnce({ data: { notifications: [] } })

    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.text()).toContain('目前沒有通知')
    expect(wrapper.find('.alerts-swipe-shell--entering').exists()).toBe(false)
  })

  test('前 8 列依序錯開，後續列維持 420ms 最大延遲', async () => {
    api.get.mockReset()
    const animationNotifications = Array.from({ length: 9 }, (_, index) => ({
      ...notifications[0],
      id: `notification-animation-${index}`,
      message: `通知 ${index + 1}`,
    }))
    api.get.mockResolvedValueOnce({ data: { notifications: animationNotifications } })

    const wrapper = await mountAlerts()
    await flushPromises()

    const rows = wrapper.findAll('.alerts-swipe-shell')
    const delays = rows.map((row) => row.attributes('style'))

    expect(delays[0]).toContain('--alerts-enter-delay: 0ms')
    expect(delays[1]).toContain('--alerts-enter-delay: 60ms')
    expect(delays[2]).toContain('--alerts-enter-delay: 120ms')
    expect(delays[7]).toContain('--alerts-enter-delay: 420ms')
    expect(delays[8]).toContain('--alerts-enter-delay: 420ms')
  })
})

describe('AlertsPage read state visuals', () => {
  test('通知清單尾端提供可計入捲動高度的底部導覽列留白', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.get('.alerts-bottom-spacer').attributes('aria-hidden')).toBe('true')
    expect(alertsPageSource).toContain('height: calc(5rem + env(safe-area-inset-bottom, 0px));')
  })

  test('未讀與已讀通知使用不同狀態且只有未讀列顯示方形提示點', async () => {
    api.get.mockResolvedValueOnce({
      data: { notifications: [notifications[0], secondNotification] },
    })

    const wrapper = await mountAlerts()
    await flushPromises()

    const unreadRow = wrapper.get('[data-notification-id="notification-1"] .alerts-item')
    const readRow = wrapper.get('[data-notification-id="notification-2"] .alerts-item')

    expect(unreadRow.classes()).toContain('alerts-item--unread')
    expect(unreadRow.find('.notification-icon--read').exists()).toBe(false)
    expect(unreadRow.get('.alerts-unread-indicator').attributes('aria-hidden')).toBe('true')
    expect(readRow.classes()).not.toContain('alerts-item--unread')
    expect(readRow.find('.notification-icon--read').exists()).toBe(true)
    expect(readRow.find('.alerts-unread-indicator').exists()).toBe(false)
  })

  test('點擊未讀通知成功後移除未讀狀態與提示點', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('[data-notification-id="notification-1"] .alerts-item')

    expect(row.classes()).toContain('alerts-item--unread')
    expect(row.find('.alerts-unread-indicator').exists()).toBe(true)

    await row.trigger('click')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')
    expect(row.classes()).not.toContain('alerts-item--unread')
    expect(row.find('.alerts-unread-indicator').exists()).toBe(false)
    expect(row.find('.notification-icon--read').exists()).toBe(true)
  })

  test('狀態樣式維持方角且提示點在 reduced motion 下停止動畫', () => {
    expect(alertsPageSource).toContain('border-radius: 0')
    expect(alertsPageSource).toContain('@keyframes alerts-unread-pulse')
    expect(alertsPageSource).toContain('animation: alerts-unread-pulse 2.4s')
    expect(alertsPageSource).toContain('.alerts-unread-indicator')
  })
})

describe('AlertsPage fine-hover dismissal', () => {
  const readActivityNotification = {
    id: 'notification-hover-act',
    type: 'activity_confirmed',
    category: 'activity',
    message: '「週五羽球」已確認成團',
    timeText: '1 小時前',
    isRead: true,
    actions: [],
    reference: { type: 'activity', id: 42, status: 'confirmed' },
  }

  test.each([
    ['fine-hover', false, [], 'hover', true, 'absent'],
    ['fine-hover', true, [], 'idle', false, 'visually-hidden'],
    ['fine-hover', true, [], 'hover', false, 'hover-visible'],
    ['fine-hover', true, [], 'keyboard-focus', false, 'focus-visible'],
    ['fine-hover', true, ['accept', 'reject'], 'hover', false, 'absent'],
    ['touch-only', true, [], 'idle', false, 'touch-hidden'],
  ])(
    '%s / %s / %s 依 state matrix 顯示未讀點與 X',
    async (inputCapability, isRead, actions, interaction, showUnread, dismissMode) => {
      const notification = {
        ...notifications[0],
        id: `notification-matrix-${inputCapability}-${interaction}`,
        isRead,
        actions,
        reference: actions.length
          ? { type: 'friendship', id: 'friendship-matrix' }
          : notifications[0].reference,
      }
      api.get.mockResolvedValueOnce({ data: { notifications: [notification] } })
      const wrapper = await mountAlerts()
      await flushPromises()

      const row = wrapper.get('.alerts-item')
      const dismissControl = row.find('.alerts-hover-dismiss')

      expect(row.find('.alerts-unread-indicator').exists()).toBe(showUnread)

      if (dismissMode === 'absent') {
        expect(dismissControl.exists()).toBe(false)
      } else {
        expect(dismissControl.attributes('aria-label')).toBe('移除通知')
      }

      if (dismissMode === 'visually-hidden') {
        expect(alertsPageSource).toContain('opacity: 0')
        expect(alertsPageSource).toContain('pointer-events: none')
      }
      if (dismissMode === 'hover-visible') {
        expect(alertsPageSource).toContain('.alerts-item:hover .alerts-hover-dismiss')
      }
      if (dismissMode === 'focus-visible') {
        expect(alertsPageSource).toContain('.alerts-item:focus-within .alerts-hover-dismiss')
      }
      if (dismissMode === 'touch-hidden') {
        expect(alertsPageSource).toContain('.alerts-hover-dismiss {\n  display: none;')
        expect(alertsPageSource).toContain('@media (hover: hover) and (pointer: fine)')
      }
    },
  )

  test('fine-hover X 預留固定空間並套用指定 hover、focus 與 reduced-motion 視覺', () => {
    expect(alertsPageSource).toContain('@media (hover: hover) and (pointer: fine)')
    expect(alertsPageSource).not.toContain('@media (min-width: 768px)')
    expect(alertsPageSource).toContain('.alerts-hover-dismiss')
    expect(alertsPageSource).toContain('width: 32px')
    expect(alertsPageSource).toContain('height: 32px')
    expect(alertsPageSource).toMatch(
      /@media \(hover: hover\) and \(pointer: fine\)[\s\S]*?\.alerts-hover-dismiss \{[^}]*align-self: center/,
    )
    expect(alertsPageSource).toContain('border-radius: 8px')
    expect(alertsPageSource).toContain('color: #98968a')
    expect(alertsPageSource).toContain('opacity 180ms ease')
    expect(alertsPageSource).toContain('transform: translateY(10px)')
    expect(alertsPageSource).toContain('.alerts-item:focus-within .alerts-hover-dismiss')
    expect(alertsPageSource).toContain('background: rgba(196, 64, 52, 0.12)')
    expect(alertsPageSource).toContain('color: #c44034')
    expect(alertsPageSource).toContain('transition-duration: 1ms')
    expect(alertsPageSource).toContain('.alerts-hover-dismiss {\n  display: none;')
  })

  test('點擊 X 只送出一次 dismiss，不標記已讀也不導頁', async () => {
    api.get.mockResolvedValueOnce({ data: { notifications: [readActivityNotification] } })
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    const dismissButton = wrapper.get('.alerts-hover-dismiss')
    setRowWidth(row)

    expect(dismissButton.attributes('type')).toBe('button')
    await pointer(dismissButton, 'pointerdown', { x: 280, pointerType: 'mouse' })
    await pointer(row, 'pointermove', { x: 200, pointerType: 'mouse' })
    expect(row.attributes('style')).toContain('translateX(0px)')
    await dismissButton.trigger('keydown', { key: 'Enter' })
    expect(router.currentRoute.value.path).toBe('/alerts')
    expect(api.patch).not.toHaveBeenCalled()
    await dismissButton.trigger('click')

    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-hover-act/dismiss')
    expect(api.patch).not.toHaveBeenCalledWith('/api/notifications/notification-hover-act/read')
    expect(router.currentRoute.value.path).toBe('/alerts')
    await vi.waitFor(() => {
      expect(wrapper.find('[data-notification-id="notification-hover-act"]').exists()).toBe(false)
    })
  })

  test('點擊 X pending 期間只垂直收合，維持零水平位移與零滑動進度', async () => {
    let resolveDismissal
    api.get.mockResolvedValueOnce({ data: { notifications: [readActivityNotification] } })
    api.patch.mockImplementationOnce(
      () =>
        new Promise((resolve) => {
          resolveDismissal = resolve
        }),
    )
    const wrapper = await mountAlerts()
    await flushPromises()
    const shell = wrapper.get('[data-notification-id="notification-hover-act"]')
    const row = shell.get('.alerts-item')
    const affordance = shell.get('.alerts-dismiss-affordance')
    const ring = shell.get('.alerts-dismiss-progress-ring circle')
    setRowWidth(row)

    await shell.get('.alerts-hover-dismiss').trigger('click')
    await nextTick()

    expect(shell.classes()).toContain('alerts-swipe-shell--dismissing')
    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(affordance.attributes('style')).toContain('--dismiss-progress: 0')
    expect(ring.attributes('style')).toContain('stroke-dashoffset: 100')
    expect(alertsPageSource).toContain('grid-template-rows: 1fr')
    expect(alertsPageSource).toContain('grid-template-rows: 0fr')
    expect(alertsPageSource).toContain('margin-bottom: 12px')
    expect(alertsPageSource).not.toContain('max-height: 320px')
    expect(alertsPageSource).not.toContain('class="flex flex-col gap-3"')
    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-hover-act/dismiss')

    resolveDismissal({ data: { message: 'ok' } })
    await vi.waitFor(() => {
      expect(wrapper.find('[data-notification-id="notification-hover-act"]').exists()).toBe(false)
    })
  })

  test.each([
    ['HTTP', { response: { status: 500 } }],
    ['network', new Error('Network Error')],
  ])('X dismissal %s 失敗時保留已讀通知並顯示錯誤', async (_label, failure) => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    api.get.mockResolvedValueOnce({ data: { notifications: [readActivityNotification] } })
    api.patch.mockRejectedValueOnce(failure)
    const wrapper = await mountAlerts()
    await flushPromises()

    await wrapper.get('.alerts-hover-dismiss').trigger('click')
    await flushPromises()

    const row = wrapper.get('[data-notification-id="notification-hover-act"] .alerts-item')
    expect(row.classes()).not.toContain('alerts-item--unread')
    expect(row.get('.alerts-hover-dismiss').exists()).toBe(true)
    expect(wrapper.text()).toContain('無法移除通知')
    expect(router.currentRoute.value.path).toBe('/alerts')
  })

  test('處理完的好友邀請重新取得 hover X 資格', async () => {
    const friendRequest = {
      ...notifications[0],
      id: 'friend-request-hover-processed',
      type: 'friend_request_created',
      category: 'friend',
      reference: { id: 'friendship-hover-processed' },
      actions: ['accept', 'reject'],
    }
    api.get
      .mockResolvedValueOnce({ data: { notifications: [friendRequest] } })
      .mockResolvedValueOnce({
        data: { notifications: [{ ...friendRequest, isRead: true, actions: [] }] },
      })
    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.find('.alerts-hover-dismiss').exists()).toBe(false)
    await wrapper.get('.alerts-inline-btn--accept').trigger('click')
    await flushPromises()

    expect(wrapper.get('.alerts-hover-dismiss').attributes('aria-label')).toBe('移除通知')
  })
})

describe('AlertsPage notification swipe dismissal', () => {
  test('載入通知並提供固定列寬與 Pointer Events 測試基礎', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()

    const row = wrapper.get('.alerts-item')
    setRowWidth(row)
    await pointer(row, 'pointerdown', { x: 280 })

    expect(api.get).toHaveBeenCalledWith('/api/notifications')
    expect(row.element.clientWidth).toBe(300)
    expect(wrapper.text()).toContain('A 建立了新活動')
  })

  test('亮紅背景與垃圾桶圓環依 65% 刪除距離同步完成', async () => {
    const wrapper = await mountAlerts()
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
    const wrapper = await mountAlerts()
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
    const wrapper = await mountAlerts()
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

    expect(row.attributes('style')).toContain('translateX(-300px)')
    expect(wrapper.get('.alerts-dismiss-affordance').attributes('style')).toContain(
      '--dismiss-progress: 1',
    )
    expect(wrapper.get('.alerts-dismiss-progress-ring circle').attributes('style')).toContain(
      'stroke-dashoffset: 0',
    )
    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/dismiss')
  })

  test('快速短滑不會略過 65% 位移門檻', async () => {
    const wrapper = await mountAlerts()
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
    const wrapper = await mountAlerts()
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
    const wrapper = await mountAlerts()
    await flushPromises()
    const notificationStore = notificationStoreRef

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
    await vi.waitFor(() => {
      expect(wrapper.find('[data-notification-id="notification-1"]').exists()).toBe(false)
    })

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
    const wrapper = await mountAlerts()
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
    const wrapper = await mountAlerts()
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
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')

    await row.trigger('click')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')

    api.get.mockResolvedValue({ data: { notifications } })
    const keyboardWrapper = await mountAlerts()
    await flushPromises()
    await keyboardWrapper.get('.alerts-item').trigger('keydown', { key: 'Enter' })
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')

    api.get.mockResolvedValue({ data: { notifications } })
    const allReadWrapper = await mountAlerts()
    await flushPromises()
    await allReadWrapper
      .findAll('button')
      .find((button) => button.text() === '全部已讀')
      .trigger('click')
    await flushPromises()
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/read-all')
  })

  test('桌機慢速左滑超過 250ms 後的 click 不會 dismiss、已讀或導頁', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)
    const nowSpy = vi.spyOn(performance, 'now').mockReturnValue(0)

    await pointer(row, 'pointerdown', { x: 300, pointerType: 'mouse' })
    await pointer(row, 'pointermove', { x: 240, pointerType: 'mouse' })
    nowSpy.mockReturnValue(300)
    await pointer(row, 'pointerup', { x: 240, pointerType: 'mouse' })
    await row.trigger('click')

    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(api.patch).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/alerts')
    nowSpy.mockRestore()
  })

  test.each([
    ['mouse', 'mouse'],
    ['pen', 'pen'],
    ['未提供 pointer type', ''],
  ])('%s 橫向拖曳期間維持零位移、零進度且不送 dismiss', async (_label, pointerType) => {
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    const affordance = wrapper.get('.alerts-dismiss-affordance')
    const ring = wrapper.get('.alerts-dismiss-progress-ring circle')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300, pointerType })
    await pointer(row, 'pointermove', { x: 60, pointerType })

    expect(row.attributes('style')).toContain('translateX(0px)')
    expect(affordance.attributes('style')).toContain('--dismiss-progress: 0')
    expect(ring.attributes('style')).toContain('stroke-dashoffset: 100')

    await pointer(row, 'pointerup', { x: 60, pointerType })

    expect(api.patch).not.toHaveBeenCalled()
  })

  test('拖曳後的 click 只被阻擋一次，下一次正常 click 可標記已讀', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300, pointerType: 'mouse' })
    await pointer(row, 'pointermove', { x: 240, pointerType: 'mouse' })
    await pointer(row, 'pointerup', { x: 240, pointerType: 'mouse' })
    await row.trigger('click')
    await row.trigger('click')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledTimes(1)
    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')
  })

  test('拖曳後若沒有合成 click，下一次 pointerdown 會清除過期 guard', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300, pointerType: 'mouse' })
    await pointer(row, 'pointermove', { x: 240, pointerType: 'mouse' })
    await pointer(row, 'pointerup', { x: 240, pointerType: 'mouse' })
    await pointer(row, 'pointerdown', { x: 300, pointerId: 2, pointerType: 'mouse' })
    await pointer(row, 'pointerup', { x: 300, pointerId: 2, pointerType: 'mouse' })
    await row.trigger('click')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-1/read')
  })

  test('垃圾桶提供可存取名稱且元件包含 reduced-motion 規則', async () => {
    const wrapper = await mountAlerts()
    await flushPromises()

    expect(wrapper.get('[role="img"]').attributes('aria-label')).toBe('移除通知')
    expect(alertsPageSource).toContain('@media (prefers-reduced-motion: reduce)')
    expect(alertsPageSource).toContain('transition-duration: 1ms')
    expect(alertsPageSource).toContain('.alerts-swipe-shell--entering')
    expect(alertsPageSource).toContain('animation: none')
  })
})

describe('AlertsPage activity notification deep link', () => {
  const activityNotification = {
    id: 'notification-act',
    type: 'formation_ready',
    category: 'activity',
    message: '「週五羽球」人數已滿，請確認成團',
    timeText: '剛剛',
    isRead: false,
    actions: [],
    reference: { type: 'activity', id: 42, status: 'voting' },
  }

  test('點擊活動通知後標記已讀並導向 /activity?focus=<id>', async () => {
    api.get.mockResolvedValue({ data: { notifications: [activityNotification] } })
    const wrapper = await mountAlerts()
    await flushPromises()

    await wrapper.get('.alerts-item').trigger('click')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-act/read')
    expect(router.currentRoute.value.path).toBe('/activity')
    expect(router.currentRoute.value.query.focus).toBe('42')
  })

  test('滑動 guard 阻擋活動通知 click 後，下一次正常 click 仍會標記已讀並導頁', async () => {
    api.get.mockResolvedValue({ data: { notifications: [activityNotification] } })
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300, pointerType: 'mouse' })
    await pointer(row, 'pointermove', { x: 240, pointerType: 'mouse' })
    await pointer(row, 'pointerup', { x: 240, pointerType: 'mouse' })
    await row.trigger('click')

    expect(api.patch).not.toHaveBeenCalled()
    expect(router.currentRoute.value.path).toBe('/alerts')

    await row.trigger('click')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-act/read')
    expect(router.currentRoute.value.path).toBe('/activity')
    expect(router.currentRoute.value.query.focus).toBe('42')
  })

  test.each([
    ['Enter', 'Enter'],
    ['Space', ' '],
  ])('%s 不受 pointer click guard 影響', async (_label, key) => {
    api.get.mockResolvedValue({ data: { notifications: [activityNotification] } })
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')
    setRowWidth(row)

    await pointer(row, 'pointerdown', { x: 300, pointerType: 'mouse' })
    await pointer(row, 'pointermove', { x: 240, pointerType: 'mouse' })
    await pointer(row, 'pointerup', { x: 240, pointerType: 'mouse' })
    await row.trigger('keydown', { key })
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-act/read')
    expect(router.currentRoute.value.path).toBe('/activity')
    expect(router.currentRoute.value.query.focus).toBe('42')
  })

  test('markAsRead 失敗時仍導向活動頁', async () => {
    api.get.mockResolvedValue({ data: { notifications: [activityNotification] } })
    api.patch.mockRejectedValue(new Error('mark read failed'))
    const wrapper = await mountAlerts()
    await flushPromises()

    await wrapper.get('.alerts-item').trigger('click')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/activity')
    expect(router.currentRoute.value.query.focus).toBe('42')
  })

  test('四種活動生命週期通知渲染後端文案與 activity icon 且無接受/拒絕按鈕', async () => {
    const lifecycleNotifications = [
      { type: 'formation_ready', message: '「週五羽球」人數已滿，請確認成團' },
      { type: 'time_to_pick', message: '「週五羽球」候選時段票數不相上下，請選擇最終時段' },
      { type: 'activity_confirmed', message: '「週五羽球」已確認成團' },
      { type: 'activity_cancelled', message: '「週五羽球」已取消' },
    ].map((partial, index) => ({
      ...activityNotification,
      ...partial,
      id: `notification-lifecycle-${index}`,
    }))
    api.get.mockResolvedValue({ data: { notifications: lifecycleNotifications } })
    const wrapper = await mountAlerts()
    await flushPromises()

    for (const notification of lifecycleNotifications) {
      expect(wrapper.text()).toContain(notification.message)
    }
    expect(wrapper.findAll('.notification-icon--activity')).toHaveLength(4)
    expect(
      wrapper.findAll('button').filter((b) => ['接受', '拒絕'].includes(b.text())),
    ).toHaveLength(0)
  })

  test('活動生命週期通知可完成滑動 dismiss', async () => {
    api.get.mockResolvedValue({ data: { notifications: [activityNotification] } })
    const wrapper = await mountAlerts()
    await flushPromises()
    const row = wrapper.get('.alerts-item')

    await dragLeft(row, { to: 100 })
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-act/dismiss')
  })

  test('非活動 reference 的通知點擊後只標記已讀不導頁', async () => {
    api.get.mockResolvedValue({
      data: {
        notifications: [
          {
            ...activityNotification,
            id: 'notification-friend',
            category: 'friend',
            reference: { type: 'friendship', id: 'friendship-1' },
          },
        ],
      },
    })
    const wrapper = await mountAlerts()
    await flushPromises()

    await wrapper.get('.alerts-item').trigger('click')
    await flushPromises()

    expect(api.patch).toHaveBeenCalledWith('/api/notifications/notification-friend/read')
    expect(router.currentRoute.value.path).toBe('/alerts')
  })
})
