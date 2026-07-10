<template>
  <BaseModal
    :isOpen="modelValue"
    title="選取有空時間"
    :scrollable="!fixedDate"
    :max-width="fixedDate ? '440px' : '800px'"
    @close="close"
  >
    <div
      class="font-nunito flex flex-col -mx-5 -my-4"
      :class="fixedDate ? '' : 'h-[70vh] md:h-[550px] overflow-hidden'"
    >
      <!-- Activity range -->
      <div
        class="bg-[var(--bujo-surface-muted)] border-b border-[var(--bujo-line-soft)] px-4 py-1.5 shrink-0 text-[12px] font-bold text-[var(--bujo-muted-strong)]"
      >
        <template v-if="fixedDate">
          活動時間：{{ formatChip(fixedDate)
          }}{{ hasTimeWindow ? `　${toLabel(timeWindowStart)} – ${toLabel(timeWindowEnd)}` : '' }}
        </template>
        <template v-else> 活動日期範圍：{{ rangeStart }} — {{ rangeEnd }} </template>
      </div>

      <!-- Body -->
        <div
          class="flex md:flex-row flex-col flex-1 min-h-0"
          :class="fixedDate ? '' : 'overflow-y-auto md:overflow-hidden'"
        >
          <!-- 日曆區：fixedDate 模式下不渲染，只顯示固定日期的時段選取面板 -->
          <div
            v-if="!fixedDate"
            class="border-b md:border-b-0 md:border-r border-[var(--bujo-line-soft)] p-3 md:p-4 w-full md:flex-1 flex flex-col"
          >
            <!-- 月份標題 -->
            <div class="flex items-center justify-between mb-2 shrink-0">
              <span class="text-[13px] md:text-base font-bold text-[var(--bujo-ink)]">
                {{ calYear }} / {{ calMonth }}
              </span>
            </div>

            <!-- 格線：flex-1 讓格子填滿剩餘高度 -->
            <div
              class="grid grid-cols-7 gap-0.5 md:gap-1 md:flex-1 md:min-h-0"
              :style="{ gridTemplateRows: `auto repeat(${calRows}, 1fr)` }"
            >
              <div
                v-for="d in DOW_LABELS"
                :key="d"
                class="text-xs md:text-[13px] font-bold text-[var(--bujo-muted-strong)] text-center flex items-end justify-center pb-1"
              >
                {{ d }}
              </div>

              <div v-for="i in firstDayOffset" :key="'e' + i"></div>

              <div
                v-for="day in daysInMonth"
                :key="day"
                :class="dayClass(day)"
                @mousedown.prevent="onDayMousedown(day)"
                @mouseover="onDayMouseover(day)"
              >
                {{ day }}
              </div>
            </div>
          </div>

          <!-- 時段面板 -->
          <div class="p-4 min-w-0 md:flex-1" :class="fixedDate ? '' : 'md:overflow-y-auto'">
            <!-- 無聚焦日期 -->
            <div
              v-if="!activeDate || !(activeDate in selectedDates)"
              class="text-[11px] text-[var(--bujo-muted)] py-8 text-center border border-dashed border-[var(--bujo-line-soft)]"
            >
              ← 選取日期
            </div>

            <template v-else>
              <!-- 日期標題 -->
              <div class="flex items-center gap-2 mb-1">
                <span class="w-2 h-2 bg-[var(--bujo-accent)] shrink-0 inline-block"></span>
                <span class="font-bold text-[13px] md:text-sm text-[var(--bujo-ink)]">
                  {{ formatChip(activeDate) }}
                </span>
              </div>

              <!-- 整天狀態 -->
              <div
                v-if="isAllDay(activeDate)"
                class="bg-[var(--bujo-surface-muted)] border border-[var(--bujo-line)] px-3 py-2 flex items-center justify-between mb-2"
              >
                <span class="text-[12px] md:text-[13px] font-bold text-[var(--bujo-ink)]">
                  整天有空
                </span>
                <button
                  @click="startCustom"
                  class="text-[11px] md:text-xs font-bold border border-[var(--bujo-line)] px-2 py-1 transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                >
                  指定時段
                </button>
              </div>

              <!-- 時段列表 -->
              <template v-else>
                <div class="flex flex-col gap-2 mb-2 pr-1">
                  <div
                    v-for="(range, i) in selectedDates[activeDate]"
                    :key="i"
                    class="flex items-center gap-1.5 shrink-0 min-w-0"
                  >
                    <div class="relative time-picker-wrap flex-1 min-w-0" @click.stop>
                      <button
                        class="w-full border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-1.5 py-1.5 font-bold text-[var(--bujo-ink)] text-[13px] outline-none transition-colors duration-150 hover:border-[var(--bujo-accent)] text-left"
                        :class="{ 'border-[var(--bujo-accent)]': activeTimePicker === `from-${i}` }"
                        type="button"
                        @click="openTimePicker(`from-${i}`, $event.currentTarget.parentElement)"
                      >
                        {{ toLabel(range.from) }}
                      </button>
                      <div
                        v-if="activeTimePicker === `from-${i}`"
                        class="time-picker-panel fixed z-50 border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] shadow-[7px_8px_0_rgb(var(--bujo-ink-rgb)/0.06)] overflow-y-auto"
                        :style="pickerStyle"
                      >
                        <button
                          v-for="opt in startHourOptions"
                          :key="opt.value"
                          :data-hour="parseInt(opt.value)"
                          class="block w-full px-2 py-1.5 text-left text-[12px] font-bold border-b border-[var(--bujo-line-soft)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--bujo-surface-muted)]"
                          :class="
                            range.from === opt.value
                              ? 'bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
                              : 'text-[var(--bujo-muted-strong)] bg-[var(--bujo-surface)]'
                          "
                          type="button"
                          @click="selectRangeStart(range, opt.value)"
                        >
                          {{ opt.label }}
                        </button>
                      </div>
                    </div>
                    <span class="text-[12px] text-[var(--bujo-muted-strong)] font-bold shrink-0"
                      >→</span
                    >
                    <div class="relative time-picker-wrap flex-1 min-w-0" @click.stop>
                      <button
                        class="w-full border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-1.5 py-1.5 font-bold text-[var(--bujo-ink)] text-[13px] outline-none transition-colors duration-150 hover:border-[var(--bujo-accent)] text-left"
                        :class="{ 'border-[var(--bujo-accent)]': activeTimePicker === `to-${i}` }"
                        type="button"
                        @click="openTimePicker(`to-${i}`, $event.currentTarget.parentElement)"
                      >
                        {{ toLabel(range.to) }}
                      </button>
                      <div
                        v-if="activeTimePicker === `to-${i}`"
                        class="time-picker-panel fixed z-50 border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] shadow-[7px_8px_0_rgb(var(--bujo-ink-rgb)/0.06)] overflow-y-auto"
                        :style="pickerStyle"
                      >
                        <button
                          v-for="opt in endHourOptionsFor(range)"
                          :key="opt.value"
                          :data-hour="parseInt(opt.value)"
                          class="block w-full px-2 py-1.5 text-left text-[12px] font-bold border-b border-[var(--bujo-line-soft)] last:border-b-0 transition-colors duration-150 hover:bg-[var(--bujo-surface-muted)]"
                          :class="
                            range.to === opt.value
                              ? 'bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
                              : 'text-[var(--bujo-muted-strong)] bg-[var(--bujo-surface)]'
                          "
                          type="button"
                          @click="selectRangeEnd(range, opt.value)"
                        >
                          {{ opt.label }}
                        </button>
                      </div>
                    </div>
                    <button
                      @click="removeRange(i)"
                      class="w-6 h-6 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-[var(--bujo-muted-strong)] text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors duration-150 hover:border-[#dc2626] hover:text-[#dc2626]"
                    >
                      ✕
                    </button>
                  </div>
                </div>

                <button
                  @click="addRange"
                  class="w-full text-[11px] font-bold text-[var(--bujo-muted-strong)] border border-dashed border-[var(--bujo-line)] py-1.5 transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                >
                  ＋ 新增時段
                </button>

                <button
                  v-if="!hasTimeWindow"
                  @click="resetAllDay"
                  class="mt-2 text-[10px] text-[var(--bujo-muted)] transition-colors duration-150 hover:text-[var(--bujo-ink)] block"
                >
                  ↩ 改回整天有空
                </button>
              </template>
            </template>
          </div>
        </div>

        <!-- Summary strip -->
        <div
          class="border-t border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] px-4 py-2 shrink-0 min-h-[36px] max-h-[70px] overflow-y-auto"
        >
          <div class="flex items-start gap-2 flex-wrap">
            <span
              v-if="!summaryItems.length"
              class="text-[10px] md:text-[12px] text-[var(--bujo-muted)]"
            >
              尚未選取任何時段
            </span>
            <template v-else>
              <span
                class="flex items-center text-[10px] md:text-[12px] font-black text-[var(--bujo-muted-strong)] shrink-0"
                >已選：</span
              >
              <button
                v-for="item in summaryItems"
                :key="item.chip"
                @click="activeDate = item.date"
                class="text-[10px] md:text-[12px] font-bold px-2 py-0.5 border transition-colors duration-150"
                :class="
                  activeDate === item.date
                    ? 'bg-[var(--bujo-ink)] text-[var(--bujo-white)] border-[var(--bujo-ink)]'
                    : 'bg-[var(--bujo-surface)] text-[var(--bujo-ink)] border-[var(--bujo-line)] hover:border-[var(--bujo-ink)]'
                "
              >
                {{ item.chip }} {{ item.label }}
              </button>
            </template>
          </div>
        </div>
      </div>
    <template #footer>
      <PixelButton variant="white" type="button" @click="close">取消</PixelButton>
      <PixelButton type="button" @click="handleConfirm">確認報名</PixelButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onUnmounted, nextTick } from 'vue'
