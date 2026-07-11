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

describe('AvailabilityPickerModal - 重新打開時要用最新的 initialRanges 重新預填', () => {
  // 元件在 ActivityDetailModal 裡只會建立一次，之後單純用 modelValue 切換顯示/隱藏——
  // 模擬「掛載時 initialRanges 還是空的（尚未報名），之後才變成有值（報名成功、activity 重新
  // fetch）」的情境，確認重新打開（modelValue 從 false 變 true）時會重新讀最新的 initialRanges，
  // 不是只停留在元件建立當下的舊快照
  test('modelValue 從 false 變 true 時，重新套用最新的 initialRanges', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: false,
        rangeStart: '2026-08-01',
        rangeEnd: '2026-08-31',
        initialRanges: [],
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.vm.selectedDates).toEqual({})

    await wrapper.setProps({
      initialRanges: [{ date: '2026-08-01', from: '上午 9:00', to: '上午 10:00' }],
    })
    // 只更新 props，還沒打開，selectedDates 不應該自動變化（沒有其他地方會主動同步）
    expect(wrapper.vm.selectedDates).toEqual({})

    await wrapper.setProps({ modelValue: true })

    expect(wrapper.vm.selectedDates).toEqual({
      '2026-08-01': [{ from: '上午 9:00', to: '上午 10:00', endTimeUserSet: true }],
    })

    wrapper.unmount()
  })

  test('情境四修改報名時段：重開 picker 後，未重新勾選但先前已選的候選日期仍保留，不會被覆蓋成沒選', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: false,
        rangeStart: '2026-08-01',
        rangeEnd: '2026-08-31',
        initialRanges: [],
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    // 模擬報名成功後 activity 重新 fetch，scenarioDInitialRanges 算出先前選的兩個候選日期
    await wrapper.setProps({
      initialRanges: [
        { date: '2026-08-01', from: '上午 9:00', to: '上午 10:00' },
        { date: '2026-08-15', from: '下午 2:00', to: '下午 3:00' },
      ],
    })
    await wrapper.setProps({ modelValue: true })

    expect(Object.keys(wrapper.vm.selectedDates).sort()).toEqual(['2026-08-01', '2026-08-15'])

    wrapper.unmount()
  })
})

