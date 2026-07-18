import { mount } from '@vue/test-utils'
import { createI18n } from 'vue-i18n'
import { describe, expect, test } from 'vitest'
import LineOfficialAccountEntry from '@/components/LineOfficialAccountEntry.vue'
import officialAccountEntrySource from '@/components/LineOfficialAccountEntry.vue?raw'
import bundledQrCodeUrl from '@/assets/line-gain-friends-qrcode.png'
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

const addFriendUrl = 'https://line.me/R/ti/p/@bujo'
const qrCodeUrl = 'https://example.com/bujo-line-qr.png'

describe('LineOfficialAccountEntry', () => {
  test('手機與桌機都顯示 QR 並保留 add friend 連結備援', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
      global: { plugins: [createTestI18n()] },
    })

    const link = wrapper.get('a[aria-label="開啟 BuJo LINE 官方帳號加入好友頁面"]')
    expect(link.attributes('href')).toBe(addFriendUrl)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')

    const qrContainer = wrapper.get('[data-testid="line-official-account-qr"]')
    expect(qrContainer.classes()).not.toContain('hidden')
    expect(qrContainer.classes()).toContain('line-official-entry__qr')
    expect(qrContainer.get('img').attributes()).toMatchObject({
      src: qrCodeUrl,
      alt: 'BuJo LINE 官方帳號加入好友 QR Code',
    })
    expect(officialAccountEntrySource).toContain('flex-direction: column')
    expect(officialAccountEntrySource).toContain('@media (min-width: 768px)')
  })

  test('未設定外部 QR URL 時使用專案內建的官方 QR Code', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl: '' },
      global: { plugins: [createTestI18n()] },
    })

    expect(wrapper.get('img').attributes('src')).toBe(bundledQrCodeUrl)
    expect(wrapper.text()).toContain('拿手機 LINE 掃一下')
  })

  test('缺少 add friend URL 時只顯示可用 QR，不殘留連結錯誤提示', async () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl: '  ', qrCodeUrl: '' },
      global: { plugins: [createTestI18n()] },
    })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe(bundledQrCodeUrl)
    expect(wrapper.find('[role="status"]').exists()).toBe(false)

    await wrapper.get('img').trigger('error')

    expect(wrapper.get('[role="status"]').text()).toBe(
      'LINE 官方帳號連結暫時打不開，晚點再試試看。',
    )
  })

  test('QR 圖片載入失敗時隱藏壞圖並保留 add friend 連結', async () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
      global: { plugins: [createTestI18n()] },
    })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe(addFriendUrl)
    expect(wrapper.text()).toContain('QR Code 沒有載入成功，點下面的連結也可以加入。')
  })

  test('啟用 add friend 連結時先送出 activate 事件', async () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
      global: { plugins: [createTestI18n()] },
    })

    await wrapper.get('a').trigger('click')

    expect(wrapper.emitted('activate')).toHaveLength(1)
  })

  test('官方帳號連結具可讀名稱、focus-visible 與方角線框契約', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
      global: { plugins: [createTestI18n()] },
      attachTo: document.body,
    })
    const link = wrapper.get('a[aria-label="開啟 BuJo LINE 官方帳號加入好友頁面"]')

    link.element.focus()
    expect(document.activeElement).toBe(link.element)
    expect(wrapper.get('img').attributes('alt')).toBe('BuJo LINE 官方帳號加入好友 QR Code')
    expect(officialAccountEntrySource).toContain('.line-official-entry__link:focus-visible')
    expect(officialAccountEntrySource).toContain('border: 1px solid var(--bujo-line-soft)')
    expect(officialAccountEntrySource).not.toMatch(/rounded-(?:md|lg|xl|2xl|3xl)/)

    wrapper.unmount()
  })
})
