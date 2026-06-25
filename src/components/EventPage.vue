<template>
  <BaseModal :isOpen="modalOpen" title="建立揪團活動" scrollable @close="closeForm">
    <template #default>
      <form id="event-form" class="grid gap-4" @submit.prevent="submitForm">
        <label :class="[fieldClass, 'col-span-full']" for="event-name">
          <span :class="fieldLabelClass"
            >活動名稱 <span class="text-[#75AF61]" aria-hidden="true">*</span></span
          >
          <input
            id="event-name"
            v-model="form.name"
            :class="inputClass"
            type="text"
            required
            placeholder="想揪什麼？"
          />
        </label>

        <div class="grid grid-cols-2 gap-5 max-sm:grid-cols-1 max-sm:gap-4">
          <label :class="fieldClass" for="event-type">
            <span :class="fieldLabelClass">活動類型</span>
            <span class="relative block">
              <select
                id="event-type"
                v-model="form.type"
                :class="[inputClass, 'cursor-pointer appearance-none pr-12']"
              >
                <option v-for="type in eventTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
              <svg
                class="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-[#4A5040] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </label>

          <div :class="fieldClass">
            <span :class="fieldLabelClass">人數上限</span>
            <span class="relative block">
              <input
                id="event-limit"
                :value="form.limit ?? ''"
                :class="[inputClass, 'pr-9']"
                type="number"
                inputmode="numeric"
                placeholder="不限"
                @input="form.limit = $event.target.value === '' || Number($event.target.value) <= 0 ? null : Number($event.target.value)"
              />
              <button
                type="button"
                class="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center border-l border-l-[#E0ECD8] text-[#9AA890] hover:text-[#4A5040] hover:bg-[#F0F8EC] focus:outline-none"
                aria-label="清除人數上限"
                @click="form.limit = null"
              >✕</button>
            </span>
          </div>
        </div>

        <label :class="[fieldClass, 'col-span-full']" for="event-location">
          <span :class="fieldLabelClass">地點</span>
          <input
            id="event-location"
            v-model="form.location"
            :class="inputClass"
            type="text"
            placeholder="在哪裡集合？"
          />
        </label>

        <!-- Q1: 日期確定了嗎？ -->
        <div :class="[fieldClass, 'col-span-full']">
          <span :class="fieldLabelClass">日期確定了嗎？</span>
          <div class="grid grid-cols-2 gap-2 max-sm:gap-1.5">
            <div
              class="flex min-h-[44px] max-sm:min-h-[38px] items-center justify-center border-[1.5px] border-[#4A5040] bg-[#87C06D] px-4 py-2 font-[cubic11] text-sm leading-[1.2] text-[#F5F5EE]"
            >
              已確定
            </div>
            <div
              class="flex min-h-[44px] max-sm:min-h-[38px] cursor-not-allowed items-center justify-center border-[1.5px] border-[#A8C893] bg-white px-4 py-2 font-[cubic11] text-sm leading-[1.2] text-[#4A5040] opacity-35"
            >
              大概範圍
            </div>
          </div>
        </div>

        <!-- Q2: 時間確定了嗎？ -->
        <div :class="[fieldClass, 'col-span-full']">
          <span :class="fieldLabelClass">時間確定了嗎？</span>
          <div class="grid grid-cols-2 gap-2 max-sm:gap-1.5">
            <div
              class="flex min-h-[44px] max-sm:min-h-[38px] items-center justify-center border-[1.5px] border-[#4A5040] bg-[#87C06D] px-4 py-2 font-[cubic11] text-sm leading-[1.2] text-[#F5F5EE]"
            >
              已確定
            </div>
            <div
              class="flex min-h-[44px] max-sm:min-h-[38px] cursor-not-allowed items-center justify-center border-[1.5px] border-[#A8C893] bg-white px-4 py-2 font-[cubic11] text-sm leading-[1.2] text-[#4A5040] opacity-35"
            >
              讓大家選
            </div>
          </div>
        </div>

        <div
          ref="schedulePickerRef"
          class="col-span-full grid gap-1.5 max-sm:gap-1 border-[1.5px] border-[#A8C893] bg-white px-3 py-2 max-sm:py-1.5"
          @click.stop
        >
          <div
            class="grid grid-cols-[72px_1fr] max-sm:grid-cols-[56px_1fr] items-center gap-3 max-sm:gap-2"
          >
            <span :class="[fieldLabelClass, 'text-right']">整日：</span>
            <label class="inline-flex items-center">
              <input
                v-model="form.allDay"
                class="h-7 w-7 max-sm:h-6 max-sm:w-6 cursor-pointer appearance-none rounded-none border-[1.5px] border-[#A8C893] bg-white checked:border-[#4A5040] checked:bg-[#7FBE69] focus:outline-none focus:shadow-[inset_0_0_0_1px_#7DB968]"
                type="checkbox"
                aria-label="整日"
                @change="closePicker"
              />
            </label>
          </div>

          <div
            v-for="row in scheduleRows"
            :key="row.dateField"
            class="grid grid-cols-[72px_1fr] max-sm:grid-cols-[56px_1fr] items-start gap-3 max-sm:gap-2"
          >
            <span :class="[fieldLabelClass, 'pt-2 text-right']">{{ row.label }}</span>
            <div
              class="grid gap-2"
              :class="form.allDay ? 'grid-cols-1' : 'grid-cols-[1fr_150px] max-sm:grid-cols-1'"
            >
              <span class="relative block">
                <button
                  :id="row.dateButtonId"
                  :class="[pickerButtonClass, 'w-full']"
                  type="button"
                  :data-date-field="row.dateField"
                  @click="openPicker(row.dateField)"
                >
                  {{ form[row.dateField] }}
                </button>

                <div
                  v-if="activePicker === row.dateField"
                  :class="[pickerPanelClass, 'left-0 w-[280px] max-sm:w-full']"
                  role="dialog"
                  :aria-label="row.dateMenuLabel"
                >
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <button
                      class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border-[1.5px] border-[#4A5040] bg-white font-[cubic11] text-lg leading-none shadow-[2px_2px_0_#4A5040]"
                      type="button"
                      aria-label="上一個月"
                      @click="moveMonth(-1)"
                    >
                      ‹
                    </button>
                    <p class="m-0 text-center text-sm leading-none text-[#4A5040]">
                      {{ monthTitle }}
                    </p>
                    <button
                      class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border-[1.5px] border-[#4A5040] bg-white font-[cubic11] text-lg leading-none shadow-[2px_2px_0_#4A5040]"
                      type="button"
                      aria-label="下一個月"
                      @click="moveMonth(1)"
                    >
                      ›
                    </button>
                  </div>

                  <div class="mb-1 grid grid-cols-7 gap-1 text-center text-sm text-[#6E765E]">
                    <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
                  </div>

                  <div class="grid grid-cols-7 gap-1">
                    <button
                      v-for="cell in dateCells"
                      :key="cell.key"
                      :class="dateButtonClass(cell)"
                      type="button"
                      :aria-label="cell.key"
                      :data-date="cell.key"
                      @click="selectDate(cell.date)"
                    >
                      {{ cell.label }}
                    </button>
                  </div>
                </div>
              </span>

              <span v-if="!form.allDay" class="relative block">
                <button
                  :id="row.timeButtonId"
                  :class="[pickerButtonClass, 'w-full']"
                  type="button"
                  :data-time-field="row.timeField"
                  @click="openPicker(row.timeField)"
                >
                  {{ form[row.timeField] }}
                </button>

                <div
                  v-if="activePicker === row.timeField"
                  :class="[pickerPanelClass, 'right-0 w-full min-w-[160px]']"
                  role="listbox"
                  :aria-label="row.timeMenuLabel"
                >
                  <div class="max-h-[208px] overflow-y-auto pr-1">
                    <button
                      v-for="time in timeOptions"
                      :key="time"
                      class="mb-1 block min-h-9 max-sm:min-h-8 w-full border-[1.5px] border-[#D8E6C8] bg-white px-3 max-sm:px-2 py-1.5 text-left font-[cubic11] text-sm leading-none text-[#4A5040] last:mb-0 hover:border-[#7DB968] hover:bg-[#EDF8C9]"
                      :class="timeButtonClass(time, row.timeField)"
                      type="button"
                      role="option"
                      :disabled="isTimePast(time)"
                      :aria-selected="form[row.timeField] === time"
                      :aria-label="time"
                      :data-time="time"
                      @click="selectTime(time)"
                    >
                      {{ time }}
                    </button>
                  </div>
                </div>
              </span>
            </div>
          </div>
        </div>

        <!-- 備註 + 流團設定附注 -->
        <label :class="[fieldClass, 'col-span-full']" for="event-note">
          <span :class="fieldLabelClass">備註</span>
          <textarea
            id="event-note"
            v-model="form.note"
            :class="[inputClass, 'min-h-[92px] resize-none']"
            rows="5"
            placeholder="補充說明，例如裝備、費用..."
          ></textarea>

          <!-- 緊急警告：距今 ≤ 1 小時 -->
          <div
            v-if="isUrgent"
            class="flex items-start gap-2 border-[1.5px] border-[#E8A060] bg-[#FFF8EC] px-3 py-2"
          >
            <span class="flex-shrink-0 text-sm leading-5">⚠️</span>
            <span class="text-xs leading-5 text-[#B06020]">
              活動將在 <strong>{{ minutesUntilStart }}</strong> 分鐘後開始，建立後請手動確認成團
            </span>
          </div>

          <!-- 流團設定附注（正常情況） -->
          <template v-else>
            <div class="flex items-start gap-2 border-t border-dashed border-[#C8DEB8] pt-2">
              <span class="flex-1 text-xs leading-5 text-[#9AA890]">
                <strong class="text-[#7A9070]">{{ deadlineDisplayText }}</strong>，人數不若足活動將自動取消
              </span>
              <button
                type="button"
                class="flex-shrink-0 bg-white border border-[#C8DEB8] px-2 py-0.5 text-[10px] leading-5 text-[#9AA890] transition-colors hover:border-[#87C06D] hover:text-[#87C06D]"
                @click="toggleDeadlineEditor"
              >
                調整
              </button>
            </div>

            <!-- 流團編輯器 -->
            <div
              v-if="showDeadlineEditor"
              class="flex items-center gap-2 border-[1.5px] border-dashed border-[#87C06D] bg-[#F0F8E8] px-3 py-2"
            >
              <span class="text-xs text-[#4A5040]">活動開始前</span>
              <input
                v-model.number="deadline.value"
                type="number"
                min="1"
                class="h-8 w-14 rounded-none border-[1.5px] border-[#A8C893] bg-white px-2 font-[cubic11] text-xs text-[#4A5040] outline-none focus:border-[#7DB968] focus:shadow-[inset_0_0_0_1px_#7DB968]"
              />
              <select
                v-model="deadline.unit"
                class="h-8 rounded-none border-[1.5px] border-[#A8C893] bg-white px-2 font-[cubic11] text-xs text-[#4A5040] outline-none focus:border-[#7DB968]"
              >
                <option v-for="opt in deadlineUnitOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <span class="text-xs text-[#4A5040]">自動取消</span>
            </div>
          </template>
        </label>
      </form>
    </template>

    <template #footer>
      <PixelButton variant="white" type="button" @click="closeForm">取消</PixelButton>
      <PixelButton form="event-form" type="submit">送出揪團</PixelButton>
    </template>
  </BaseModal>

  <!-- 緊急送出確認 dialog -->
  <BaseModal
    :isOpen="showUrgentConfirm"
    title="活動即將開始"
    @close="showUrgentConfirm = false"
  >
    <template #default>
      <div class="grid gap-3 py-2 text-center">
        <p class="text-sm leading-6 text-[#4A5040]">
          這個活動將在 <strong>{{ minutesUntilStart }}</strong> 分鐘後開始<br />
          建立後請記得到活動頁面<br />
          <strong>手動確認成團</strong>，才會通知參與者
        </p>
      </div>
    </template>
    <template #footer>
      <PixelButton variant="white" type="button" @click="showUrgentConfirm = false">取消</PixelButton>
      <PixelButton type="button" @click="confirmUrgentSubmit">確定送出</PixelButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'

const props = defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'submit'])

const route = useRoute()
const router = useRouter()
const isRouteComponent = computed(() => route.name === 'event-new')
const modalOpen = computed(() => (isRouteComponent.value ? true : props.isOpen))

const eventTypes = ['吃飯', '運動', '讀書', '逛街', '看展', '其他']
const dateFields = ['startDate', 'endDate']
const timeFields = ['startTime', 'endTime']
const scheduleRows = [
  {
    label: '開始：',
    dateField: 'startDate',
    timeField: 'startTime',
    dateButtonId: 'event-start-date',
    timeButtonId: 'event-start-time',
    dateMenuLabel: '開始日期選單',
    timeMenuLabel: '開始時間選單',
  },
  {
    label: '結束：',
    dateField: 'endDate',
    timeField: 'endTime',
    dateButtonId: 'event-end-date',
    timeButtonId: 'event-end-time',
    dateMenuLabel: '結束日期選單',
    timeMenuLabel: '結束時間選單',
  },
]

const today = formatDateValue(new Date())
const form = reactive({
  name: '',
  type: '吃飯',
  limit: null,
  location: '',
  allDay: false,
  startDate: today,
  startTime: '下午 12:00',
  endDate: today,
  endTime: '下午 1:00',
  note: '',
})

// 流團設定
const deadline = reactive({ value: 1, unit: 'day' })
const showDeadlineEditor = ref(false)
const showUrgentConfirm = ref(false)

const fieldClass = 'grid gap-2'
const fieldLabelClass = 'field-label text-sm leading-none tracking-[0.01em] text-[#4A5040]'
const inputClass =
  'min-h-[44px] max-sm:min-h-[38px] w-full rounded-none border-[1.5px] border-[#A8C893] bg-white px-4 py-2 font-[cubic11] text-sm leading-[1.2] text-[#4A5040] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[#858A7A] focus:border-[#7DB968] focus:shadow-[inset_0_0_0_1px_#7DB968]'
const pickerButtonClass =
  'min-h-[38px] max-sm:min-h-[34px] whitespace-nowrap rounded-none border-[1.5px] border-[#A8C893] bg-white px-3 py-1.5 text-left font-[cubic11] text-sm leading-none text-[#4A5040] outline-none transition-[border-color,box-shadow] hover:border-[#7DB968] focus:border-[#7DB968] focus:shadow-[inset_0_0_0_1px_#7DB968]'
const pickerPanelClass =
  'absolute top-[calc(100%+6px)] z-50 border-2 border-[#4A5040] bg-white p-3 shadow-[5px_5px_0_#4A5040] max-sm:static max-sm:mt-1'

const activePicker = ref('')
const schedulePickerRef = ref(null)
const selectedDate = ref(parseDateValue(form.startDate))
const visibleMonth = ref(startOfMonth(selectedDate.value ?? new Date()))

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const timeOptions = createTimeOptions()

const activeDateField = computed(() =>
  dateFields.includes(activePicker.value) ? activePicker.value : 'startDate',
)

const activeTimeField = computed(() =>
  timeFields.includes(activePicker.value) ? activePicker.value : 'startTime',
)

const monthTitle = computed(() => {
  const year = visibleMonth.value.getFullYear()
  const month = visibleMonth.value.getMonth() + 1
  return `${year} 年 ${month} 月`
})

const dateCells = computed(() => {
  const firstDay = startOfMonth(visibleMonth.value)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const startDateObj = activeDateField.value === 'endDate' ? parseDateValue(form.startDate) : null

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    const isBeforeStart = startDateObj ? date < startDateObj : false

    return {
      key: formatDateValue(date),
      date,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isSelected: selectedDate.value ? isSameDate(date, selectedDate.value) : false,
      isToday: isSameDate(date, new Date()),
      isPast: date < todayStart || isBeforeStart,
    }
  })
})

