import { mount, flushPromises } from '@vue/test-utils'
import { beforeEach, describe, expect, test, vi } from 'vitest'
import { createPinia } from 'pinia'
import ProfileAccountModal from '@/components/ProfileAccountModal.vue'
import { createTestI18n } from './testUtils'

const baseUser = {
  display_name: 'Test A',
  avatar_url: '',
}

function mountModal(user = {}) {
  return mount(ProfileAccountModal, {
    props: {
      user: {
        ...baseUser,
        ...user,
      },
    },
    global: {
      plugins: [createPinia(), createTestI18n()],
      stubs: {
        BaseModal: {
          template: `
            <section>
              <button type="button" aria-label="關閉我的帳號" @click="$emit('close')">×</button>
              <slot />
            </section>
          `,
        },
        RouterLink: {
          props: ['to'],
          emits: ['click'],
          template: '<a :href="to" @click.prevent="$emit(\'click\', $event)"><slot /></a>',
        },
      },
    },
  })
}

function stubClipboard(writeText = vi.fn().mockResolvedValue()) {
  Object.defineProperty(navigator, 'clipboard', {
    value: { writeText },
    configurable: true,
  })
  return writeText
}

beforeEach(() => {
  vi.restoreAllMocks()
  stubClipboard()
})

describe('ProfileAccountModal', () => {
  test('優先顯示 uid 後五碼', () => {
    const wrapper = mountModal({
      uid: 'bujo-user-d5e6f',
      id: 'legacy-11111',
    })

    expect(wrapper.text()).toContain('Test A')
    expect(wrapper.text()).toContain('Bujo ID: d5e6f')
    expect(wrapper.text()).not.toContain('11111')
  })

  test('沒有 uid 時顯示 id 後五碼', () => {
    const wrapper = mountModal({
      id: 'e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f',
    })

    expect(wrapper.text()).toContain('Bujo ID: d5e6f')
  })

  test('沒有 uid 與 id 時不顯示 BuJo ID 列與複製按鈕', () => {
    const wrapper = mountModal()

    expect(wrapper.text()).not.toContain('BuJo ID')
    expect(wrapper.find('[aria-label="複製 BuJo ID"]').exists()).toBe(false)
  })

  test('相對頭像路徑會補上 API base URL', () => {
    const wrapper = mountModal({
      avatar_url: '/uploads/avatars/avatar-user.png',
    })

    expect(wrapper.get('img').attributes('src')).toBe(
      'http://localhost:3000/uploads/avatars/avatar-user.png',
    )
  })

  test('沒有頭像時保留 fallback face', () => {
    const wrapper = mountModal()

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.profile-modal-face').exists()).toBe(true)
  })

  test('頭像圖片載入失敗時改顯示 fallback face', async () => {
    const wrapper = mountModal({
      avatar_url: 'https://res.cloudinary.com/demo/avatar-dead-link.png',
    })

    expect(wrapper.find('img').exists()).toBe(true)
    await wrapper.get('img').trigger('error')

    expect(wrapper.find('img').exists()).toBe(false)
    expect(wrapper.find('.profile-modal-face').exists()).toBe(true)
  })

  test('複製按鈕只複製可見五碼並顯示成功回饋', async () => {
    const writeText = stubClipboard(vi.fn().mockResolvedValue())
    const wrapper = mountModal({
      id: 'e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f',
    })
    const copyButton = wrapper.find('[aria-label="複製 BuJo ID"]')

    expect(copyButton.exists()).toBe(true)
    expect(copyButton.text()).toBe('')
    expect(copyButton.find('svg').exists()).toBe(true)

    await copyButton.trigger('click')
    await flushPromises()

    expect(writeText).toHaveBeenCalledWith('d5e6f')
    expect(wrapper.text()).toContain('已複製')
    expect(copyButton.element.nextElementSibling?.textContent.trim()).toBe('已複製')
  })

  test('clipboard 失敗時保留代碼並顯示失敗回饋', async () => {
    stubClipboard(vi.fn().mockRejectedValue(new Error('denied')))
    const wrapper = mountModal({
      id: 'e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f',
    })

    await wrapper.find('[aria-label="複製 BuJo ID"]').trigger('click')
    await flushPromises()

    expect(wrapper.text()).toContain('Bujo ID: d5e6f')
    expect(wrapper.text()).toContain('複製失敗')
  })

  test('既有個人編輯、登出與關閉操作仍可用', async () => {
    const wrapper = mountModal({
      id: 'e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f',
    })

    expect(wrapper.text()).toContain('個人編輯')
    expect(wrapper.text()).toContain('登出')
    expect(wrapper.find('[aria-label="關閉我的帳號"]').exists()).toBe(true)

    await wrapper.find('a[href="/profile/edit"]').trigger('click')
    expect(wrapper.emitted('close')).toHaveLength(1)

    const logoutButton = wrapper.findAll('button').find((button) => button.text().includes('登出'))
    await logoutButton.trigger('click')
    expect(wrapper.emitted('logout')).toHaveLength(1)
  })
})