describe('AvailabilityPickerModal - dateOnly 與 allowedDates', () => {
  function mountDateOnly(props = {}) {
    return mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-08-01',
        rangeEnd: '2026-09-02',
        dateOnly: true,
        allowedDates: ['2026-08-01', '2026-08-03', '2026-09-02'],
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  function findDay(wrapper, day) {
    return wrapper
      .find('.grid-cols-7')
      .findAll('div')
      .find((cell) => cell.text() === String(day))
  }

  test('Scenario C join uses a date-only availability picker', () => {
    const wrapper = mountDateOnly()

    expect(wrapper.text()).not.toContain('← 選取日期')
    expect(wrapper.text()).not.toContain('指定時段')
    expect(wrapper.text()).not.toContain('＋ 新增時段')
    expect(wrapper.find('.time-picker-wrap').exists()).toBe(false)
    expect(wrapper.text()).toContain('尚未選取任何日期')
  })

  test('allowedDates 只允許非連續候選日期可選，非候選日期 disabled 且點擊不會進入 selectedDates', async () => {
    const wrapper = mountDateOnly()

    await findDay(wrapper, 2).trigger('mousedown')
    expect(wrapper.vm.selectedDates).toEqual({})

    await findDay(wrapper, 3).trigger('mousedown')
    expect(Object.keys(wrapper.vm.selectedDates)).toEqual(['2026-08-03'])

    await wrapper.find('[aria-label="下一個月"]').trigger('click')
    await findDay(wrapper, 2).trigger('mousedown')
    expect(Object.keys(wrapper.vm.selectedDates)).toEqual(['2026-08-03', '2026-09-02'])
  })

  test('Participant confirms without dates', async () => {
    const wrapper = mountDateOnly()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.emitted('update:modelValue')).toBeUndefined()
    expect(wrapper.text()).toContain('請至少選擇一天')
  })

  test('Date-only picker shows fixed activity time and date-language title', () => {
    const wrapper = mountDateOnly({ fixedTimeLabel: '下午 7:00 – 下午 9:00' })

    expect(wrapper.text()).not.toContain('選取有空時間')
    expect(wrapper.text()).toContain('選擇可參加日期')
    expect(wrapper.text()).toContain('活動時間：下午 7:00 – 下午 9:00')
    expect(wrapper.text()).not.toContain('活動日期範圍')
    expect(wrapper.find('.time-picker-wrap').exists()).toBe(false)

    const allDayWrapper = mountDateOnly({ fixedTimeLabel: '整日' })
    expect(allDayWrapper.text()).toContain('活動時間：整日')
    expect(allDayWrapper.find('.time-picker-wrap').exists()).toBe(false)
  })

  test('Date-only picker summary shows selected chips and day count', async () => {
    const wrapper = mountDateOnly()

    await findDay(wrapper, 3).trigger('mousedown')
    expect(wrapper.text()).toContain('已選 1 天')

    await wrapper.find('[aria-label="下一個月"]').trigger('click')
    await findDay(wrapper, 2).trigger('mousedown')
    expect(wrapper.text()).toContain('已選 2 天')
  })

  test('已選日期只有一種樣式，不會因為是不是「最後點的」而顏色不同', async () => {
    const wrapper = mountDateOnly()

    await findDay(wrapper, 1).trigger('mousedown')
    await findDay(wrapper, 3).trigger('mousedown')

    expect(findDay(wrapper, 1).classes()).toEqual(findDay(wrapper, 3).classes())
  })

  test('點擊已選但不是最後點的日期，一次點擊就直接移除，不用先切成作用中再點一次', async () => {
    const wrapper = mountDateOnly()

    await findDay(wrapper, 1).trigger('mousedown')
    await findDay(wrapper, 3).trigger('mousedown')
    // 此時 8/3 是最後點的，8/1 不是——點一次 8/1 應該直接移除
    await findDay(wrapper, 1).trigger('mousedown')

    expect(Object.keys(wrapper.vm.selectedDates)).toEqual(['2026-08-03'])
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

    // 有設時段範圍時預設直接顯示時段編輯器（不再是整天有空），不用先點「指定時段」
    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    // 開始時間選單排除窗口終點本身（14:00）——選了終點當開始時間會沒有合法的結束時間可搭配
    const options = wrapper.findAll('button[data-hour]').map((o) => o.text())
    expect(options).toEqual(['上午 10:00', '上午 11:00', '下午 12:00', '下午 1:00'])
  })

  test('情境二/三（全域 timeWindow）選超出範圍的時段，送出前也會被攔下，不用等後端 400', async () => {
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

    // 繞過下拉選單直接塞一筆超出全域 timeWindow 的資料，模擬程式化寫入（例如預填舊資料）的情況
    wrapper.vm.selectedDates['2026-06-12'] = [{ from: '10:00', to: '15:00', endTimeUserSet: true }]
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.text()).toContain('超出候選時段範圍')
  })
})

describe('AvailabilityPickerModal - 有設時段範圍時預設直接顯示該時段，不是整天有空', () => {
  test('預設的候選時段就是創建者設定的 timeWindowStart~timeWindowEnd，不是硬寫的 09:00-17:00', () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).not.toContain('整天有空')
    expect(wrapper.text()).not.toContain('指定時段')
    expect(wrapper.text()).toContain('下午 1:00')
    expect(wrapper.text()).toContain('下午 5:00')
    expect(wrapper.text()).toContain('6/12 13:00–17:00')
  })

  test('沒有設時段範圍時維持現況：預設整天有空', () => {
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

    expect(wrapper.text()).toContain('整天有空')
    expect(wrapper.text()).toContain('指定時段')
  })

  test('移除唯一一筆候選時段後，回到創建者設定的時段範圍，不會變成「選取日期」提示', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const removeButton = wrapper.findAll('button').find((b) => b.text() === '✕')
    await removeButton.trigger('click')

    expect(wrapper.text()).not.toContain('← 選取日期')
    expect(wrapper.text()).toContain('下午 1:00')
    expect(wrapper.text()).toContain('下午 5:00')
  })
})

