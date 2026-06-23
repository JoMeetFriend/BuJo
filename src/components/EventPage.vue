<template>
  <BaseModal :isOpen="isOpen" title="建立揪團活動" scrollable @close="closeForm">
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

          <label :class="fieldClass" for="event-limit">
            <span :class="fieldLabelClass">人數上限</span>
            <input
              id="event-limit"
              v-model.number="form.limit"
              :class="inputClass"
              type="number"
              min="1"
              inputmode="numeric"
            />
          </label>
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

        <label :class="[fieldClass, 'col-span-full']" for="event-note">
          <span :class="fieldLabelClass">備註</span>
          <textarea
            id="event-note"
            v-model="form.note"
            :class="[inputClass, 'min-h-[92px] resize-none']"
            rows="5"
            placeholder="補充說明，例如裝備、費用..."
          ></textarea>
        </label>
      </form>
    </template>

    <template #footer>
      <PixelButton variant="white" type="button" @click="closeForm">取消</PixelButton>
      <PixelButton form="event-form" type="submit">送出揪團</PixelButton>
    </template>
  </BaseModal>
</template>

<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'

defineProps({ isOpen: Boolean })
const emit = defineEmits(['close', 'submit'])

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

const form = reactive({
  name: '',
  type: '吃飯',
  limit: 6,
  location: '',
  allDay: false,
  startDate: '2026/06/11',
  startTime: '下午 12:00',
  endDate: '2026/06/11',
  endTime: '下午 1:00',
  note: '',
})

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

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)

    return {
      key: formatDateValue(date),
      date,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isSelected: selectedDate.value ? isSameDate(date, selectedDate.value) : false,
      isToday: isSameDate(date, new Date()),
    }
  })
})

function closeForm() {
  closePicker()
  emit('close')
}

function submitForm() {
  closePicker()
  emit('submit', { ...form })
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
    cell.isSelected
      ? 'border-[#4A5040] bg-[#7FBE69] text-[#FEF7E8]'
      : 'border-[#D8E6C8] bg-white text-[#4A5040] hover:border-[#7DB968] hover:bg-[#EDF8C9]',
    !cell.isCurrentMonth && 'text-[#A7AB9A]',
    cell.isToday && !cell.isSelected && 'border-[#7DB968] bg-[#F3F9D8]',
  ]
}

function timeButtonClass(time, field) {
  return {
    'border-[#4A5040] bg-[#7FBE69] text-[#FEF7E8]': form[field] === time,
  }
}

onMounted(() => {
  document.addEventListener('click', handleDocumentClick)
  document.addEventListener('keydown', handleEscape)
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