import PixelButton from './ui/PixelButton.vue'
import BaseModal from './ui/BaseModal.vue'

const props = defineProps({
  modelValue: Boolean,
  rangeStart: { type: String, default: '2026-07-10' },
  rangeEnd: { type: String, default: '2026-07-16' },
  fixedDate: { type: String, default: null },
  timeWindowStart: { type: String, default: null },
  timeWindowEnd: { type: String, default: null },
})
const emit = defineEmits(['update:modelValue', 'confirm'])

// ── 狀態 ──
const hasTimeWindow = computed(() => !!(props.timeWindowStart && props.timeWindowEnd))

// 有設時段範圍（timeWindowStart/timeWindowEnd）時，「預設」代表整個時段範圍都有空，
// 不是無邊界的「整天有空」——創建者已經限制過參與者能回報的時間，兩者意義不同
function defaultDayValue() {
  if (hasTimeWindow.value) {
    return [{ from: props.timeWindowStart, to: props.timeWindowEnd, endTimeUserSet: false }]
  }
  return null
}

// key = 'YYYY-MM-DD', value = null（整天）或 [{from,to},...]
const selectedDates = ref(props.fixedDate ? { [props.fixedDate]: defaultDayValue() } : {})
const activeDate = ref(props.fixedDate ?? null)
const dragState = reactive({ active: false, startDate: null, hovering: new Set() })

