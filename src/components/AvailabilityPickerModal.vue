<template>
  <BaseModal
    :isOpen="modelValue"
    :title="dateOnly ? t('availabilityPicker.dateOnlyTitle') : t('availabilityPicker.timeTitle')"
    :scrollable="!compact"
    :max-width="dateOnly ? '480px' : fixedDate ? '440px' : '800px'"
    @close="close"
  >
    <div
      class="font-nunito flex flex-col -mx-5 -my-4"
      :class="compact ? '' : 'h-[70vh] md:h-[550px] overflow-hidden'"
    >
      <!-- Activity range -->
      <div
        class="bg-[var(--bujo-surface-muted)] border-b border-[var(--bujo-line-soft)] px-4 py-1.5 shrink-0 text-[12px] font-bold text-[var(--bujo-muted-strong)]"
      >
        <template v-if="dateOnly">
          {{ t('availabilityPicker.activityTime', { time: fixedTimeLabel }) }}
        </template>
        <template v-else-if="fixedDate">
          {{
            t('availabilityPicker.activityTimeWithWindow', {
              date: formatChip(fixedDate),
              start: toLabel(timeWindowStart),
              end: toLabel(timeWindowEnd),
            })
          }}
        </template>
        <template v-else>
          {{ t('availabilityPicker.activityDateRange', { start: rangeStart, end: rangeEnd }) }}
        </template>
      </div>

      <!-- Body -->
      <div
        class="flex md:flex-row flex-col flex-1 min-h-0"
        :class="compact ? '' : 'overflow-y-auto md:overflow-hidden'"
      >
        <!-- 日曆區：fixedDate 模式下不渲染，只顯示固定日期的時段選取面板 -->
        <div
          v-if="!fixedDate"
          class="p-3 md:p-4 w-full md:flex-1 flex flex-col"
          :class="
            dateOnly ? '' : 'border-b md:border-b-0 md:border-r border-[var(--bujo-line-soft)]'
          "
        >
          <!-- 月份標題 -->
          <div class="flex items-center justify-between mb-2 shrink-0">
            <button
              type="button"
              class="text-[13px] font-black text-[var(--bujo-muted-strong)] disabled:opacity-30"
              :disabled="!canGoPrevMonth"
              :aria-label="t('availabilityPicker.prevMonth')"
              @click="goPrevMonth"
            >
              ‹
            </button>
            <span class="text-[13px] md:text-base font-bold text-[var(--bujo-ink)]">
              {{ calYear }} / {{ calMonth }}
            </span>
            <button
              type="button"
              class="text-[13px] font-black text-[var(--bujo-muted-strong)] disabled:opacity-30"
              :disabled="!canGoNextMonth"
              :aria-label="t('availabilityPicker.nextMonth')"
              @click="goNextMonth"
            >
              ›
            </button>
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
        <div
          v-if="!dateOnly"
          class="p-4 min-w-0 md:flex-1"
          :class="fixedDate ? '' : 'md:overflow-y-auto'"
        >
          <!-- 無聚焦日期 -->
          <div
            v-if="!activeDate || !(activeDate in selectedDates)"
            class="text-[11px] text-[var(--bujo-muted)] py-8 text-center border border-dashed border-[var(--bujo-line-soft)]"
          >
            {{ t('availabilityPicker.selectDateHint') }}
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
                {{ t('availabilityPicker.allDay') }}
              </span>
              <button
                @click="startCustom"
                class="text-[11px] md:text-xs font-bold border border-[var(--bujo-line)] px-2 py-1 transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
              >
                {{ t('availabilityPicker.customTime') }}
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
                            ? 'bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
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
                            ? 'bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
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
                    class="w-6 h-6 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-[var(--bujo-muted-strong)] text-[11px] font-bold flex items-center justify-center shrink-0 transition-colors duration-150 hover:border-[var(--bujo-danger)] hover:text-[var(--bujo-danger)]"
                  >
                    ✕
                  </button>
                </div>
              </div>

              <button
                @click="addRange"
                class="w-full text-[11px] font-bold text-[var(--bujo-muted-strong)] border border-dashed border-[var(--bujo-line)] py-1.5 transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
              >
                {{ t('availabilityPicker.addTimeSlot') }}
              </button>

              <button
                v-if="!hasTimeWindow"
                @click="resetAllDay"
                class="mt-2 text-[10px] text-[var(--bujo-muted)] transition-colors duration-150 hover:text-[var(--bujo-ink)] block"
              >
                {{ t('availabilityPicker.resetAllDay') }}
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
            {{
              dateOnly
                ? t('availabilityPicker.noDatesSelected')
                : t('availabilityPicker.noTimesSelected')
            }}
          </span>
          <template v-else>
            <span
              class="flex items-center text-[10px] md:text-[12px] font-black text-[var(--bujo-muted-strong)] shrink-0"
              >{{ t('availabilityPicker.selectedLabel') }}</span
            >
            <button
              v-for="item in summaryItems"
              :key="item.chip"
              @click="activeDate = item.date"
              class="text-[10px] md:text-[12px] font-bold px-2 py-0.5 border transition-colors duration-150"
              :class="[
                problemDates.has(item.date) ? 'ring-1 ring-[var(--bujo-danger)] ring-inset' : '',
                !dateOnly && activeDate === item.date
                  ? 'bg-[var(--bujo-ink)] text-[var(--bujo-white)] border-[var(--bujo-ink)]'
                  : problemDates.has(item.date)
                    ? 'bg-[var(--bujo-surface)] text-[var(--bujo-danger)] border-[var(--bujo-danger)] hover:border-[var(--bujo-danger)]'
                    : 'bg-[var(--bujo-surface)] text-[var(--bujo-ink)] border-[var(--bujo-line)] hover:border-[var(--bujo-ink)]',
              ]"
            >
              {{ item.chip }} {{ item.label }}
            </button>
            <span
              v-if="dateOnly"
              class="flex items-center text-[10px] md:text-[12px] font-black text-[var(--bujo-muted-strong)] shrink-0"
            >
              {{ t('availabilityPicker.selectedDays', { count: summaryItems.length }) }}
            </span>
          </template>
        </div>
        <div
          v-if="confirmError"
          class="mt-1 flex items-start gap-2 border border-[var(--bujo-danger)] bg-[var(--bujo-surface)] px-2 py-1.5 text-[11px] text-[var(--bujo-danger)]"
        >
          <ExclamationTriangleIcon class="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
          {{ confirmError }}
        </div>
      </div>
    </div>
    <template #footer>
      <PixelButton variant="white" type="button" @click="close">{{
        t('availabilityPicker.cancel')
      }}</PixelButton>
      <PixelButton type="button" @click="handleConfirm">{{
        t('availabilityPicker.confirmSignup')
      }}</PixelButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onUnmounted, nextTick } from 'vue'
