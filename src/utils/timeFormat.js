// 全站時間選取器/時間顯示共用的格式化與解析邏輯，統一採用零填充 24 小時制「HH:00」
// （例如 09:00、23:00），取代原本分散在 EventPage.vue / AvailabilityPickerModal.vue /
// ActivityDetailModal.vue 三處各自實作的「上午/下午 H:MM」格式。

export function formatHourAsTimeString(hour) {
  return `${String(hour).padStart(2, '0')}:00`
}

export function createTimeOptions() {
  return Array.from({ length: 24 }, (_, hour) => formatHourAsTimeString(hour))
}

export function parseHourFromTimeStr(timeStr) {
  const match = timeStr?.match(/^(\d{2}):(\d{2})$/)
  if (!match) return -1
  return Number(match[1])
}

function parseDateOnly(dateStr) {
  const match = dateStr?.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
  if (!match) return null

  const year = Number(match[1])
  const month = Number(match[2]) - 1
  const day = Number(match[3])
  const date = new Date(year, month, day)

  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    return null
  }

  return date
}

export function parseDateTimeValue(dateStr, timeStr) {
  if (!timeStr) return null
  const date = parseDateOnly(dateStr)
  if (!date) return null
  const match = timeStr.match(/^(\d{2}):(\d{2})$/)
  if (!match) return null
  date.setHours(Number(match[1]), Number(match[2]), 0, 0)
  return date
}
