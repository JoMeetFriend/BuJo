import { describe, expect, test } from 'vitest'
import {
  createTimeOptions,
  formatHourAsTimeString,
  parseDateTimeValue,
  parseHourFromTimeStr,
} from '@/utils/timeFormat'

describe('createTimeOptions', () => {
  test('回傳 24 個零填充 24 小時制選項，由 00:00 到 23:00', () => {
    const options = createTimeOptions()
    expect(options).toHaveLength(24)
    expect(options[0]).toBe('00:00')
    expect(options[23]).toBe('23:00')
  })
})

describe('formatHourAsTimeString / parseHourFromTimeStr 往返一致性', () => {
  test.each(Array.from({ length: 24 }, (_, h) => h))('小時 %i 格式化再解析回來要相等', (hour) => {
    expect(parseHourFromTimeStr(formatHourAsTimeString(hour))).toBe(hour)
  })
})

describe('parseHourFromTimeStr', () => {
  test('不符合格式的字串回傳 -1', () => {
    expect(parseHourFromTimeStr('上午 9:00')).toBe(-1)
    expect(parseHourFromTimeStr('9:00')).toBe(-1)
    expect(parseHourFromTimeStr(null)).toBe(-1)
  })
})

// 這個字面值要跟 BuJoBackend repo 的 time-picker-24-hour-format change 裡
// formatTime(9 點的 Date) 的斷言用同一個字串，兩邊各自跑但約定要保持一致，
// 前後端才不會對「9 點」這個小時各自解讀出不同的字串
describe('前後端一致性 fixture：9 點的格式化字串', () => {
  test("createTimeOptions()[9] 對應到後端 formatTime(9 點) 應輸出的同一個字串", () => {
    expect(createTimeOptions()[9]).toBe('09:00')
  })
})

describe('parseDateTimeValue', () => {
  test('把日期字串與 24 小時制時間字串組成 Date', () => {
    const date = parseDateTimeValue('2026/07/20', '09:00')
    expect(date.getFullYear()).toBe(2026)
    expect(date.getMonth()).toBe(6)
    expect(date.getDate()).toBe(20)
    expect(date.getHours()).toBe(9)
    expect(date.getMinutes()).toBe(0)
  })

  test('timeStr 為 null 時回傳 null', () => {
    expect(parseDateTimeValue('2026/07/20', null)).toBeNull()
  })

  test('dateStr 格式不正確時回傳 null', () => {
    expect(parseDateTimeValue('2026-07-20', '09:00')).toBeNull()
  })
})