describe('AvailabilityPickerModal - 頂部標題依情境顯示正確內容', () => {
  test('fixedDate 且有設時段範圍時，顯示活動時間而非活動日期範圍', () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).toContain('活動時間：6/12')
    expect(wrapper.text()).toContain('下午 1:00 – 下午 5:00')
    expect(wrapper.text()).not.toContain('活動日期範圍')
  })

  test('fixedDate 但沒設時段範圍時，只顯示活動日期', () => {
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

    expect(wrapper.text()).toContain('活動時間：6/12')
    expect(wrapper.text()).not.toContain('活動日期範圍')
  })

  test('沒有 fixedDate 時維持現況：顯示活動日期範圍', () => {
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

    expect(wrapper.text()).toContain('活動日期範圍：2026-06-11 — 2026-06-17')
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
    const startOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '上午 1:00')
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

describe('AvailabilityPickerModal - 報名時段不可以重疊或重複', () => {
  function mountCustom(props = {}) {
    return mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '16:00',
        timeWindowEnd: '23:00',
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  test('第一筆時段結束時間改短後，點「+ 新增時段」新增的第二筆不會跟第一筆重疊', async () => {
    const wrapper = mountCustom()

    let startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    let startOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '下午 6:00')
    await startOption.trigger('click')

    const endButtons = wrapper.findAll('.time-picker-wrap button')
    await endButtons[1].trigger('click')
    const endOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '下午 9:00')
    await endOption.trigger('click')

    const addButton = wrapper.findAll('button').find((b) => b.text() === '＋ 新增時段')
    await addButton.trigger('click')

    const ranges = wrapper.vm.selectedDates['2026-06-12']
    expect(ranges).toHaveLength(2)
    expect(ranges[1]).not.toEqual(ranges[0])
    expect(ranges[1].from >= ranges[0].to).toBe(true)
  })

  test('兩筆時段重疊時，點「確認報名」會顯示錯誤訊息、不會送出', async () => {
    const wrapper = mountCustom()

    wrapper.vm.selectedDates['2026-06-12'] = [
      { from: '18:00', to: '21:00', endTimeUserSet: true },
      { from: '18:00', to: '21:00', endTimeUserSet: true },
    ]
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.text()).toContain('重疊或重複')
  })

  test('兩筆時段前後銜接（不重疊）時，點「確認報名」正常送出', async () => {
    const wrapper = mountCustom()

    wrapper.vm.selectedDates['2026-06-12'] = [
      { from: '18:00', to: '19:00', endTimeUserSet: true },
      { from: '19:00', to: '21:00', endTimeUserSet: true },
    ]
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.text()).not.toContain('重疊或重複')
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

describe('AvailabilityPickerModal - 下拉選單自動判斷往上/往下展開，並夾在視窗內', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('觸發按鈕貼近視窗底部時，選單改往上展開（有 bottom、沒有 top）', async () => {
    // 邊界改成以彈窗卡片（.bujo-modal-panel）為準，所以要分別給卡片跟按鈕
    // 各自合理的座標，不能再用單一 mockReturnValue 讓兩者共用同一個矩形
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('bujo-modal-panel')) {
        return { top: 50, bottom: 750, left: 50, right: 974, width: 924, height: 700 }
      }
      if (this.classList.contains('time-picker-wrap')) {
        return { top: 700, bottom: 730, left: 20, right: 150, width: 130, height: 30 }
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
    })

    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    const panel = wrapper.find('button[data-hour]').element.parentElement
    expect(panel.style.bottom).not.toBe('')
    expect(panel.style.top).toBe('')
  })

  test('觸發按鈕貼近視窗右緣時，選單水平位置會被夾在彈窗卡片內', async () => {
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('bujo-modal-panel')) {
        return { top: 50, bottom: 750, left: 50, right: 974, width: 924, height: 700 }
      }
      if (this.classList.contains('time-picker-wrap')) {
        return { top: 100, bottom: 130, left: 950, right: 1080, width: 130, height: 30 }
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
    })

    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    const panel = wrapper.find('button[data-hour]').element.parentElement
    const left = parseInt(panel.style.left)
    // 夾住的邊界是彈窗卡片的 right(974)，不是整個瀏覽器視窗
    expect(left).toBeLessThanOrEqual(974 - 130 - 8)
  })
})

describe('AvailabilityPickerModal - 下拉選單定位用的是被點擊按鈕本身的位置，不是元件根節點', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('點擊開始時間按鈕時，選單位置依這顆按鈕自己的座標算，不是隨便哪個元素的座標', async () => {
    // 每個元素的 getBoundingClientRect 都回傳「跟自己 tag 名稱有關」的獨特座標，
    // 藉此驗證真的是用「被點擊的那個按鈕的 wrapper」去算位置——如果程式碼不小心
    // 抓到別的元素（例如整個元件的根節點），算出來的 left 就不會是這裡預期的值
    vi.spyOn(HTMLElement.prototype, 'getBoundingClientRect').mockImplementation(function () {
      if (this.classList.contains('time-picker-wrap')) {
        return { top: 300, bottom: 330, left: 222, right: 352, width: 130, height: 30 }
      }
      // 邊界矩形給整個視窗大小，確保這個測試只驗證「用的是哪個元素的座標」，
      // 不會因為邊界矩形夾住而讓 left 斷言失真
      if (this.classList.contains('bujo-modal-panel')) {
        return { top: 0, bottom: 768, left: 0, right: 1024, width: 1024, height: 768 }
      }
      return { top: 0, bottom: 0, left: 0, right: 0, width: 0, height: 0 }
    })

    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    const panel = wrapper.find('button[data-hour]').element.parentElement
    expect(panel.style.left).toBe('222px')
  })
})