import { ExclamationTriangleIcon } from '@heroicons/vue/24/outline'
import { useI18n } from 'vue-i18n'
import PixelButton from './ui/PixelButton.vue'
import BaseModal from './ui/BaseModal.vue'
import { formatHourAsTimeString } from '@/utils/timeFormat'

const { t } = useI18n()

const props = defineProps({
  modelValue: Boolean,
  rangeStart: { type: String, default: '2026-07-10' },
  rangeEnd: { type: String, default: '2026-07-16' },
  fixedDate: { type: String, default: null },
  timeWindowStart: { type: String, default: null },
  timeWindowEnd: { type: String, default: null },
  allowedDates: { type: Array, default: () => [] },
  // 情境四：每個候選日期各自的候選時段窗口，形狀 {date: {start, end, slotId}}（一天一個窗口）。
  // 有值的日期會把可選時間限制在該窗口內，取代全域 timeWindowStart/timeWindowEnd。
  dateWindows: { type: Object, default: () => ({}) },
  dateOnly: { type: Boolean, default: false },
  fixedTimeLabel: { type: String, default: '' },
  initialDates: { type: Array, default: () => [] },
  // 「修改時間」重開 picker 時，預填參與者自己先前送出的實際時段範圍（不是只有日期）。
  // 形狀：[{ date: 'YYYY-MM-DD', from: 'HH:mm', to: 'HH:mm' }]，同一天可以有多筆
  initialRanges: { type: Array, default: () => [] },
})
const emit = defineEmits(['update:modelValue', 'confirm'])