// 是否距今 ≤ 1 小時（緊急活動）
const isUrgent = computed(() => {
  if (form.allDay) return false
  const start = parseDateTimeValue(form.startDate, form.startTime)
  if (!start) return false
  const diffMs = start.getTime() - Date.now()
  return diffMs > 0 && diffMs <= 60 * 60 * 1000
})

// 是否為當天活動
const isSameDay = computed(() => {
  const start = parseDateValue(form.startDate)
  if (!start) return false
  const now = new Date()
  return (
    start.getFullYear() === now.getFullYear() &&
    start.getMonth() === now.getMonth() &&
    start.getDate() === now.getDate()
  )
})

// 距今幾分鐘（緊急顯示用）
const minutesUntilStart = computed(() => {
  const start = parseDateTimeValue(form.startDate, form.startTime)
  if (!start) return 0
  return Math.max(1, Math.ceil((start.getTime() - Date.now()) / 60000))
})

// 流團時間顯示文字
const deadlineDisplayText = computed(() => {
  if (deadline.unit === 'day') {
    const start = parseDateValue(form.startDate)
    if (!start) return ''
    const d = new Date(start)
    d.setDate(d.getDate() - deadline.value)
    return `${formatDateValue(d)}（活動前 ${deadline.value} 天）`
  } else {
    const start = parseDateTimeValue(form.startDate, form.startTime)
    if (!start) return ''
    const d = new Date(start.getTime() - deadline.value * 3600000)
    const period = d.getHours() < 12 ? '上午' : '下午'
    const hour = d.getHours() % 12 || 12
    return `${formatDateValue(d)} ${period} ${hour}:00（活動前 ${deadline.value} 小時）`
  }
})