describe('AvailabilityPickerModal - 捲動選單自己的選項列表不應該把選單關掉', () => {
  // window 上的 scroll 監聽器要用 capture:true 才能抓到 .time-picker-panel 自己的捲動，
  // 但 capture phase 只有在被掛載的節點真的接在 document 底下才會經過 window——
  // 預設 mount() 是掛在跟 document 沒有連接的容器，事件不會傳到 window，
  // 這樣測試不管有沒有修好都會通過（沒抓到真的行為），所以這裡一定要 attachTo: document.body
  test('在 .time-picker-panel 內捲動時選單維持開啟', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
      attachTo: document.body,
    })

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    expect(wrapper.find('.time-picker-panel').exists()).toBe(true)

    const panelEl = wrapper.find('.time-picker-panel').element
    panelEl.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.time-picker-panel').exists()).toBe(true)

    wrapper.unmount()
  })

  test('在選單以外的地方捲動時選單會關閉', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
      attachTo: document.body,
    })

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')
    expect(wrapper.find('.time-picker-panel').exists()).toBe(true)

    document.body.dispatchEvent(new Event('scroll'))
    await wrapper.vm.$nextTick()

    expect(wrapper.find('.time-picker-panel').exists()).toBe(false)

    wrapper.unmount()
  })
})

describe('AvailabilityPickerModal - dateWindows 依日期限制可選小時（情境四）', () => {
  test('單一窗口時下拉選單只提供窗口內的小時', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        dateWindows: {
          '2026-06-12': { start: '14:00', end: '16:00', slotId: 'slot-1' },
        },
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    // 開始時間選單排除窗口終點本身（16:00）——選了終點當開始時間會沒有合法的結束時間可搭配
    const options = wrapper.findAll('button[data-hour]').map((o) => o.text())
    expect(options).toEqual(['下午 2:00', '下午 3:00'])
  })

  test('候選時段窗口 01:00-07:00 時，開始時間選單不能選到窗口終點 07:00，選 06:00 自動帶入的結束時間 clamp 在 07:00', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        dateWindows: {
          '2026-06-12': { start: '01:00', end: '07:00', slotId: 'slot-1' },
        },
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    let startButtons = wrapper.findAll('.time-picker-wrap button')
    await startButtons[0].trigger('click')

    const startOptionTexts = wrapper.findAll('button[data-hour]').map((o) => o.text())
    expect(startOptionTexts).not.toContain('上午 7:00')

    const startOption = wrapper.findAll('button[data-hour]').find((o) => o.text() === '上午 6:00')
    await startOption.trigger('click')

    startButtons = wrapper.findAll('.time-picker-wrap button')
    // clamp 在窗口終點 07:00，不是天真的 6:00+1小時算出來的值（這裡剛好也是 7:00，
    // 但關鍵是上面已經確認 07:00 選不到，所以這個結果是 clamp 出來的，不是選到終點再 +1）
    expect(startButtons[1].text()).toBe('上午 7:00')

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')
    expect(wrapper.text()).not.toContain('超出候選時段範圍')
    expect(wrapper.emitted('confirm')).toBeTruthy()
  })
})

describe('AvailabilityPickerModal - dateWindows 預設值與整天分支（情境四）', () => {
  test('選取有 dateWindows 的候選日期，預設帶入該窗口的完整範圍', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        allowedDates: ['2026-06-12'],
        dateWindows: {
          '2026-06-12': { start: '14:00', end: '16:00', slotId: 'slot-1' },
        },
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    const day = wrapper
      .find('.grid-cols-7')
      .findAll('div')
      .find((cell) => cell.text() === '12')
    await day.trigger('mousedown')
    window.dispatchEvent(new Event('mouseup'))
    await wrapper.vm.$nextTick()

    expect(wrapper.vm.selectedDates['2026-06-12']).toEqual([
      { from: '14:00', to: '16:00', endTimeUserSet: false },
    ])
    expect(wrapper.vm.isAllDay('2026-06-12')).toBe(false)
  })
})

