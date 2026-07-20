import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import BaseModal from '@/components/ui/BaseModal.vue'
import baseModalSource from '@/components/ui/BaseModal.vue?raw'
import { createTestI18n } from './testUtils'

// BaseModal 用 <Teleport to="body">，實際 DOM 掛在 document.body 底下，
// 不在 wrapper 自己的節點內，所以要直接查 document 才找得到內容
function queryBody(selector) {
  return document.body.querySelector(selector)
}

function mountModal(props = {}) {
  return mount(BaseModal, {
    props: { isOpen: true, title: '活動詳情', ...props },
    slots: { default: '<div class="test-content">內容</div>' },
    global: { plugins: [createTestI18n()] },
    attachTo: document.body,
  })
}

describe('BaseModal - 一般模式（bare 預設關閉）', () => {
  test('顯示標題列與外框', () => {
    const wrapper = mountModal()

    expect(queryBody('header')).not.toBeNull()
    expect(queryBody('header').textContent).toContain('活動詳情')

    wrapper.unmount()
  })
})

describe('BaseModal - 手機底部導覽空間', () => {
  test('預設維持滿版 overlay，不套用底部導覽保留 class', () => {
    const wrapper = mountModal()

    const overlay = queryBody('.base-modal-overlay')
    expect(overlay).not.toBeNull()
    expect(overlay.classList).not.toContain('base-modal-overlay--reserve-mobile-nav-space')

    wrapper.unmount()
  })

  test('opt-in 時 overlay 保留 62px 且背景點擊仍會關閉', () => {
    const wrapper = mountModal({ reserveMobileNavSpace: true })

    const overlay = queryBody('.base-modal-overlay--reserve-mobile-nav-space')
    expect(overlay).not.toBeNull()
    expect(baseModalSource).toMatch(
      /@media \(max-width: 640px\)\s*{[^}]*\.base-modal-overlay--reserve-mobile-nav-space\s*{[^}]*bottom: 62px;/s,
    )

    overlay.click()
    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })
})

describe('BaseModal - bare 模式不顯示標題列，關閉按鈕交給內容自己提供', () => {
  test('不顯示標題列，也不會多渲染一個 ×（由內容自己的卡片提供關閉按鈕）', () => {
    const wrapper = mountModal({ bare: true })

    expect(queryBody('header')).toBeNull()
    expect(queryBody('.test-content')).not.toBeNull()

    wrapper.unmount()
  })

  test('點內容以外的背景（遮罩）也會觸發 close，跟點 × 效果一樣', () => {
    const wrapper = mountModal({ bare: true })

    queryBody('.fixed.inset-0').click()

    expect(wrapper.emitted('close')).toHaveLength(1)

    wrapper.unmount()
  })

  test('點卡片內容本身不會觸發 close', () => {
    const wrapper = mountModal({ bare: true })

    queryBody('.test-content').click()

    expect(wrapper.emitted('close')).toBeUndefined()

    wrapper.unmount()
  })
})
