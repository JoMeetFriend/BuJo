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

describe('AvailabilityPickerModal - fixedDate 隱藏日曆', () => {
  test('傳入 fixedDate 時不渲染日曆區塊，只顯示該日期的時段選取面板', () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    // 日曆區塊放在有 gap-0.5/gap-1 的月曆格線容器裡；fixedDate 模式不應該渲染這個格線
    expect(wrapper.find('.grid-cols-7').exists()).toBe(false)
    // 直接顯示 fixedDate 當天的時段面板，預設整天有空
    expect(wrapper.text()).toContain('整天有空')
  })

  test('未傳入 fixedDate 時，日曆與多日期選取行為維持現況不變', () => {
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

    expect(wrapper.find('.grid-cols-7').exists()).toBe(true)
    expect(wrapper.text()).toContain('← 選取日期')
  })
})

describe('AvailabilityPickerModal - timeWindow 限制可選小時', () => {
  test('傳入 timeWindowStart/timeWindowEnd 時，時間選取下拉選單只列出範圍內的小時', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '10:00',
        timeWindowEnd: '14:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    // 預設整天有空，先切到自訂時段才會出現時間下拉選單
    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    const options = wrapper.findAll('button[data-hour]').map((o) => o.text())
    expect(options).toEqual(['上午 10:00', '上午 11:00', '下午 12:00', '下午 1:00', '下午 2:00'])
  })
})
