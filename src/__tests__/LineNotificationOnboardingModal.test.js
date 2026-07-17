import { mount } from '@vue/test-utils'
import { afterEach, describe, expect, test } from 'vitest'
import LineNotificationOnboardingModal from '@/components/LineNotificationOnboardingModal.vue'
import onboardingModalSource from '@/components/LineNotificationOnboardingModal.vue?raw'

const BaseModalStub = {
  props: ['title'],
  emits: ['close'],
  template: `
    <section>
      <h2>{{ title }}</h2>
      <button type="button" aria-label="測試關閉彈窗" @click="$emit('close')">關閉</button>
      <slot />
      <slot name="footer" />
    </section>
  `,
}

function mountModal(user) {
  return mount(LineNotificationOnboardingModal, {
    props: {
      user,
      apiBaseUrl: 'https://api.example.com/',
      addFriendUrl: 'https://line.me/R/ti/p/@bujo',
      qrCodeUrl: 'https://example.com/bujo-line-qr.png',
    },
    global: {
      stubs: { BaseModal: BaseModalStub },
    },
    attachTo: document.body,
  })
}

afterEach(() => {
  document.body.innerHTML = ''
})

describe('LineNotificationOnboardingModal', () => {
  test('沒有 LINE identity 時說明兩個必要步驟並導向既有綁定流程', async () => {
    const wrapper = mountModal({
      id: 'user-1',
      identities: [{ provider: 'google', email: 'user@example.com' }],
    })

    expect(wrapper.get('h2').text()).toBe('用 LINE 收到揪團提醒')
    expect(wrapper.text()).toContain('想在 LINE 收到揪團提醒嗎？')
    expect(wrapper.text()).toContain('先把 BuJo 帳號連上 LINE')
    expect(wrapper.text()).toContain('現在不想設定也沒關係')
    expect(wrapper.find('[data-testid="line-official-account-entry"]').exists()).toBe(true)
    expect(wrapper.get('img').attributes('alt')).toBe('BuJo LINE 官方帳號加入好友 QR Code')
    expect(wrapper.get('a[aria-label="連接 LINE 並開啟通知設定"]').attributes('href')).toBe(
      'https://api.example.com/api/auth/line/link',
    )
  })

  test.each([undefined, null, {}, { identities: 'line' }])(
    'identities 缺失或 malformed 時安全視為尚未連接：%s',
    (user) => {
      const wrapper = mountModal(user)

      expect(wrapper.get('h2').text()).toBe('用 LINE 收到揪團提醒')
      expect(wrapper.find('a[aria-label="連接 LINE 並開啟通知設定"]').exists()).toBe(true)
    },
  )

  test('已有 LINE identity 時只引導加入或解除封鎖官方帳號', () => {
    const wrapper = mountModal({
      id: 'user-1',
      identities: [{ provider: 'line', email: null }],
    })

    expect(wrapper.get('h2').text()).toBe('LINE 提醒就差一步')
    expect(wrapper.text()).toContain('你的 BuJo 已經連上 LINE 囉！')
    expect(wrapper.text()).toContain('也記得確認沒有封鎖我們')
    expect(wrapper.find('[data-testid="line-official-account-entry"]').exists()).toBe(true)
    expect(wrapper.find('a[aria-label="連接 LINE 並開啟通知設定"]').exists()).toBe(false)
    expect(wrapper.text()).not.toContain('已加入官方帳號')
    expect(wrapper.text()).not.toContain('推播已開啟')
  })

  test('關閉、稍後再說、綁定與官方帳號動作都送出 complete', async () => {
    const unconnected = mountModal({ id: 'user-1', identities: [] })
    await unconnected.get('[aria-label="測試關閉彈窗"]').trigger('click')
    await unconnected
      .findAll('button')
      .find((button) => button.text() === '稍後再說')
      .trigger('click')
    const lineLink = unconnected.get('a[aria-label="連接 LINE 並開啟通知設定"]')
    lineLink.element.addEventListener('click', (event) => event.preventDefault())
    await lineLink.trigger('click')
    const unconnectedOfficialAccountLink = unconnected.get(
      'a[aria-label="開啟 BuJo LINE 官方帳號加入好友頁面"]',
    )
    unconnectedOfficialAccountLink.element.addEventListener('click', (event) =>
      event.preventDefault(),
    )
    await unconnectedOfficialAccountLink.trigger('click')

    expect(unconnected.emitted('complete')).toHaveLength(4)

    const connected = mountModal({
      id: 'user-2',
      identities: [{ provider: 'line' }],
    })
    const officialAccountLink = connected.get('a[aria-label="開啟 BuJo LINE 官方帳號加入好友頁面"]')
    officialAccountLink.element.addEventListener('click', (event) => event.preventDefault())
    await officialAccountLink.trigger('click')

    expect(connected.emitted('complete')).toHaveLength(1)
  })

  test('鍵盤可聚焦次要與主要動作，且 source 鎖定方角 Modern Paper focus 樣式', () => {
    const wrapper = mountModal({ id: 'user-1', identities: [] })
    const laterButton = wrapper.findAll('button').find((button) => button.text() === '稍後再說')
    const primaryLink = wrapper.get('a[aria-label="連接 LINE 並開啟通知設定"]')

    laterButton.element.focus()
    expect(document.activeElement).toBe(laterButton.element)
    primaryLink.element.focus()
    expect(document.activeElement).toBe(primaryLink.element)

    expect(onboardingModalSource).toContain('.line-onboarding-primary:focus-visible')
    expect(onboardingModalSource).toContain('border: 1px solid var(--bujo-line-soft)')
    expect(onboardingModalSource).not.toMatch(/rounded-(?:md|lg|xl|2xl|3xl)/)
  })
})
