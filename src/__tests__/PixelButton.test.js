import { mount } from '@vue/test-utils'
import { describe, expect, test, vi } from 'vitest'
import PixelButton from '@/components/ui/PixelButton.vue'

describe('PixelButton', () => {
  test('點擊時立即執行外部 click handler，不等待動畫結束', async () => {
    const handleClick = vi.fn()
    const wrapper = mount(PixelButton, {
      attrs: {
        onClick: handleClick,
      },
      slots: {
        default: '報名參加',
      },
    })

    await wrapper.find('button').trigger('click')

    expect(handleClick).toHaveBeenCalledTimes(1)

    await wrapper.find('button').trigger('animationend')

    expect(handleClick).toHaveBeenCalledTimes(1)
  })
})