// ── 狀態 ──
// fixedDate（單一日期＋時段面板）跟 dateOnly（只選日期，不顯示時段面板）
// 都只有單一欄內容，不需要 BaseModal 的 scrollable 外殼或跟兩欄版面搭配的固定高度/寬度
const compact = computed(() => !!props.fixedDate || props.dateOnly)
const hasTimeWindow = computed(() => !!(props.timeWindowStart && props.timeWindowEnd))

// 有設時段範圍（timeWindowStart/timeWindowEnd）時，「預設」代表整個時段範圍都有空，
// 不是無邊界的「整天有空」——創建者已經限制過參與者能回報的時間，兩者意義不同。
// 情境四（dateWindows 該日期有值）時，「整天有空」沒有意義——候選時段是離散窗口，
// 預設改成帶入該日期唯一窗口的完整範圍，讓使用者從「整個窗口都投」開始再自行縮小。
function defaultDayValue(dateKey) {
  if (props.dateOnly) return null
  const window = dateKey ? props.dateWindows[dateKey] : null
  if (window) {
    return [{ from: window.start, to: window.end, endTimeUserSet: false }]
  }
  if (hasTimeWindow.value) {
    return [{ from: props.timeWindowStart, to: props.timeWindowEnd, endTimeUserSet: false }]
  }
  return null
}

// key = 'YYYY-MM-DD', value = null（整天）或 [{from,to},...]
function initialSelectedDates() {
  if (props.initialRanges.length) {
    const grouped = {}
    for (const r of props.initialRanges) {
      if (!grouped[r.date]) grouped[r.date] = []
      grouped[r.date].push({ from: r.from, to: r.to, endTimeUserSet: true })
    }
    return grouped
  }
  if (props.initialDates.length) {
    return Object.fromEntries(props.initialDates.map((date) => [date, defaultDayValue(date)]))
  }
  return props.fixedDate ? { [props.fixedDate]: defaultDayValue(props.fixedDate) } : {}
}

function initialActiveDate() {
  return props.initialRanges[0]?.date ?? props.initialDates[0] ?? props.fixedDate ?? null
}

const selectedDates = ref(initialSelectedDates())
const activeDate = ref(initialActiveDate())

// 元件在 ActivityDetailModal 裡只會建立一次（v-if 掛載後單純用 modelValue 切換顯示/隱藏），
// 只在建立當下跑一次 initialSelectedDates() 不夠——如果第一次掛載時 initialRanges 還是空的
// （例如當下還沒報名），之後即使 props.initialRanges 變成有值，selectedDates 也不會自動更新。
// 每次打開（modelValue 從 false 變 true）都重新讀一次目前最新的 initialRanges，才能正確預填
watch(
  () => props.modelValue,
  (isOpen) => {
    if (!isOpen) return
    selectedDates.value = initialSelectedDates()
    activeDate.value = initialActiveDate()
  },
)
const confirmError = ref('')
const dragState = reactive({ active: false, startDate: null, hovering: new Set() })

// ── 日曆 computed ──
const DOW_LABELS = computed(() => [
  t('availabilityPicker.dowMon'),
  t('availabilityPicker.dowTue'),
  t('availabilityPicker.dowWed'),
  t('availabilityPicker.dowThu'),
  t('availabilityPicker.dowFri'),
  t('availabilityPicker.dowSat'),
  t('availabilityPicker.dowSun'),
])