// ── 日曆 computed ──
const DOW_LABELS = ['一', '二', '三', '四', '五', '六', '日']

const calYear = computed(() => parseInt(props.rangeStart.split('-')[0]))
const calMonth = computed(() => parseInt(props.rangeStart.split('-')[1]))

const firstDayOffset = computed(() => {
  const d = new Date(calYear.value, calMonth.value - 1, 1).getDay()
  return d === 0 ? 6 : d - 1
})

const daysInMonth = computed(() => new Date(calYear.value, calMonth.value, 0).getDate())

const rangeStartDay = computed(() => parseInt(props.rangeStart.split('-')[2]))
const rangeEndDay = computed(() => parseInt(props.rangeEnd.split('-')[2]))
const calRows = computed(() => Math.ceil((firstDayOffset.value + daysInMonth.value) / 7))

function toDateKey(day) {
  return `${calYear.value}-${String(calMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatChip(dateKey) {
  const parts = dateKey.split('-')
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`
}

// ── 日期格樣式 ──
function dayClass(day) {
  const inRange = day >= rangeStartDay.value && day <= rangeEndDay.value
  const key = toDateKey(day)
  const sel = key in selectedDates.value
  const isActive = activeDate.value === key
  const isDragHov = dragState.active && dragState.hovering.has(day)

  if (!inRange)
    return 'text-[13px] md:text-[14px] font-bold text-center border border-transparent text-[var(--bujo-muted)] cursor-default h-full min-h-[36px] flex items-center justify-center'

  return [
    'text-[13px] md:text-[14px] font-bold text-center border cursor-pointer transition-colors select-none h-full min-h-[36px] flex items-center justify-center',
    !sel && !isDragHov
      ? 'bg-[var(--bujo-surface)] border-[var(--bujo-line-soft)] text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)] hover:border-[var(--bujo-ink)]'
      : '',
    isDragHov && !sel ? 'bg-[var(--bujo-surface-muted)] border-[var(--bujo-accent)]' : '',
    sel && !isActive
      ? 'bg-[var(--bujo-accent)] text-[var(--bujo-ink)] border-[var(--bujo-ink)]'
      : '',
    sel && isActive ? 'bg-[var(--bujo-ink)] text-[var(--bujo-white)] border-[var(--bujo-ink)]' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

// ── 拖曳選取 ──
function onDayMousedown(day) {
  const inRange = day >= rangeStartDay.value && day <= rangeEndDay.value
  if (!inRange) return

  const key = toDateKey(day)
  if (key in selectedDates.value) {
    if (activeDate.value === key) {
      activeDate.value = null
      delete selectedDates.value[key]
    } else {
      activeDate.value = key
    }
    return
  }

  dragState.active = true
  dragState.startDate = day
  dragState.hovering = new Set([day])
}

function onDayMouseover(day) {
  if (!dragState.active) return
  const inRange = day >= rangeStartDay.value && day <= rangeEndDay.value
  if (!inRange) return

  const lo = Math.min(dragState.startDate, day)
  const hi = Math.max(dragState.startDate, day)
  dragState.hovering = new Set()
  for (let d = lo; d <= hi; d++) {
    if (d >= rangeStartDay.value && d <= rangeEndDay.value) dragState.hovering.add(d)
  }
}

function onMouseup() {
  if (!dragState.active) return

  dragState.hovering.forEach((day) => {
    const key = toDateKey(day)
    if (!(key in selectedDates.value)) {
      selectedDates.value[key] = null
    }
  })

  const last = Math.max(...dragState.hovering)
  activeDate.value = toDateKey(last)

  dragState.active = false
  dragState.hovering = new Set()
}

onMounted(() => {
  window.addEventListener('mouseup', onMouseup)
  document.addEventListener('click', handleDocumentClickTimePicker)
  window.addEventListener('resize', handleWindowResize)
  // capture: true——scroll 不會冒泡，日曆模式彈窗內部 overflow-y-auto 容器的捲動要在 capture 階段才抓得到
  window.addEventListener('scroll', handleScrollClose, true)
})
onUnmounted(() => {
  window.removeEventListener('mouseup', onMouseup)
  document.removeEventListener('click', handleDocumentClickTimePicker)
  window.removeEventListener('resize', handleWindowResize)
  window.removeEventListener('scroll', handleScrollClose, true)
})

// ── 時段操作 ──
function isAllDay(dateKey) {
  const val = selectedDates.value[dateKey]
  return val === null || (Array.isArray(val) && val.length === 0)
}

function startCustom() {
  selectedDates.value[activeDate.value] = [{ from: '09:00', to: '17:00', endTimeUserSet: false }]
}

function addRange() {
  if (!Array.isArray(selectedDates.value[activeDate.value])) {
    selectedDates.value[activeDate.value] = []
  }
  const fallback = hasTimeWindow.value
    ? { from: props.timeWindowStart, to: props.timeWindowEnd }
    : { from: '09:00', to: '17:00' }
  selectedDates.value[activeDate.value].push({ ...fallback, endTimeUserSet: false })
}

function removeRange(i) {
  selectedDates.value[activeDate.value].splice(i, 1)
  if (selectedDates.value[activeDate.value].length === 0) {
    selectedDates.value[activeDate.value] = defaultDayValue()
  }
}

function resetAllDay() {
  selectedDates.value[activeDate.value] = defaultDayValue()
}

const allHourOptions = Array.from({ length: 24 }, (_, hour) => {
  const period = hour < 12 ? '上午' : '下午'
  const display = String(hour % 12 || 12)
  const value = String(hour).padStart(2, '0') + ':00'
  return { label: `${period} ${display}:00`, value }
})

const hourOptions = computed(() => {
  if (!props.timeWindowStart && !props.timeWindowEnd) return allHourOptions
  return allHourOptions.filter(
    (opt) =>
      (!props.timeWindowStart || opt.value >= props.timeWindowStart) &&
      (!props.timeWindowEnd || opt.value <= props.timeWindowEnd),
  )
})

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 開始時間選單：疊加在 hourOptions（timeWindow 限制）之上，正在編輯的日期是今天時，排除已經過去的小時
const startHourOptions = computed(() => {
  if (activeDate.value !== todayKey()) return hourOptions.value
  const currentHour = new Date().getHours()
  return hourOptions.value.filter((opt) => parseInt(opt.value) > currentHour)
})

// 結束時間選單：疊加在 hourOptions 之上，排除等於或早於該筆 range 已選開始時間的選項
function endHourOptionsFor(range) {
  if (!range.from) return hourOptions.value
  return hourOptions.value.filter((opt) => opt.value > range.from)
}

const activeTimePicker = ref(null)

// ── 下拉選單浮動定位：自動判斷往上/往下展開、水平夾在視窗內 ──
const PANEL_WIDTH = 130
const PANEL_MAX_HEIGHT = 200
const PANEL_MIN_HEIGHT = 120 // 低於這個高度才考慮翻到另一邊
const VIEWPORT_MARGIN = 8 // 留白舒適：面板跟螢幕邊緣至少留這麼多
const TRIGGER_GAP = 4 // 對應原本的 calc(100%+4px)

const activePickerTriggerEl = ref(null) // 記錄目前開著的選單是哪個按鈕觸發的，resize 時要重算
const pickerStyle = reactive({
  left: '0px',
  top: null,
  bottom: null,
  width: `${PANEL_WIDTH}px`,
  maxHeight: `${PANEL_MAX_HEIGHT}px`,
})

function computePickerPosition(triggerEl) {
  const rect = triggerEl.getBoundingClientRect()

  // 選單要留在「彈窗卡片本身」的範圍內，不是整個瀏覽器視窗——不然彈窗變緊湊之後，
  // 選單雖然沒被裁切，卻會飄出卡片邊界疊在背景上。BaseModal 自己的外層卡片有
  // .bujo-modal-panel 這個 scoped class，找不到時（理論上不會發生）退回整個視窗當邊界
  const modalPanel = triggerEl.closest('.bujo-modal-panel')
  const boundary = modalPanel
    ? modalPanel.getBoundingClientRect()
    : { top: 0, bottom: window.innerHeight, left: 0, right: window.innerWidth }

  const spaceBelow = boundary.bottom - rect.bottom - TRIGGER_GAP - VIEWPORT_MARGIN
  const spaceAbove = rect.top - boundary.top - TRIGGER_GAP - VIEWPORT_MARGIN
  const openUpward = spaceBelow < PANEL_MIN_HEIGHT && spaceAbove > spaceBelow

  const maxHeight = Math.max(80, Math.min(PANEL_MAX_HEIGHT, openUpward ? spaceAbove : spaceBelow))

  let left = rect.left
  left = Math.min(left, boundary.right - PANEL_WIDTH - VIEWPORT_MARGIN)
  left = Math.max(left, boundary.left + VIEWPORT_MARGIN)

  // top/bottom 是 position: fixed 的座標，一律相對「瀏覽器視窗」本身，不是相對 boundary——
  // boundary 只用來判斷「翻不翻面」跟算 maxHeight，不能拿來當 fixed 定位的錨點，
  // 否則面板會對不準（這裡曾經寫錯成 boundary.bottom，算出來的位置整個偏掉）
  return {
    left: `${left}px`,
    top: openUpward ? null : `${rect.bottom + TRIGGER_GAP}px`,
    bottom: openUpward ? `${window.innerHeight - rect.top + TRIGGER_GAP}px` : null,
    width: `${PANEL_WIDTH}px`,
    maxHeight: `${maxHeight}px`,
  }
}

function updatePickerPosition() {
  if (!activePickerTriggerEl.value) return
  Object.assign(pickerStyle, computePickerPosition(activePickerTriggerEl.value))
}

function handleWindowResize() {
  if (activeTimePicker.value) updatePickerPosition()
}

function handleScrollClose(e) {
  if (!activeTimePicker.value) return
  // 選單自己的選項列表也是可捲動的（overflow-y-auto），使用者在裡面捲動選小時選項時
  // 不該被這個「捲動就關閉」的規則誤判成「使用者在捲背景」而把選單關掉
  if (e.target?.closest?.('.time-picker-panel')) return
  closeTimePicker()
}

function closeTimePicker() {
  activeTimePicker.value = null
  activePickerTriggerEl.value = null
}

function toLabel(value) {
  if (!value) return ''
  const hour = parseInt(value.split(':')[0])
  const period = hour < 12 ? '上午' : '下午'
  const display = String(hour % 12 || 12)
  return `${period} ${display}:00`
}

function openTimePicker(key, wrapEl) {
  const willOpen = activeTimePicker.value !== key
  activeTimePicker.value = willOpen ? key : null
  activePickerTriggerEl.value = willOpen ? wrapEl : null
  if (willOpen) {
    updatePickerPosition()
    nextTick(() => {
      const el = wrapEl?.querySelector('[data-hour="9"]')
      el?.scrollIntoView({ block: 'center' })
    })
  }
}

function selectRangeStart(range, value) {
  range.from = value
  if (range.endTimeUserSet) {
    // 使用者已經手動選過結束時間：只有在新的開始時間讓它不再合理時才清掉，不然尊重使用者的選擇
    if (range.to && range.to <= value) {
      range.to = null
      range.endTimeUserSet = false
    }
  } else {
    // 還沒手動選過結束時間：自動帶入開始時間 +1 小時，一小時是常見的活動時長，省一次選取動作；
    // 開始時間選在 23:00 時同一天內沒有合理的 +1 小時，留白讓使用者自己選
    const hour = parseInt(value.split(':')[0])
    range.to = hour === 23 ? null : `${String(hour + 1).padStart(2, '0')}:00`
  }
  closeTimePicker()
}

function selectRangeEnd(range, value) {
  range.to = value
  range.endTimeUserSet = true
  closeTimePicker()
}

function handleDocumentClickTimePicker(e) {
  if (!e.target.closest('.time-picker-wrap')) {
    closeTimePicker()
  }
}

// ── 摘要 ──
const summaryItems = computed(() =>
  Object.entries(selectedDates.value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ranges]) => ({
      date,
      chip: formatChip(date),
      label:
        !ranges || ranges.length === 0
          ? '整天'
          : ranges.map((r) => `${r.from}–${r.to}`).join(' / '),
    })),
)

// ── Modal 控制 ──
function close() {
  // 元件實例會一直存在（v-model 只是切換 BaseModal 顯不顯示，不會重新掛載），
  // 所以「關閉」要重設回跟第一次掛載時一樣的初始狀態，不能無條件清空——
  // fixedDate 模式沒有日曆可以重新選日期，清空會卡在「選取日期」這個死路
  selectedDates.value = props.fixedDate ? { [props.fixedDate]: defaultDayValue() } : {}
  activeDate.value = props.fixedDate ?? null
  emit('update:modelValue', false)
}

function handleConfirm() {
  const result = Object.entries(selectedDates.value).map(([date, ranges]) => ({
    date,
    allDay: ranges === null || ranges.length === 0,
    timeRanges: ranges ?? [],
  }))
  emit('confirm', result)
  close()
}
</script>