// 可選的單位（當天只能選小時）
const deadlineUnitOptions = computed(() => {
  if (isSameDay.value) return [{ value: 'hour', label: '小時' }]
  return [
    { value: 'day', label: '天' },
    { value: 'hour', label: '小時' },
  ]
})

// 當天活動時強制切換為小時
watch(isSameDay, (val) => {
  if (val && deadline.unit === 'day') {
    deadline.unit = 'hour'
    deadline.value = 1
  } else if (!val && deadline.unit === 'hour') {
    deadline.unit = 'day'
    deadline.value = 1
  }
})

watch(
  () => [form.startDate, form.startTime],
  () => {
    if (form.allDay) return
    const start = parseDateTimeValue(form.startDate, form.startTime)
    const end = parseDateTimeValue(form.endDate, form.endTime)
    if (!start || !end) return
    if (start >= end) {
      const newEnd = new Date(start.getTime() + 60 * 60 * 1000)
      form.endDate = formatDateValue(newEnd)
      form.endTime = formatTimeValue(newEnd)
    }
  },
)

function closeForm() {
  closePicker()
  if (isRouteComponent.value) {
    router.back()
  } else {
    emit('close')
  }
}

function submitForm() {
  closePicker()
  if (isUrgent.value) {
    showUrgentConfirm.value = true
    return
  }
  doSubmit()
}

