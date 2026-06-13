<script setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue'

const props = defineProps({
  modelValue: Boolean,
  rangeStart: { type: String, default: '2026-07-10' },
  rangeEnd:   { type: String, default: '2026-07-16' },
})
const emit = defineEmits(['update:modelValue', 'confirm'])

// ── 狀態 ──
// key = 'YYYY-MM-DD', value = null（整天）或 [{from,to},...]
const selectedDates = ref({})
const activeDate    = ref(null)
const dragState     = reactive({ active: false, startDate: null, hovering: new Set() })

// ── 日曆 computed ──
const DOW_LABELS = ['一','二','三','四','五','六','日']

const calYear  = computed(() => parseInt(props.rangeStart.split('-')[0]))
const calMonth = computed(() => parseInt(props.rangeStart.split('-')[1]))

const firstDayOffset = computed(() => {
  const d = new Date(calYear.value, calMonth.value - 1, 1).getDay()
  return d === 0 ? 6 : d - 1
})

const daysInMonth = computed(() =>
  new Date(calYear.value, calMonth.value, 0).getDate()
)

const rangeStartDay = computed(() => parseInt(props.rangeStart.split('-')[2]))
const rangeEndDay   = computed(() => parseInt(props.rangeEnd.split('-')[2]))
const calRows       = computed(() => Math.ceil((firstDayOffset.value + daysInMonth.value) / 7))

function toDateKey(day) {
  return `${calYear.value}-${String(calMonth.value).padStart(2,'0')}-${String(day).padStart(2,'0')}`
}

function formatChip(dateKey) {
  const parts = dateKey.split('-')
  return `${parseInt(parts[1])}/${parseInt(parts[2])}`
}

const sortedSelectedDates = computed(() => Object.keys(selectedDates.value).sort())

// ── 日期格樣式 ──
function dayClass(day) {
  const inRange  = day >= rangeStartDay.value && day <= rangeEndDay.value
  const key      = toDateKey(day)
  const sel      = key in selectedDates.value
  const isActive = activeDate.value === key
  const isDragHov = dragState.active && dragState.hovering.has(day)

  if (!inRange) return 'text-[13px] md:text-[14px] font-bold text-center border-2 border-transparent text-[#ccc] cursor-default h-full min-h-[36px] flex items-center justify-center'

  return [
    'text-[13px] md:text-[14px] font-bold text-center border-2 cursor-pointer transition-colors select-none h-full min-h-[36px] flex items-center justify-center',
    !sel && !isDragHov ? 'bg-[#f0fae5] border-transparent hover:bg-[#DEF4CD] hover:border-[#87C06D]' : '',
    isDragHov && !sel  ? 'bg-[#DEF4CD] border-[#87C06D]' : '',
    sel && !isActive   ? 'bg-[#87C06D] text-white border-[#5e9b57]' : '',
    sel &&  isActive   ? 'bg-[#4A5040] text-white border-[#4A5040]' : '',
  ].filter(Boolean).join(' ')
}

// ── 拖曳選取 ──
function onDayMousedown(day) {
  const inRange = day >= rangeStartDay.value && day <= rangeEndDay.value
  if (!inRange) return

  const key = toDateKey(day)
  if (key in selectedDates.value) {
    if (activeDate.value === key) {
      // 已聚焦 → 取消選取
      activeDate.value = null
      delete selectedDates.value[key]
    } else {
      // 已選但非聚焦 → 切換聚焦到此日期
      activeDate.value = key
    }
    return
  }

  dragState.active    = true
  dragState.startDate = day
  dragState.hovering  = new Set([day])
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

  dragState.hovering.forEach(day => {
    const key = toDateKey(day)
    if (!(key in selectedDates.value)) {
      selectedDates.value[key] = null
    }
  })

  const last = Math.max(...dragState.hovering)
  activeDate.value = toDateKey(last)

  dragState.active   = false
  dragState.hovering = new Set()
}

onMounted(()   => window.addEventListener('mouseup', onMouseup))
onUnmounted(() => window.removeEventListener('mouseup', onMouseup))

// ── 時段操作 ──
function isAllDay(dateKey) {
  const val = selectedDates.value[dateKey]
  return val === null || (Array.isArray(val) && val.length === 0)
}

function startCustom() {
  selectedDates.value[activeDate.value] = [{ from: '09:00', to: '17:00' }]
}