const visibleMonth = ref((props.allowedDates[0] ?? props.rangeStart).slice(0, 7))
const calYear = computed(() => parseInt(visibleMonth.value.split('-')[0]))
const calMonth = computed(() => parseInt(visibleMonth.value.split('-')[1]))

const firstDayOffset = computed(() => {
  const d = new Date(calYear.value, calMonth.value - 1, 1).getDay()
  return d === 0 ? 6 : d - 1
})

const daysInMonth = computed(() => new Date(calYear.value, calMonth.value, 0).getDate())

const calRows = computed(() => Math.ceil((firstDayOffset.value + daysInMonth.value) / 7))
const allowedDateSet = computed(() => new Set(props.allowedDates))
const monthKeys = computed(() => {
  const keys = props.allowedDates.length ? props.allowedDates : [props.rangeStart, props.rangeEnd]
  return [...new Set(keys.map((date) => date.slice(0, 7)))].sort()
})
const currentMonthIndex = computed(() => monthKeys.value.indexOf(visibleMonth.value))
const canGoPrevMonth = computed(() => currentMonthIndex.value > 0)
const canGoNextMonth = computed(() => currentMonthIndex.value < monthKeys.value.length - 1)

function toDateKey(day) {
  return `${calYear.value}-${String(calMonth.value).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function formatChip(dateKey) {
  const parts = dateKey.split('-')
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`
}

function isInDateRange(key) {
  return key >= props.rangeStart && key <= props.rangeEnd
}

function canSelectDateKey(key) {
  if (props.allowedDates.length) return allowedDateSet.value.has(key)
  return isInDateRange(key)
}

// 該日期候選窗口的結束邊界，依優先順序：情境四逐日窗口（dateWindows[key].end）
// →全域 timeWindowStart/timeWindowEnd 中較晚者（情境二/三）→ 都沒有時交給 isExpired 用 23:59 當預設
function windowEndBoundaryTime(key) {
  const perDateWindow = props.dateWindows[key]
  if (perDateWindow?.end) return perDateWindow.end
  if (props.timeWindowStart || props.timeWindowEnd) {
    return [props.timeWindowStart, props.timeWindowEnd].filter(Boolean).sort().at(-1)
  }
  return null
}

// 該日期的候選窗口是否已經完全過去（不是只看鐘點，是看整個窗口的結束邊界）
function isExpired(key) {
  const boundaryTime = windowEndBoundaryTime(key)
  const boundary = boundaryTime
    ? new Date(`${key}T${boundaryTime}:00`)
    : new Date(`${key}T23:59:59`)
  return boundary.getTime() < Date.now()
}

// 候選範圍內、且候選窗口還沒完全過去的日期，才能真的被點選/拖曳選取——已過期的日期
// 維持顯示（見 dayClass），但不接受任何選取互動
function isDateCellSelectable(key) {
  return canSelectDateKey(key) && !isExpired(key)
}

function goPrevMonth() {
  if (canGoPrevMonth.value) visibleMonth.value = monthKeys.value[currentMonthIndex.value - 1]
}

function goNextMonth() {
  if (canGoNextMonth.value) visibleMonth.value = monthKeys.value[currentMonthIndex.value + 1]
}

