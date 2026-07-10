import { mount } from '@vue/test-utils'
import { describe, expect, test, afterEach, vi } from 'vitest'
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

describe('AvailabilityPickerModal - 共用 BaseModal 外殼', () => {
  test('彈窗開啟時按 Escape 會關閉', async () => {
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

    window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))
    await wrapper.vm.$nextTick()

    expect(wrapper.emitted('update:modelValue')).toBeTruthy()
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])
  })
})

describe('AvailabilityPickerModal - 結束時間選單排除等於或早於已選開始時間的選項', () => {
  test('選了開始時間後，結束時間選單不會出現該小時或更早的選項', async () => {
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

    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    const startOption = wrapper
      .findAll('button[data-hour]')
      .find((o) => o.text() === '上午 1:00')
    await startOption.trigger('click')

    const endButtons = wrapper.findAll('.time-picker-wrap button')
    await endButtons[1].trigger('click')
    const endOptions = wrapper.findAll('button[data-hour]').map((o) => o.text())

    expect(endOptions).not.toContain('上午 12:00')
    expect(endOptions).not.toContain('上午 1:00')
    expect(endOptions[0]).toBe('上午 2:00')
  })

  test('同一天有兩筆 range 時，各自的結束時間選單只依自己的開始時間過濾', async () => {
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

    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    let startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    let startOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '上午 8:00')
    await startOption.trigger('click')

    const addButton = wrapper.findAll('button').find((b) => b.text() === '＋ 新增時段')
    await addButton.trigger('click')

    startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[2].trigger('click')
    startOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '下午 3:00')
    await startOption.trigger('click')

    const endButtonsForSecondRange = wrapper.findAll('.time-picker-wrap button')
    await endButtonsForSecondRange[3].trigger('click')
    const secondRangeEndOptions = wrapper.findAll('button[data-hour]').map((o) => o.text())

    expect(secondRangeEndOptions).not.toContain('上午 8:00')
    expect(secondRangeEndOptions[0]).toBe('下午 4:00')
  })
})

describe('AvailabilityPickerModal - 開始時間選單排除今天已經過去的時段', () => {
  afterEach(() => {
    vi.useRealTimers()
  })

  test('正在編輯的日期是今天時，開始時間選單只列出目前小時之後的選項', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 12, 9, 30))

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

    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    const startOptions = wrapper.findAll('button[data-hour]').map((o) => o.text())

    expect(startOptions).not.toContain('上午 9:00')
    expect(startOptions[0]).toBe('上午 10:00')
  })

  test('正在編輯的日期不是今天時，開始時間選單不受目前時間影響', async () => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(2026, 5, 12, 9, 30))

    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-13',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    const startOptions = wrapper.findAll('button[data-hour]').map((o) => o.text())

    expect(startOptions[0]).toBe('上午 12:00')
  })
})

describe('AvailabilityPickerModal - 選好開始時間後結束時間自動帶入 +1 小時', () => {
  test('選開始時間會自動把結束時間帶成 +1 小時', async () => {
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

    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    let startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    const startOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '上午 9:00')
    await startOption.trigger('click')

    startButtons = wrapper.findAll('.time-picker-wrap button')
    expect(startButtons[1].text()).toBe('上午 10:00')
  })

  test('手動選過結束時間後，改開始時間不會覆蓋（仍合理的情況下）', async () => {
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

    const customButton = wrapper.findAll('button').find((b) => b.text() === '指定時段')
    await customButton.trigger('click')

    let buttons = wrapper.findAll('.time-picker-wrap button')
    await buttons[0].trigger('click')
    let option = wrapper.findAll('button[data-hour]').find((o) => o.text() === '上午 9:00')
    await option.trigger('click')

    buttons = wrapper.findAll('.time-picker-wrap button')
    await buttons[1].trigger('click')
    option = wrapper.findAll('button[data-hour]').find((o) => o.text() === '下午 3:00')
    await option.trigger('click')

    buttons = wrapper.findAll('.time-picker-wrap button')
    await buttons[0].trigger('click')
    option = wrapper.findAll('button[data-hour]').find((o) => o.text() === '上午 10:00')
    await option.trigger('click')

    buttons = wrapper.findAll('.time-picker-wrap button')
    expect(buttons[1].text()).toBe('下午 3:00')
  })
})
