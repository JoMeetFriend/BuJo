import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import LineOfficialAccountEntry from '@/components/LineOfficialAccountEntry.vue'
import officialAccountEntrySource from '@/components/LineOfficialAccountEntry.vue?raw'
import bundledQrCodeUrl from '@/assets/line-gain-friends-qrcode.png'

const addFriendUrl = 'https://line.me/R/ti/p/@bujo'
const qrCodeUrl = 'https://example.com/bujo-line-qr.png'

describe('LineOfficialAccountEntry', () => {
  test('手機保留 add friend 連結，桌機顯示 QR 並保留連結備援', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
    })

    const link = wrapper.get('a[aria-label="開啟 BuJo LINE 官方帳號加入好友頁面"]')
    expect(link.attributes('href')).toBe(addFriendUrl)
    expect(link.attributes('target')).toBe('_blank')
    expect(link.attributes('rel')).toBe('noopener noreferrer')

    const qrContainer = wrapper.get('[data-testid="line-official-account-qr"]')
    expect(qrContainer.classes()).toContain('hidden')
    expect(qrContainer.classes()).toContain('md:flex')
    expect(qrContainer.get('img').attributes()).toMatchObject({
      src: qrCodeUrl,
      alt: 'BuJo LINE 官方帳號加入好友 QR Code',
    })
  })

  test('未設定外部 QR URL 時使用專案內建的官方 QR Code', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl: '' },
    })

    expect(wrapper.get('img').attributes('src')).toBe(bundledQrCodeUrl)
    expect(wrapper.text()).toContain('拿手機 LINE 掃一下')
  })

  test('缺少 add friend URL 時不產生空連結並顯示不可用狀態', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl: '  ', qrCodeUrl: '' },
    })

    expect(wrapper.find('a').exists()).toBe(false)
    expect(wrapper.get('img').attributes('src')).toBe(bundledQrCodeUrl)
    expect(wrapper.get('[role="status"]').classes()).toContain('md:hidden')
    expect(wrapper.get('[role="status"]').text()).toBe(
      '手機加入連結暫時打不開，可以改用桌機掃 QR Code。',
    )
  })

  test('QR 圖片載入失敗時隱藏壞圖並保留 add friend 連結', async () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
    })

    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.get('a').attributes('href')).toBe(addFriendUrl)
    expect(wrapper.text()).toContain('QR Code 沒有載入成功，點下面的連結也可以加入。')
  })

  test('啟用 add friend 連結時先送出 activate 事件', async () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
    })

    await wrapper.get('a').trigger('click')

    expect(wrapper.emitted('activate')).toHaveLength(1)
  })

  test('官方帳號連結具可讀名稱、focus-visible 與方角線框契約', () => {
    const wrapper = mount(LineOfficialAccountEntry, {
      props: { addFriendUrl, qrCodeUrl },
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