// ── 日期格樣式 ──
function dayClass(day) {
  const key = toDateKey(day)
  const inRange = canSelectDateKey(key)
  const sel = key in selectedDates.value
  // dateOnly 模式沒有時段面板可以顯示「目前作用中的是哪天」，active 這個第二種選取狀態
  // 在畫面上沒有對應的功能意義，只保留一種「已選」樣式，不然使用者看到同樣是選取的日期
  // 卻有綠/黑兩種顏色，會誤以為代表不同意義
  const isActive = !props.dateOnly && activeDate.value === key
  const isDragHov = dragState.active && dragState.hovering.has(day)

  if (!inRange)
    return 'text-[13px] md:text-[14px] font-bold text-center border border-transparent text-[var(--bujo-muted)] cursor-default h-full min-h-[36px] flex items-center justify-center'

  // 已過期：維持顯示在候選範圍內的正常位置，但套用停用樣式（降低透明度＋不可點選游標），
  // 保留候選日期原本的 border 當非顏色標示——border 的有無本身就能區分「曾經是候選日、現在過期」
  // 跟「從來不是候選日」（後者是 border-transparent），不需要再疊加刪除線
  if (isExpired(key))
    return 'text-[13px] md:text-[14px] font-bold text-center border border-[var(--bujo-line-soft)] text-[var(--bujo-muted)] opacity-50 cursor-not-allowed select-none h-full min-h-[36px] flex items-center justify-center'

  return [
    'text-[13px] md:text-[14px] font-bold text-center border cursor-pointer transition-colors select-none h-full min-h-[36px] flex items-center justify-center',
    !sel && !isDragHov
      ? 'bg-[var(--bujo-surface)] border-[var(--bujo-line-soft)] text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)] hover:border-[var(--bujo-ink)]'
      : '',
    isDragHov && !sel ? 'bg-[var(--bujo-surface-muted)] border-[var(--bujo-accent)]' : '',
    sel && !isActive
      ? 'bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)] border-[var(--bujo-ink)]'
      : '',
    sel && isActive ? 'bg-[var(--bujo-ink)] text-[var(--bujo-white)] border-[var(--bujo-ink)]' : '',
  ]
    .filter(Boolean)
    .join(' ')
}

// ── 拖曳選取 ──
function onDayMousedown(day) {
  const key = toDateKey(day)
  if (!isDateCellSelectable(key)) return

  // dateOnly 模式：單純點選/再點一次取消，不需要「先切成 active 再點一次才刪除」這種
  // 兩段式行為——那是給右側時段面板用的「目前正在編輯哪天」機制，dateOnly 沒有這個面板
  if (props.dateOnly) {
    if (key in selectedDates.value) {
      delete selectedDates.value[key]
      if (activeDate.value === key) activeDate.value = null
    } else {
      selectedDates.value[key] = defaultDayValue(key)
      activeDate.value = key
    }
    confirmError.value = ''
    return
  }

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
  if (!isDateCellSelectable(toDateKey(day))) return

  const lo = Math.min(dragState.startDate, day)
  const hi = Math.max(dragState.startDate, day)
  dragState.hovering = new Set()
  for (let d = lo; d <= hi; d++) {
    if (isDateCellSelectable(toDateKey(d))) dragState.hovering.add(d)
  }
}

