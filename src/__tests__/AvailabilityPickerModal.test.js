import { mount } from '@vue/test-utils'
import { describe, expect, test } from 'vitest'
import AvailabilityPickerModal from '@/components/AvailabilityPickerModal.vue'

describe('AvailabilityPickerModal', () => {
  test('可以正常掛載報名時間選取彈窗', () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('選取有空時間')
  })
})