describe('AvailabilityPickerModal - dateWindows 窗口 fit 驗證（情境四）', () => {
  function mountWithWindow(props = {}) {
    return mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        dateWindows: {
          '2026-06-12': { start: '14:00', end: '16:00', slotId: 'slot-1' },
        },
        ...props,
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  test('選取超出窗口範圍的時段時 handleConfirm 不送出、顯示對應日期的錯誤', async () => {
    const wrapper = mountWithWindow()

    wrapper.vm.selectedDates['2026-06-12'] = [{ from: '15:00', to: '17:00', endTimeUserSet: true }]
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.text()).toContain('超出候選時段範圍')
  })

  test('完整落在窗口內的子區間可以正常送出', async () => {
    const wrapper = mountWithWindow()

    wrapper.vm.selectedDates['2026-06-12'] = [{ from: '14:30', to: '15:30', endTimeUserSet: true }]
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeTruthy()
    expect(wrapper.emitted('confirm')[0][0]).toEqual([
      { date: '2026-06-12', allDay: false, timeRanges: [{ from: '14:30', to: '15:30', endTimeUserSet: true }] },
    ])
  })
})

describe('AvailabilityPickerModal - 已選清單一次標出所有有問題的日期', () => {
  function mountWithTwoWindows() {
    return mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        allowedDates: ['2026-06-12', '2026-06-14'],
        dateWindows: {
          '2026-06-12': { start: '14:00', end: '16:00', slotId: 'slot-1' },
          '2026-06-14': { start: '09:00', end: '11:00', slotId: 'slot-2' },
        },
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })
  }

  test('兩個日期同時都有超出窗口的問題時，confirmError 一次列出兩個日期，不是只找第一個', async () => {
    const wrapper = mountWithTwoWindows()

    wrapper.vm.selectedDates['2026-06-12'] = [{ from: '14:00', to: '17:00', endTimeUserSet: true }]
    wrapper.vm.selectedDates['2026-06-14'] = [{ from: '09:00', to: '12:00', endTimeUserSet: true }]
    await wrapper.vm.$nextTick()

    const confirmButton = wrapper.findAll('button').find((b) => b.text() === '確認報名')
    await confirmButton.trigger('click')

    expect(wrapper.emitted('confirm')).toBeUndefined()
    expect(wrapper.text()).toContain('6/12')
    expect(wrapper.text()).toContain('6/14')
  })

  test('有問題的日期，已選清單的 chip 會有錯誤標記', async () => {
    const wrapper = mountWithTwoWindows()

    wrapper.vm.selectedDates['2026-06-12'] = [{ from: '14:00', to: '17:00', endTimeUserSet: true }]
    wrapper.vm.selectedDates['2026-06-14'] = [{ from: '09:00', to: '10:00', endTimeUserSet: true }]
    await wrapper.vm.$nextTick()

    const chips = wrapper.findAll('.border-t.border-\\[var\\(--bujo-line\\)\\] button')
    const badChip = chips.find((c) => c.text().includes('6/12'))
    const goodChip = chips.find((c) => c.text().includes('6/14'))

    expect(badChip.classes().join(' ')).toContain('dc2626')
    expect(goodChip.classes().join(' ')).not.toContain('dc2626')
  })
})

describe('AvailabilityPickerModal - 關閉再重新開啟時，fixedDate 模式要回到預設時段，不是空白的選取日期畫面', () => {
  test('點擊關閉按鈕後 modelValue 變 false，重新變 true 時仍顯示預設時段而非「← 選取日期」', async () => {
    const wrapper = mount(AvailabilityPickerModal, {
      props: {
        modelValue: true,
        rangeStart: '2026-06-11',
        rangeEnd: '2026-06-17',
        fixedDate: '2026-06-12',
        timeWindowStart: '13:00',
        timeWindowEnd: '17:00',
      },
      global: {
        stubs: {
          Teleport: true,
        },
      },
    })

    expect(wrapper.text()).not.toContain('選取日期')
    const textBeforeClose = wrapper.text()

    await wrapper.find('[aria-label="關閉選取有空時間"]').trigger('click')
    expect(wrapper.emitted('update:modelValue')[0]).toEqual([false])

    await wrapper.setProps({ modelValue: false })
    await wrapper.setProps({ modelValue: true })

    expect(wrapper.text()).not.toContain('選取日期')
    expect(wrapper.text()).toBe(textBeforeClose)
  })
})