function confirmUrgentSubmit() {
  showUrgentConfirm.value = false
  doSubmit()
}

function doSubmit() {
  const limitValue = !form.limit || isNaN(form.limit) ? null : form.limit
  emit('submit', {
    ...form,
    limit: limitValue,
    deadline: isUrgent.value ? null : { ...deadline },
  })
}

function toggleDeadlineEditor() {
  showDeadlineEditor.value = !showDeadlineEditor.value
}

function openPicker(type) {
  if (dateFields.includes(type)) {
    syncVisibleMonthFromValue(type)
  }
  activePicker.value = type
}

function closePicker() {
  activePicker.value = ''
}

function handleDocumentClick(event) {
  if (!schedulePickerRef.value?.contains(event.target)) {
    closePicker()
  }
}

function handleEscape(event) {
  if (event.key === 'Escape') {
    closePicker()
  }
}

function moveMonth(direction) {
  visibleMonth.value = new Date(
    visibleMonth.value.getFullYear(),
    visibleMonth.value.getMonth() + direction,
    1,
  )
}

function selectDate(date) {
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  if (date < todayStart) return
  const pickedDate = new Date(date)
  selectedDate.value = pickedDate
  form[activeDateField.value] = formatDateValue(pickedDate)
  closePicker()
}

function selectTime(time) {
  form[activeTimeField.value] = time
  closePicker()
}