function addRange() {
  if (!Array.isArray(selectedDates.value[activeDate.value])) {
    selectedDates.value[activeDate.value] = []
  }
  selectedDates.value[activeDate.value].push({ from: '09:00', to: '17:00' })
}

function removeRange(i) {
  selectedDates.value[activeDate.value].splice(i, 1)
  if (selectedDates.value[activeDate.value].length === 0) {
    selectedDates.value[activeDate.value] = null
  }
}

function resetAllDay() {
  selectedDates.value[activeDate.value] = null
}

// ── 摘要 ──
const summaryItems = computed(() =>
  Object.entries(selectedDates.value)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, ranges]) => ({
      date,
      chip: formatChip(date),
      label: (!ranges || ranges.length === 0)
        ? '整天'
        : ranges.map(r => `${r.from}–${r.to}`).join(' / '),
    }))
)

// ── Modal 控制 ──
function close() {
  selectedDates.value = {}
  activeDate.value    = null
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

<template>
  <Teleport to="body">
    <div
      v-if="modelValue"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      @click.self="close"
    >
      <div class="bg-white border-2 border-[#4A5040] shadow-[6px_6px_0_#DEF4CD]
                  w-full max-w-[800px] h-[70vh] md:h-[600px] flex flex-col overflow-hidden">

        <!-- Header -->
        <div class="bg-[#D9F0A8] border-b-2 border-[#DEF4CD] px-4 py-3
                    flex items-center justify-between shrink-0">
          <h2 class="font-cubic11 font-black text-[#4A5040] text-sm md:text-base">選取有空時間</h2>
          <button
            @click="close"
            class="w-6 h-6 bg-[#4A5040] text-white font-bold text-xs
                   flex items-center justify-center hover:bg-[#5e9b57] transition-colors"
          >✕</button>
        </div>

        <!-- Activity range -->
        <div class="bg-[#f5fbee] border-b border-[#DEF4CD] px-4 py-1.5 shrink-0
                    font-cubic11 text-[12px] font-bold text-[#5e9b57]">
          活動日期範圍：{{ rangeStart }} — {{ rangeEnd }}
        </div>

        <!-- Body -->
        <div class="flex md:flex-row flex-col flex-1 min-h-0 overflow-y-auto md:overflow-hidden">

          <!-- 日曆區 -->
          <div class="border-b-2 md:border-b-0 md:border-r-2 border-[#DEF4CD] p-3 md:p-4 w-full md:flex-1 flex flex-col">

            <!-- 月份標題 -->
            <div class="flex items-center justify-between mb-2 shrink-0">
              <span class="font-cubic11 text-[13px] md:text-base font-black text-[#4A5040]">
                {{ calYear }} / {{ calMonth }}
              </span>
            </div>

            <!-- 格線：flex-1 讓格子填滿剩餘高度 -->
            <div
              class="grid grid-cols-7 gap-0.5 md:gap-1 md:flex-1 md:min-h-0"
              :style="{ gridTemplateRows: `auto repeat(${calRows}, 1fr)` }"
            >
              <div
                v-for="d in DOW_LABELS" :key="d"
                class="text-xs md:text-[13px] font-bold text-[#9DBD86] text-center flex items-end justify-center pb-1"
              >{{ d }}</div>

              <div v-for="i in firstDayOffset" :key="'e'+i"></div>

              <div
                v-for="day in daysInMonth" :key="day"
                :class="dayClass(day)"
                @mousedown.prevent="onDayMousedown(day)"
                @mouseover="onDayMouseover(day)"
              >{{ day }}</div>
            </div>

          </div>

          <!-- 時段面板 -->
          <div class="p-4 min-w-0 md:flex-1 md:overflow-y-auto">

            <!-- 無聚焦日期 -->
            <div
              v-if="!activeDate || !(activeDate in selectedDates)"
              class="text-[11px] text-[#b0c09a] py-8 text-center border-2 border-dashed border-[#DEF4CD]"
            >
              ← 選取日期
            </div>

            <template v-else>
              <!-- 日期標題 -->
              <div class="flex items-center gap-2 mb-1">
                <span class="w-2 h-2 bg-[#87C06D] shrink-0 inline-block"></span>
                <span class="font-cubic11 font-black text-[13px] md:text-sm text-[#4A5040]">
                  {{ formatChip(activeDate) }}
                </span>
              </div>
          

              <!-- 整天狀態 -->
              <div
                v-if="isAllDay(activeDate)"
                class="bg-[#D9F0A8] border-2 border-[#9DBD86] px-3 py-2
                       flex items-center justify-between mb-2"
              >
                <span class="font-cubic11 text-[12px] md:text-[13px] font-bold text-[#4A5040]">
                  整天有空 
                </span>
                <button
                  @click="startCustom"
                  class="text-[11px] md:text-xs font-bold border-2 border-[#9DBD86] px-2 py-1
                         hover:bg-white transition-colors font-cubic11"
                >指定時段</button>
              </div>

              <!-- 時段列表 -->
              <template v-else>
                <div class="flex flex-col gap-2 mb-2 pr-1">
                  <div
                    v-for="(range, i) in selectedDates[activeDate]" :key="i"
                    class="flex items-center gap-1.5 shrink-0 min-w-0"
                  >
                    <input
                      type="time"
                      v-model="range.from"
                      class="flex-1 min-w-0 border-2 border-[#DEF4CD] bg-[#fafdf7] px-1.5 py-1.5
                             font-bold text-[#4A5040] outline-none focus:border-[#87C06D]
                             focus:bg-white transition-colors"
                      style="font-size:13px"
                    >
                    <span class="text-[12px] text-[#9DBD86] font-bold shrink-0">→</span>
                    <input
                      type="time"
                      v-model="range.to"
                      class="flex-1 min-w-0 border-2 border-[#DEF4CD] bg-[#fafdf7] px-1.5 py-1.5
                             font-bold text-[#4A5040] outline-none focus:border-[#87C06D]
                             focus:bg-white transition-colors"
                      style="font-size:13px"
                    >
                    <button
                      @click="removeRange(i)"
                      class="w-6 h-6 bg-[#DEF4CD] border-2 border-[#9DBD86] text-[11px]
                             font-bold flex items-center justify-center shrink-0
                             hover:bg-[#f9ce9a] hover:border-[#c07070] transition-colors"
                    >✕</button>
                  </div>
                </div>

                <button
                  @click="addRange"
                  class="w-full text-[11px] font-bold text-[#87C06D] border-2 border-dashed
                         border-[#87C06D] py-1.5 hover:bg-[#f0fae5] transition-colors font-cubic11"
                >＋ 新增時段</button>

                <button
                  @click="resetAllDay"
                  class="mt-2 text-[10px] text-[#9DBD86] hover:text-[#4A5040]
                         transition-colors font-cubic11 block"
                >↩ 改回整天有空</button>
              </template>
            </template>
          </div>
        </div>

        <!-- Summary strip -->
        <div class="border-t-2 border-[#DEF4CD] bg-[#fafdf7] px-4 py-2 shrink-0
                    min-h-[36px] max-h-[70px] overflow-y-auto">
          <div class="flex items-start gap-2 flex-wrap">
            <span v-if="!summaryItems.length" class="font-cubic11 text-[10px] md:text-[12px] text-[#9DBD86]">
              尚未選取任何時段
            </span>
            <template v-else>
              <span class="flex items-center font-cubic11 text-[10px] md:text-[12px] font-black text-[#5e9b57] shrink-0">已選：</span>
              <button
                v-for="item in summaryItems" :key="item.chip"
                @click="activeDate = item.date"
                class="font-cubic11 text-[10px] md:text-[12px] font-bold px-2 py-0.5 border transition-colors"
                :class="activeDate === item.date
                  ? 'bg-[#4A5040] text-white border-[#4A5040]'
                  : 'bg-[#D9F0A8] border-[#9DBD86] hover:border-[#87C06D]'"
              >{{ item.chip }} {{ item.label }}</button>
            </template>
          </div>
        </div>

        <!-- Footer -->
        <div class="border-t-2 border-[#DEF4CD] px-4 py-2.5 flex justify-end gap-2 shrink-0">
          <button
            @click="close"
            class="px-4 py-1.5 text-xs font-bold font-cubic11 border-2 border-[#DEF4CD]
                   bg-white text-[#4A5040] hover:border-[#9DBD86] transition-colors"
          >取消</button>
          <button
            @click="handleConfirm"
            class="px-4 py-1.5 text-xs font-bold font-cubic11 border-2 border-[#4A5040]
                   bg-[#87C06D] text-[#4A5040] shadow-[3px_3px_0_#4A5040]
                   active:shadow-none active:translate-x-[3px] active:translate-y-[3px] transition-all"
          >確認報名</button>
        </div>

      </div>
    </div>
  </Teleport>
</template>