function onMouseup() {
  if (!dragState.active) return

  dragState.hovering.forEach((day) => {
    const key = toDateKey(day)
    if (isDateCellSelectable(key) && !(key in selectedDates.value)) {
      selectedDates.value[key] = defaultDayValue(key)
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
  // 情境四：該日期有候選時段窗口時，「整天有空」這個概念不存在，永遠跳過整天 UI
  if (props.dateWindows[dateKey]) return false
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
  confirmError.value = ''
  const existing = selectedDates.value[activeDate.value]
  const bounds = windowBoundsFor(activeDate.value)
  const fallback = bounds
    ? { from: bounds.start ?? '09:00', to: bounds.end ?? '17:00' }
    : { from: '09:00', to: '17:00' }
  // 預設值不直接沿用固定的 fallback——如果已經有時段，接在最後一筆的結束時間之後，
  // 避免使用者連續點兩次「+ 新增時段」時，兩筆時段預設值完全相同（一開始就重疊）
  let from = fallback.from
  let to = fallback.to
  const last = existing[existing.length - 1]
  if (last?.to && last.to < fallback.to) {
    from = last.to
    const nextHour = parseInt(from.split(':')[0]) + 1
    const windowEndHour = parseInt(fallback.to.split(':')[0])
    to = nextHour < windowEndHour ? `${String(nextHour).padStart(2, '0')}:00` : fallback.to
  }
  existing.push({ from, to, endTimeUserSet: false })
}

function removeRange(i) {
  confirmError.value = ''
  selectedDates.value[activeDate.value].splice(i, 1)
  if (selectedDates.value[activeDate.value].length === 0) {
    selectedDates.value[activeDate.value] = defaultDayValue(activeDate.value)
  }
}

function resetAllDay() {
  selectedDates.value[activeDate.value] = defaultDayValue(activeDate.value)
}

const allHourOptions = computed(() =>
  Array.from({ length: 24 }, (_, hour) => {
    const value = formatHourAsTimeString(hour)
    return { label: value, value }
  }),
)

// 情境無關的窗口邊界查詢：優先看 dateWindows（情境四單一窗口），否則看全域
// timeWindowStart/timeWindowEnd（情境二/三），兩者都沒設定就回傳 null（無邊界限制）。
// hourOptions/startHourOptions 的邊界過濾、以及 selectRangeStart/addRange 的自動帶入
// 都要疊加在同一份邊界查詢上，不能各自各寫一套，否則邊界感知的修正只會補到一半
function windowBoundsFor(dateKey) {
  const window = props.dateWindows[dateKey]
  if (window) return { start: window.start, end: window.end }
  if (props.timeWindowStart || props.timeWindowEnd) {
    return { start: props.timeWindowStart, end: props.timeWindowEnd }
  }
  return null
}

const activeWindowBounds = computed(() => windowBoundsFor(activeDate.value))

const hourOptions = computed(() => {
  const bounds = activeWindowBounds.value
  if (!bounds) return allHourOptions.value
  return allHourOptions.value.filter(
    (opt) =>
      (!bounds.start || opt.value >= bounds.start) && (!bounds.end || opt.value <= bounds.end),
  )
})

function todayKey() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

// 開始時間選單：疊加在 hourOptions（timeWindow 限制）之上。排除等於窗口終點的選項——
// 選了終點當開始時間會沒有任何合法的結束時間可搭配，乾脆一開始就不給選；
// 正在編輯的日期是今天時，額外排除已經過去的小時
const startHourOptions = computed(() => {
  let options = hourOptions.value
  const bounds = activeWindowBounds.value
  if (bounds?.end) {
    options = options.filter((opt) => opt.value < bounds.end)
  }
  if (activeDate.value === todayKey()) {
    const currentHour = new Date().getHours()
    options = options.filter((opt) => parseInt(opt.value) > currentHour)
  }
  return options
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
  return formatHourAsTimeString(hour)
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
  confirmError.value = ''
  range.from = value
  if (range.endTimeUserSet) {
    // 使用者已經手動選過結束時間：只有在新的開始時間讓它不再合理時才清掉，不然尊重使用者的選擇
    if (range.to && range.to <= value) {
      range.to = null
      range.endTimeUserSet = false
    }
  } else {
    // 還沒手動選過結束時間：自動帶入開始時間 +1 小時，一小時是常見的活動時長，省一次選取動作；
    // 開始時間選在 23:00 時同一天內沒有合理的 +1 小時，留白讓使用者自己選。
    // 有窗口邊界時（dateWindows 或全域 timeWindowEnd）要 clamp，不然會帶出超出候選時段範圍的結束時間
    // ——startHourOptions 已經排除窗口終點本身，這裡不會撞到 clamp 後 from===to 的情況
    const hour = parseInt(value.split(':')[0])
    const naiveEnd = hour === 23 ? null : `${String(hour + 1).padStart(2, '0')}:00`
    const bounds = activeWindowBounds.value
    range.to = bounds?.end && (!naiveEnd || naiveEnd > bounds.end) ? bounds.end : naiveEnd
  }
  closeTimePicker()
}

function selectRangeEnd(range, value) {
  confirmError.value = ''
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
      label: props.dateOnly
        ? ''
        : !ranges || ranges.length === 0
          ? t('availabilityPicker.allDay')
          : ranges.map((r) => `${r.from}–${r.to}`).join(' / '),
    })),
)

// ── Modal 控制 ──
function close() {
  // 元件實例會一直存在（v-model 只是切換 BaseModal 顯不顯示，不會重新掛載），
  // 所以「關閉」要重設回跟第一次掛載時一樣的初始狀態，不能無條件清空——
  // fixedDate 模式沒有日曆可以重新選日期，清空會卡在「選取日期」這個死路
  selectedDates.value = initialSelectedDates()
  activeDate.value = initialActiveDate()
  confirmError.value = ''
  emit('update:modelValue', false)
}

// 兩個時段重疊的判斷：a 的開始早於 b 的結束，且 b 的開始早於 a 的結束。
// 首尾相接（例如 10:00–11:00 跟 11:00–12:00）不算重疊，允許無縫銜接。
// 完全相同的兩筆時段也會被這個公式判定為重疊，不用另外寫重複檢查。
function rangesOverlap(a, b) {
  return a.from < b.to && b.from < a.to
}

// 回傳「同一天底下有兩筆以上時段互相重疊」的所有日期（不只找第一個），
// 這樣選了很多天時，已選清單的 chip 才能一次標出全部有問題的日期
function findOverlapConflictDates() {
  const dates = new Set()
  for (const [date, ranges] of Object.entries(selectedDates.value)) {
    if (!Array.isArray(ranges)) continue
    for (let i = 0; i < ranges.length; i++) {
      for (let j = i + 1; j < ranges.length; j++) {
        if (rangesOverlap(ranges[i], ranges[j])) dates.add(date)
      }
    }
  }
  return dates
}

// range 必須完整落在該日期的窗口內（開始跟結束都不超出窗口）——情境四用 dateWindows（單一窗口），
// 情境二/三用全域 timeWindowStart/timeWindowEnd，兩者共用 windowBoundsFor 判斷同一套邊界；
// 沒有任何窗口設定的日期不受此限制。回傳所有有問題的日期，不只找第一個
function findOutOfWindowDates() {
  const dates = new Set()
  for (const [date, ranges] of Object.entries(selectedDates.value)) {
    const bounds = windowBoundsFor(date)
    if (!bounds || !Array.isArray(ranges)) continue
    for (const range of ranges) {
      const fits =
        (!bounds.start || range.from >= bounds.start) && (!bounds.end || range.to <= bounds.end)
      if (!fits) dates.add(date)
    }
  }
  return dates
}

// 已選清單的 chip 錯誤標記依這個 computed 判斷，跟送出前的驗證共用同一套判斷邏輯，
// 使用者不用等按下確認才知道哪天有問題，選取當下就能看到
const problemDates = computed(() => {
  const dates = new Set(findOverlapConflictDates())
  for (const d of findOutOfWindowDates()) dates.add(d)
  return dates
})

function handleConfirm() {
  if (props.dateOnly && Object.keys(selectedDates.value).length === 0) {
    confirmError.value = t('availabilityPicker.pleaseSelectOneDay')
    return
  }

  const overlapDates = findOverlapConflictDates()
  const outOfWindowDates = findOutOfWindowDates()
  const allProblemDates = [...new Set([...overlapDates, ...outOfWindowDates])].sort()

  if (allProblemDates.length > 0) {
    confirmError.value = allProblemDates
      .map((date) => {
        const reasons = []
        if (overlapDates.has(date)) reasons.push(t('availabilityPicker.overlapOrDuplicate'))
        if (outOfWindowDates.has(date)) reasons.push(t('availabilityPicker.outOfWindow'))
        return t('availabilityPicker.problemDate', {
          date: formatChip(date),
          reasons: reasons.join(t('common.comma')),
        })
      })
      .join('；')
    confirmError.value += t('availabilityPicker.pleaseFixBeforeSubmit')
    activeDate.value = allProblemDates[0]
    return
  }

  confirmError.value = ''
  const result = Object.entries(selectedDates.value).map(([date, ranges]) => ({
    date,
    allDay: ranges === null || ranges.length === 0,
    timeRanges: ranges ?? [],
  }))
  emit('confirm', result)
  close()
}
</script>