function syncVisibleMonthFromValue(field) {
  const parsedDate = parseDateValue(form[field])
  if (parsedDate) {
    selectedDate.value = parsedDate
    visibleMonth.value = startOfMonth(parsedDate)
  }
}

function startOfMonth(date) {
  return new Date(date.getFullYear(), date.getMonth(), 1)
}

function formatDateValue(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}/${month}/${day}`
}

function parseDateValue(value) {
  const match = value.match(/^(\d{4})\/(\d{2})\/(\d{2})$/)
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

function formatTimeValue(date) {
  const period = date.getHours() < 12 ? '上午' : '下午'
  const hour = date.getHours() % 12 || 12
  return `${period} ${hour}:00`
}

function parseDateTimeValue(dateStr, timeStr) {
  const date = parseDateValue(dateStr)
  if (!date) return null
  const match = timeStr.match(/^(上午|下午)\s+(\d+):(\d+)$/)
  if (!match) return null
  let hour = Number(match[2])
  const minute = Number(match[3])
  if (match[1] === '下午' && hour !== 12) hour += 12
  if (match[1] === '上午' && hour === 12) hour = 0
  date.setHours(hour, minute, 0, 0)
  return date
}

function isSameDate(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

function createTimeOptions() {
  return Array.from({ length: 24 }, (_, hour) => {
    const period = hour < 12 ? '上午' : '下午'
    const displayHour = String(hour % 12 || 12)
    return `${period} ${displayHour}:00`
  })
}

function dateButtonClass(cell) {
  return [
    'h-8 max-sm:h-7 border-[1.5px] font-[cubic11] text-xs leading-none transition-colors',
    cell.isPast
      ? 'border-[#E8EDE0] bg-white text-[#C8CEBC] cursor-not-allowed pointer-events-none'
      : cell.isSelected
        ? 'border-[#4A5040] bg-[#7FBE69] text-[#FEF7E8]'
        : 'border-[#D8E6C8] bg-white text-[#4A5040] hover:border-[#7DB968] hover:bg-[#EDF8C9]',
    !cell.isCurrentMonth && !cell.isPast && 'text-[#A7AB9A]',
    cell.isToday && !cell.isSelected && 'border-[#7DB968] bg-[#F3F9D8]',
  ]
}

function isTimePast(time) {
  const dateFieldMap = { startTime: 'startDate', endTime: 'endDate' }
  const dateField = dateFieldMap[activeTimeField.value]
  if (!dateField) return false

  // 今天之前的時段不可選
  if (form[dateField] === today) {
    const timeDate = parseDateTimeValue(form[dateField], time)
    if (timeDate !== null && timeDate < new Date()) return true
  }

  // 編輯 endTime 時，禁用 ≤ startTime 的時段（同一天）
  if (activeTimeField.value === 'endTime' && form.endDate === form.startDate) {
    const startDateTime = parseDateTimeValue(form.startDate, form.startTime)
    const thisDateTime = parseDateTimeValue(form.endDate, time)
    if (startDateTime && thisDateTime && thisDateTime <= startDateTime) return true
  }

  return false
}

function timeButtonClass(time, field) {
  if (isTimePast(time)) return 'text-[#C8CEBC] cursor-not-allowed pointer-events-none'
  return { 'border-[#4A5040] bg-[#7FBE69] text-[#FEF7E8]': form[field] === time }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
  if (isSameDay.value) {
    deadline.unit = 'hour'
  }
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleDocumentClick)
  document.removeEventListener('keydown', handleEscape)
})
</script>

<style scoped>
.field-label {
  -webkit-text-stroke: 0.5px #4a5040;
}
</style>
