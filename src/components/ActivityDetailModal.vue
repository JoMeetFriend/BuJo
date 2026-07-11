<template>
  <article v-if="isOpen" class="activity-detail-panel">
    <header class="activity-detail-header">
      <div>
        <div class="activity-detail-kicker">ACTIVITY ROOM</div>
        <h2>{{ activity?.title || '活動詳情' }}</h2>
      </div>
      <div class="activity-detail-header-right">
        <button
          v-if="closable"
          type="button"
          class="activity-detail-close"
          aria-label="關閉活動詳情"
          @click="emit('close')"
        >
          ×
        </button>
        <span v-if="activity" class="activity-detail-date">{{ panelDate }}</span>
      </div>
    </header>

    <section class="activity-detail-body">
      <div v-if="loading" class="activity-detail-state">載入中...</div>
      <div v-else-if="fetchError" class="activity-detail-state activity-detail-state--error">
        {{ fetchError }}
      </div>

      <template v-else-if="activity">
        <div class="activity-detail-creator">
          <div class="activity-detail-avatar">
            <img
              v-if="activity.creator.avatar_url"
              :src="toAvatarSrc(activity.creator.avatar_url)"
              alt=""
            />
            <span v-else>⭐</span>
          </div>
          <span>{{ activity.creator.display_name }} 發起</span>
        </div>

        <div class="activity-detail-info">
          <div v-if="dateText">
            <div class="activity-detail-label">日期</div>
            <div>{{ dateText }}</div>
          </div>
          <div>
            <div class="activity-detail-label">時間</div>
            <div>{{ timeText }}</div>
          </div>
          <div v-if="activity.location">
            <div class="activity-detail-label">地點</div>
            <div>{{ activity.location }}</div>
          </div>
          <div v-if="activity.description">
            <div class="activity-detail-label">備註</div>
            <div class="activity-detail-description custom-scrollbar">
              {{ activity.description }}
            </div>
          </div>
        </div>

        <div class="activity-detail-badges">
          <span class="activity-detail-badge" :class="statusBadgeClass">
            {{ statusText }}
          </span>
          <span v-if="activity.participant_target" class="activity-detail-capacity">
            人數上限 {{ activity.participant_target }} 人
          </span>
          <span v-else class="activity-detail-capacity">沒有限制報名人數</span>
        </div>

        <div class="activity-detail-join">
          <div class="activity-detail-label">
            已報名 {{ activity.current_count }} /
            <span v-if="activity.participant_target">{{ activity.participant_target }}</span>
            <span v-else class="activity-detail-infinity">∞</span>
            人
          </div>
          <div class="activity-detail-participants">
            <div class="activity-detail-avatars">
              <template v-for="p in activity.participants.slice(0, 5)" :key="p.id">
                <img
                  v-if="p.avatar_url"
                  class="activity-detail-avatar"
                  :src="toAvatarSrc(p.avatar_url)"
                  alt=""
                />
                <div v-else class="activity-detail-avatar activity-detail-avatar--text">
                  {{ p.display_name?.slice(0, 2) ?? '?' }}
                </div>
              </template>
              <span
                v-if="activity.current_count > 5"
                class="activity-detail-avatar activity-detail-avatar--text"
              >
                +{{ activity.current_count - 5 }}
              </span>
            </div>
            <span
              v-if="
                activity.status === 'recruiting' &&
                activity.participant_target &&
                activity.participant_target - activity.current_count > 0
              "
              class="activity-detail-needed"
            >
              還差 {{ activity.participant_target - activity.current_count }} 人
            </span>
          </div>
        </div>

        <div
          v-if="
            activity.requires_voting && activity.status === 'recruiting' && !activity.is_creator
          "
          class="activity-detail-options"
        >
          <template v-if="isScenarioCMode">
            <div class="activity-detail-label">
              {{ activity.has_joined ? '你已選擇的日期' : '選擇你方便的日期' }}
            </div>
            <div v-if="selectedScenarioCDateLabels.length" class="activity-detail-date-list">
              <span v-for="date in selectedScenarioCDateLabels" :key="date">{{ date }}</span>
            </div>
            <div v-else class="activity-detail-muted">尚未選擇日期</div>
          </template>
          <template v-else-if="isScenarioDMode">
            <div class="activity-detail-label">
              {{ activity.has_joined ? '你已選擇的候選時段' : '選擇你方便的候選時段' }}
            </div>
            <div v-if="selectedScenarioDSlotLabels.length" class="activity-detail-date-list">
              <span v-for="label in selectedScenarioDSlotLabels" :key="label">{{ label }}</span>
            </div>
            <div v-else class="activity-detail-muted">
              {{ activity.has_joined ? '尚未選擇候選時段' : '點擊下方報名參加，選擇你方便的候選時段' }}
            </div>
          </template>
          <template v-else-if="isRangeMode">
            <div class="activity-detail-label">
              {{ activity.has_joined ? '你已回報的時間' : '選擇你方便的時間' }}
            </div>
            <div v-if="myRangesSummaryLabels.length" class="activity-detail-date-list">
              <span v-for="label in myRangesSummaryLabels" :key="label">{{ label }}</span>
            </div>
            <div v-else class="activity-detail-muted">
              {{ activity.has_joined ? '尚未回報時間' : '點擊下方報名參加，回報你方便的時間' }}
            </div>
          </template>
          <template v-else>
            <div class="activity-detail-label">
              {{ activity.has_joined ? '你選擇的候選時段' : '選擇你方便的候選時段（可複選）' }}
            </div>
            <label
              v-for="slot in activity.candidate_slots"
              :key="slot.id"
              class="activity-detail-option"
            >
              <input
                type="checkbox"
                :value="slot.id"
                v-model="selectedJoinSlotIds"
                :disabled="activity.has_joined"
              />
              <span>{{ slotText(slot) }}</span>
            </label>
          </template>
        </div>

        <div
          v-if="
            isScenarioCMode &&
            activity.has_joined &&
            (activity.status === 'voting' || activity.status === 'confirmed')
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">你已選擇的日期</div>
          <div v-if="selectedScenarioCDateLabels.length" class="activity-detail-date-list">
            <span v-for="date in selectedScenarioCDateLabels" :key="date">{{ date }}</span>
          </div>
          <div v-else class="activity-detail-muted">尚未選擇日期</div>
        </div>

        <div
          v-if="
            isScenarioDMode &&
            activity.has_joined &&
            (activity.status === 'voting' || activity.status === 'confirmed')
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">你已選擇的候選時段</div>
          <div v-if="selectedScenarioDSlotLabels.length" class="activity-detail-date-list">
            <span v-for="label in selectedScenarioDSlotLabels" :key="label">{{ label }}</span>
          </div>
          <div v-else class="activity-detail-muted">尚未選擇候選時段</div>
        </div>

        <div
          v-if="
            activity.requires_voting &&
            ((activity.status === 'recruiting' && activity.is_creator) ||
              activity.status === 'voting')
          "
          class="activity-detail-options"
        >
          <template v-if="!isRangeMode && isScenarioDMode">
            <div class="activity-detail-label">{{ decisionSectionLabel }}</div>
            <template v-for="group in scenarioDCandidateGroups" :key="group.candidateSlotId">
              <div class="activity-detail-label">{{ group.label }}</div>

              <div class="activity-detail-label">完全重疊</div>
              <label
                v-for="seg in group.perfect"
                :key="seg.radioId"
                class="activity-detail-option activity-detail-option--spread"
                :class="{ 'activity-detail-option--selected': selectedDecisionSlotId === seg.radioId }"
              >
                <span>
                  <input
                    v-if="activity.is_creator"
                    type="radio"
                    name="decision-slot"
                    :value="seg.radioId"
                    v-model="selectedDecisionSlotId"
                  />
                  {{ slotText(seg) }}
                </span>
                <span>{{ seg.count }} 票</span>
              </label>

              <div class="activity-detail-label">部分重疊</div>
              <label
                v-for="seg in group.partial"
                :key="seg.radioId"
                class="activity-detail-option activity-detail-option--spread"
                :class="{ 'activity-detail-option--selected': selectedDecisionSlotId === seg.radioId }"
              >
                <span>
                  <input
                    v-if="activity.is_creator"
                    type="radio"
                    name="decision-slot"
                    :value="seg.radioId"
                    v-model="selectedDecisionSlotId"
                  />
                  {{ slotText(seg) }}
                </span>
                <span>{{ seg.count }} 票</span>
              </label>
            </template>
          </template>

          <template v-else-if="!isRangeMode">
            <div class="activity-detail-label">{{ decisionSectionLabel }}</div>
            <label
              v-for="slot in activity.decision_candidates"
              :key="slot.id"
              class="activity-detail-option activity-detail-option--spread"
              :class="{ 'activity-detail-option--selected': selectedDecisionSlotId === slot.id }"
            >
              <span>
                <input
                  v-if="activity.is_creator"
                  type="radio"
                  name="decision-slot"
                  :value="slot.id"
                  v-model="selectedDecisionSlotId"
                />
                {{ slotText(slot) }}
              </span>
              <span>{{ slot.count }} 票</span>
            </label>
          </template>

          <template v-else>
            <div class="activity-detail-label">完全重疊</div>
            <label
              v-for="slot in perfectOverlapCandidates"
              :key="slot.id"
              class="activity-detail-option activity-detail-option--spread"
              :class="{ 'activity-detail-option--selected': selectedDecisionSlotId === slot.id }"
            >
              <span>
                <input
                  v-if="activity.is_creator"
                  type="radio"
                  name="decision-slot"
                  :value="slot.id"
                  v-model="selectedDecisionSlotId"
                />
                {{ slotText(slot) }}
              </span>
              <span>{{ slot.count }} 票</span>
            </label>

            <div class="activity-detail-label">部分重疊</div>
            <label
              v-for="slot in partialOverlapCandidates"
              :key="slot.id"
              class="activity-detail-option activity-detail-option--spread"
              :class="{ 'activity-detail-option--selected': selectedDecisionSlotId === slot.id }"
            >
              <span>
                <input
                  v-if="activity.is_creator"
                  type="radio"
                  name="decision-slot"
                  :value="slot.id"
                  v-model="selectedDecisionSlotId"
                />
                {{ slotText(slot) }}
              </span>
              <span>{{ slot.count }} 票</span>
            </label>
          </template>
        </div>

        <p v-if="actionError" class="activity-detail-error">{{ actionError }}</p>
      </template>
    </section>

    <footer v-if="activity" class="activity-detail-footer">
      <div v-if="successMessage" class="activity-detail-success">
        <span>{{ successMessage }}</span>
      </div>

      <template v-else>
        <template
          v-if="
            activity?.is_creator && activity.status === 'recruiting' && !activity.requires_voting
          "
        >
          <PixelButton type="button" :disabled="actionLoading" @click="handleConfirmFormation">
            {{ actionLoading ? '處理中...' : '立即成團' }}
          </PixelButton>
          <PixelButton
            variant="danger"
            type="button"
            :disabled="actionLoading"
            @click="handleCancel"
          >
            取消活動
          </PixelButton>
        </template>

        <template
          v-else-if="
            activity?.is_creator && activity.status === 'recruiting' && activity.requires_voting
          "
        >
          <PixelButton
            type="button"
            :disabled="actionLoading || !selectedDecisionSlotId"
            @click="handleConfirmFormation"
          >
            {{ actionLoading ? '處理中...' : '提前成團' }}
          </PixelButton>
          <PixelButton
            variant="danger"
            type="button"
            :disabled="actionLoading"
            @click="handleCancel"
          >
            取消活動
          </PixelButton>
        </template>

        <template v-else-if="activity?.is_creator && activity.status === 'voting'">
          <PixelButton
            type="button"
            :disabled="actionLoading || !selectedDecisionSlotId"
            @click="handleConfirmFormation"
          >
            {{ actionLoading ? '處理中...' : '確認此時段成團' }}
          </PixelButton>
          <PixelButton
            variant="danger"
            type="button"
            :disabled="actionLoading"
            @click="handleCancel"
          >
            取消活動
          </PixelButton>
        </template>

        <template v-else-if="activity && !activity.is_creator">
          <PixelButton
            v-if="activity.status === 'recruiting' && !activity.has_joined"
            type="button"
            :disabled="
              actionLoading ||
              (activity.requires_voting &&
                !isRangeMode &&
                !isScenarioCMode &&
                !isScenarioDMode &&
                selectedJoinSlotIds.length === 0)
            "
            @click="handleJoin"
          >
            {{ actionLoading ? '處理中...' : '報名參加' }}
          </PixelButton>
          <PixelButton
            v-else-if="activity.status === 'recruiting' && activity.has_joined && isScenarioCMode"
            type="button"
            :disabled="actionLoading"
            @click="openScenarioCPicker"
          >
            {{ actionLoading ? '處理中...' : '修改日期' }}
          </PixelButton>
          <PixelButton
            v-else-if="activity.status === 'recruiting' && activity.has_joined && isScenarioDMode"
            type="button"
            :disabled="actionLoading"
            @click="openScenarioDPicker"
          >
            {{ actionLoading ? '處理中...' : '修改報名時段' }}
          </PixelButton>
          <PixelButton
            v-else-if="activity.status === 'recruiting' && activity.has_joined && isRangeMode"
            type="button"
            :disabled="actionLoading"
            @click="openRangePicker"
          >
            {{ actionLoading ? '處理中...' : '修改時間' }}
          </PixelButton>
          <PixelButton
            v-else-if="activity.status === 'recruiting' && activity.has_joined"
            variant="white"
            type="button"
            :disabled="actionLoading"
            @click="handleCancelJoin"
          >
            取消報名
          </PixelButton>
          <span
            v-else-if="activity.status === 'voting' && activity.has_joined"
            class="activity-detail-badge"
          >
            已報名
          </span>
        </template>
      </template>
    </footer>
  </article>

  <AvailabilityPickerModal
    v-if="(isRangeMode || isScenarioCMode || isScenarioDMode) && activity"
    v-model="showAvailabilityPicker"
    :range-start="availabilityPickerRangeStart"
    :range-end="availabilityPickerRangeEnd"
    :fixed-date="activity.fixed_date"
    :time-window-start="activity.time_window_start"
    :time-window-end="activity.time_window_end"
    :allowed-dates="isScenarioDMode ? scenarioDAvailableCandidateDates : scenarioCAvailableCandidateDates"
    :date-only="isScenarioCMode"
    :date-windows="isScenarioDMode ? scenarioDDateWindows : {}"
    :fixed-time-label="scenarioCFixedTimeLabel"
    :initial-dates="isScenarioCMode ? scenarioCInitialDates : []"
    :initial-ranges="isRangeMode ? myRangesInitial : isScenarioDMode ? scenarioDInitialRanges : []"
    @confirm="handlePickerConfirm"
  />
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PixelButton from './ui/PixelButton.vue'
import AvailabilityPickerModal from './AvailabilityPickerModal.vue'
import { toAvatarSrc } from '@/utils/avatar'

const props = defineProps({
  isOpen: Boolean,
  activityId: { type: String, default: null },
  // 是否顯示右上角的關閉按鈕（包在 modal 裡才需要；ActivityView.vue 直接內嵌時不需要）
  closable: { type: Boolean, default: false },
})

const emit = defineEmits(['status-changed', 'close'])

const activity = ref(null)
const loading = ref(false)
const fetchError = ref('')
const actionLoading = ref(false)
const actionError = ref('')
const successMessage = ref(null)
const selectedJoinSlotIds = ref([])
const selectedDecisionSlotId = ref(null)
const showAvailabilityPicker = ref(false)

const isRangeMode = computed(() => activity.value?.availability_mode === 'range')
const isScenarioCMode = computed(() => activity.value?.schedule_variant === 'find_date')
const isScenarioDMode = computed(() => activity.value?.schedule_variant === 'find_date_time')

function toLocalDateKey(value) {
  const date = new Date(value)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate(),
  ).padStart(2, '0')}`
}

const scenarioCSlotByDate = computed(() => {
  const map = new Map()
  for (const slot of activity.value?.candidate_slots ?? []) {
    map.set(toLocalDateKey(slot.slot_start), slot.id)
  }
  return map
})

const scenarioCCandidateDates = computed(() => [...scenarioCSlotByDate.value.keys()].sort())

// 已經過去的候選日期不該再讓報名者選——那天已經開始/結束了，選了也沒有意義，
// 投票理應開放到最晚候選日（後端 vote_deadline_at 的判定基準），過期的候選日提早濾掉
const scenarioCAvailableCandidateDates = computed(() => {
  const now = new Date()
  const slots = activity.value?.candidate_slots ?? []
  return scenarioCCandidateDates.value.filter((date) => {
    const slotId = scenarioCSlotByDate.value.get(date)
    const slot = slots.find((s) => s.id === slotId)
    return slot && new Date(slot.slot_start) > now
  })
})

const scenarioCSelectedDates = computed(() =>
  (activity.value?.candidate_slots ?? [])
    .filter((slot) => slot.is_selected)
    .map((slot) => toLocalDateKey(slot.slot_start))
    .sort(),
)

const scenarioCInitialDates = computed(() => {
  if (scenarioCSelectedDates.value.length) return scenarioCSelectedDates.value
  return selectedJoinSlotIds.value
    .map((slotId) => (activity.value?.candidate_slots ?? []).find((slot) => slot.id === slotId))
    .filter(Boolean)
    .map((slot) => toLocalDateKey(slot.slot_start))
    .sort()
})

function toHHMM(date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 「修改時間」重開 picker 時，把後端回傳的 my_ranges（純 start/end ISO 字串）
// 轉成 AvailabilityPickerModal 的 initialRanges 形狀，讓 picker 能還原參與者自己先前的答案
const myRangesInitial = computed(() =>
  (activity.value?.my_ranges ?? []).map((r) => {
    const start = new Date(r.start)
    const end = new Date(r.end)
    return { date: toLocalDateKey(r.start), from: toHHMM(start), to: toHHMM(end) }
  }),
)

// range 模式（情境二）已報名者自己回報的時間摘要，格式跟情境三的日期 chip 呼應，
// 例如「7/12 下午 6:00–下午 9:00」
const myRangesSummaryLabels = computed(() =>
  (activity.value?.my_ranges ?? []).map((r) => {
    const start = new Date(r.start)
    const end = new Date(r.end)
    return `${formatDateKey(toLocalDateKey(r.start))} ${formatTime(start)}–${formatTime(end)}`
  }),
)

const selectedScenarioCDateLabels = computed(() =>
  scenarioCSelectedDates.value.map((date) => formatDateKey(date)),
)

const scenarioCFixedTimeLabel = computed(() => {
  const slots = activity.value?.candidate_slots ?? []
  if (!slots.length) return ''
  if (slots.every((slot) => slot.all_day)) return '整日'
  const start = new Date(slots[0].slot_start)
  const end = new Date(slots[0].slot_end)
  return `${formatTime(start)} – ${formatTime(end)}`
})

// 情境四：把 candidate_slots 依日期整理成 AvailabilityPickerModal 的 dateWindows 形狀，
// 一個候選日期只對應一個窗口（建立時已經擋掉同一天多筆候選時段）
const scenarioDDateWindows = computed(() => {
  const map = {}
  for (const slot of activity.value?.candidate_slots ?? []) {
    const date = toLocalDateKey(slot.slot_start)
    map[date] = {
      start: toHHMM(new Date(slot.slot_start)),
      end: toHHMM(new Date(slot.slot_end)),
      slotId: slot.id,
    }
  }
  return map
})

const scenarioDCandidateDates = computed(() => Object.keys(scenarioDDateWindows.value).sort())

// 已經過去的候選日期不該再讓報名者選，比照情境三的邏輯
const scenarioDAvailableCandidateDates = computed(() => {
  const now = new Date()
  const slots = activity.value?.candidate_slots ?? []
  return scenarioDCandidateDates.value.filter((date) =>
    slots.some((slot) => toLocalDateKey(slot.slot_start) === date && new Date(slot.slot_start) > now),
  )
})

// 「修改報名時段」重開 picker 時，把每個候選時段自己的 my_range 轉成 initialRanges 形狀，
// 讓 picker 能還原參與者先前選取的實際子區間——情境四的預填資料在 candidate_slots[].my_range，
// 不是只有 range 模式在用的頂層 my_ranges（那個欄位對情境四永遠是空陣列）
const scenarioDInitialRanges = computed(() =>
  (activity.value?.candidate_slots ?? [])
    .filter((slot) => slot.my_range)
    .map((slot) => ({
      date: toLocalDateKey(slot.slot_start),
      from: toHHMM(new Date(slot.my_range.start)),
      to: toHHMM(new Date(slot.my_range.end)),
    })),
)

const selectedScenarioDSlotLabels = computed(() =>
  (activity.value?.candidate_slots ?? []).filter((slot) => slot.is_selected).map((slot) => slotText(slot)),
)

const availabilityPickerRangeStart = computed(() => {
  if (isScenarioCMode.value && scenarioCCandidateDates.value.length) {
    return scenarioCCandidateDates.value[0]
  }
  if (isScenarioDMode.value && scenarioDCandidateDates.value.length) {
    return scenarioDCandidateDates.value[0]
  }
  return activity.value?.range_start ?? '2026-07-10'
})

const availabilityPickerRangeEnd = computed(() => {
  if (isScenarioCMode.value && scenarioCCandidateDates.value.length) {
    return scenarioCCandidateDates.value[scenarioCCandidateDates.value.length - 1]
  }
  if (isScenarioDMode.value && scenarioDCandidateDates.value.length) {
    return scenarioDCandidateDates.value[scenarioDCandidateDates.value.length - 1]
  }
  return activity.value?.range_end ?? '2026-07-16'
})

const perfectOverlapCandidates = computed(() =>
  (activity.value?.decision_candidates?.perfect_overlap ?? []).map((c, i) => ({
    ...c,
    id: `temp-perfect-${i}`,
  })),
)
const partialOverlapCandidates = computed(() =>
  (activity.value?.decision_candidates?.partial_overlap ?? []).map((c, i) => ({
    ...c,
    id: `temp-partial-${i}`,
  })),
)

// 情境四：decision_candidates 是扁平陣列，每筆候選時段自己還有一組 perfect_overlap/partial_overlap，
// 巢狀顯示在對應候選時段底下。radioId 用候選時段 id 當前綴組出來，保證跨候選時段不會撞號
// （單一候選時段內的 segment id 已經是各自唯一的 slot_start ISO 字串）
const scenarioDCandidateGroups = computed(() =>
  (activity.value?.decision_candidates ?? []).map((slot) => ({
    candidateSlotId: slot.id,
    label: slotText(slot),
    perfect: (slot.perfect_overlap ?? []).map((seg) => ({ ...seg, radioId: `${slot.id}::${seg.id}` })),
    partial: (slot.partial_overlap ?? []).map((seg) => ({ ...seg, radioId: `${slot.id}::${seg.id}` })),
  })),
)

let activeFetchController = null

function formatShortDate(date) {
  return `${date.getMonth() + 1}/${date.getDate()}`
}

const panelDate = computed(() => {
  const a = activity.value
  if (!a) return ''
  if (a.confirmed_slot) {
    return formatShortDate(new Date(a.confirmed_slot.slot_start))
  }
  // range 模式（情境二）沒有 candidate_slots 也沒有 confirmed_slot 可以推導日期——
  // 日期本來就是固定的，直接讀 fixed_date，不然標題完全不會顯示是哪一天
  if (isRangeMode.value && a.fixed_date) {
    return formatDateKey(a.fixed_date)
  }
  if (a.candidate_slots?.length) {
    // 候選時段可能橫跨多個日期（情境三、四），標題要顯示完整的日期區間，不能只看第一筆
    const starts = a.candidate_slots.map((slot) => new Date(slot.slot_start).getTime())
    const minText = formatShortDate(new Date(Math.min(...starts)))
    const maxText = formatShortDate(new Date(Math.max(...starts)))
    return minText === maxText ? minText : `${minText} ~ ${maxText}`
  }
  return ''
})

// 卡片改成「日期」「時間」兩個獨立標籤欄位，各自依情境顯示實際值或「投票/回報中」狀態，
// 不再把兩者的資訊混在同一個「時間」欄位裡（例如 Mode C 的時間欄位曾經要同時塞固定時間
// 又附註日期投票中，Mode B 完全沒有欄位顯示日期）
function timeOnlyText(slot) {
  if (!slot) return ''
  if (slot.all_day) return '整天'
  return `${formatTime(new Date(slot.slot_start))} – ${formatTime(new Date(slot.slot_end))}`
}

const dateText = computed(() => {
  const a = activity.value
  if (!a) return ''
  if (a.confirmed_slot) return formatShortDate(new Date(a.confirmed_slot.slot_start))
  // Mode B（range 模式）的日期本來就是固定的，不會投票，直接讀 fixed_date
  if (isRangeMode.value) return a.fixed_date ? formatDateKey(a.fixed_date) : ''
  // Mode C 的日期還沒定，時間才是固定的
  if (isScenarioCMode.value) return '日期投票中'
  if (a.candidate_slots?.length) {
    const starts = a.candidate_slots.map((slot) => new Date(slot.slot_start).getTime())
    const minText = formatShortDate(new Date(Math.min(...starts)))
    const maxText = formatShortDate(new Date(Math.max(...starts)))
    return minText === maxText ? minText : `${minText} ~ ${maxText}`
  }
  return ''
})

const timeText = computed(() => {
  const a = activity.value
  if (!a) return '時間未設定'
  if (a.confirmed_slot) return timeOnlyText(a.confirmed_slot)
  // Mode C 的時間本來就是固定的，投票的是日期，不是時段——不能顯示「候選時段投票中」，
  // 那句話的意思是時間還沒定，跟 Mode C 的實際狀況相反，而且會藏掉使用者最需要的固定時間資訊
  if (isScenarioCMode.value) return scenarioCFixedTimeLabel.value || '時間未設定'
  // range 模式（情境二）是回報一段連續可用時間，沒有離散的候選清單可以「投票」，
  // 「候選時段投票中」的語氣會讓人誤以為有清單可以勾選
  if (isRangeMode.value) return '時段回報中'
  if (a.requires_voting) return '候選時段投票中'
  if (a.candidate_slots?.[0]) return timeOnlyText(a.candidate_slots[0])
  return '時間未設定'
})

function slotText(slot) {
  if (!slot) return ''
  const start = new Date(slot.slot_start)
  if (slot.all_day) return `${start.getMonth() + 1}/${start.getDate()} 整天`
  const end = new Date(slot.slot_end)
  return `${formatDateTime(start)} - ${formatTime(end)}`
}

// 票數並列最高或全部都是 0 票時回傳 null，不自動幫建立者做決定；只有唯一一個候選時段票數最高時才回傳它的 id
function soleLeaderId(candidates) {
  if (!candidates.length) return null
  const maxCount = Math.max(...candidates.map((c) => c.count))
  if (maxCount === 0) return null
  const leaders = candidates.filter((c) => c.count === maxCount)
  return leaders.length === 1 ? leaders[0].id : null
}

const statusText = computed(() => {
  const map = {
    recruiting: '揪團中',
    voting: '建立者決選中',
    confirmed: '已成團',
    cancelled: '已取消',
  }
  return map[activity.value?.status] ?? activity.value?.status
})

const decisionSectionLabel = computed(() => {
  // 建立者現在可以從完整清單自由選，不再限制只能選並列最高票，voting 狀態的文案不能再暗示「只能選最高票」
  const map = {
    recruiting: '候選時段（目前票數，可提前手動成團）',
    voting: '候選時段（依票數排序，由建立者自由選擇）',
  }
  return map[activity.value?.status] ?? '候選時段'
})

const statusBadgeClass = computed(() => {
  const map = {
    recruiting: 'activity-detail-badge--recruiting',
    voting: 'activity-detail-badge--light',
    confirmed: 'activity-detail-badge--confirmed',
    cancelled: 'activity-detail-badge--cancelled',
  }
  return map[activity.value?.status] ?? ''
})

watch(
  () => [props.isOpen, props.activityId],
  ([open, id]) => {
    if (open && id) fetchActivity(id)
    else if (!open) resetPanel()
  },
  { immediate: true },
)

async function fetchActivity(id) {
  if (activeFetchController) activeFetchController.abort()
  const controller = new AbortController()
  activeFetchController = controller

  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${id}`, {
      credentials: 'include',
      signal: controller.signal,
    })
    if (!res.ok) {
      fetchError.value = res.status === 404 ? '找不到此活動' : '載入失敗'
      return
    }
    const data = await res.json()
    activity.value = data.activity
    // 用後端回傳的 is_selected 還原使用者自己先前的勾選狀態，讓她點回活動頁面時看到的還是原本的答案
    selectedJoinSlotIds.value = (data.activity.candidate_slots ?? [])
      .filter((slot) => slot.is_selected)
      .map((slot) => slot.id)
    // 只有唯一一個候選時段票數最高時不用強迫建立者多點一次圈圈，直接預選好讓她能馬上按下成團——
    // decision_candidates 現在回傳完整排名清單，不能再用「陣列長度是不是 1」判斷，要實際比較票數；
    // range 模式的 decision_candidates 是 {perfect_overlap, partial_overlap} 物件，不適用；
    // 情境四是巢狀結構（每個候選時段底下還有自己的窄窗口），自動預選的窄窗口意義不明確，不自動選
    const decisionCandidates = data.activity.decision_candidates
    selectedDecisionSlotId.value =
      Array.isArray(decisionCandidates) && !isScenarioDMode.value
        ? soleLeaderId(decisionCandidates)
        : null
  } catch (err) {
    if (err.name === 'AbortError') return
    fetchError.value = '無法連線到伺服器'
  } finally {
    if (controller === activeFetchController) {
      loading.value = false
    }
  }
}

async function callAction(path, method = 'POST', successMsg = '', body = undefined) {
  actionLoading.value = true
  actionError.value = ''
  try {
    const res = await fetch(
      `${import.meta.env.VITE_API_URL}/api/activities/${props.activityId}/${path}`,
      {
        method,
        credentials: 'include',
        ...(body
          ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }
          : {}),
      },
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      actionError.value = data.message || '操作失敗'
      return false
    }
    if (successMsg) {
      successMessage.value = successMsg
      setTimeout(() => {
        successMessage.value = null
        emit('status-changed')
      }, 1000)
    } else {
      await fetchActivity(props.activityId)
      emit('status-changed')
    }
    return true
  } catch {
    actionError.value = '無法連線到伺服器'
    return false
  } finally {
    actionLoading.value = false
  }
}

async function handleJoin() {
  if (isRangeMode.value) {
    showAvailabilityPicker.value = true
    return
  }
  if (isScenarioCMode.value) {
    openScenarioCPicker()
    return
  }
  if (isScenarioDMode.value) {
    openScenarioDPicker()
    return
  }
  if (activity.value?.requires_voting) {
    if (selectedJoinSlotIds.value.length === 0) {
      actionError.value = '請選擇至少一個候選時段'
      return
    }
    await callAction('join', 'POST', '✅ 報名成功！', {
      candidateSlotIds: selectedJoinSlotIds.value,
    })
    return
  }
  await callAction('join', 'POST', '✅ 報名成功！')
}

function openScenarioCPicker() {
  showAvailabilityPicker.value = true
}

function openScenarioDPicker() {
  showAvailabilityPicker.value = true
}

function openRangePicker() {
  showAvailabilityPicker.value = true
}

async function handleAvailabilityConfirm(entries) {
  const ranges = entries.flatMap((entry) => {
    if (entry.allDay) {
      return [{ start: `${entry.date}T00:00:00`, end: `${entry.date}T23:59:00` }]
    }
    return entry.timeRanges.map((r) => ({
      start: `${entry.date}T${r.from}:00`,
      end: `${entry.date}T${r.to}:00`,
    }))
  })
  await callAction('join', 'POST', '✅ 報名成功！', { ranges })
}

async function handlePickerConfirm(entries) {
  if (isScenarioCMode.value) {
    await handleScenarioCDateConfirm(entries)
    return
  }
  if (isScenarioDMode.value) {
    await handleScenarioDConfirm(entries)
    return
  }
  await handleAvailabilityConfirm(entries)
}

async function handleScenarioCDateConfirm(entries) {
  const candidateSlotIds = entries
    .map((entry) => scenarioCSlotByDate.value.get(entry.date))
    .filter(Boolean)
  if (candidateSlotIds.length === 0) {
    actionError.value = '請選擇至少一個候選日期'
    return
  }
  await callAction('join', 'POST', '✅ 報名成功！', { candidateSlotIds })
}

// 情境四：把 picker 回傳的每筆 range 對照 scenarioDDateWindows 反查回它落在哪個候選時段窗口，
// 組成 candidateSlotIds（既有欄位）連同 candidateSlotRanges（子區間細節）一起送出。
// 欄位名稱要跟後端 join API 的 contract 一致：candidateSlotId/rangeStart/rangeEnd（不是 slotId/start/end）
async function handleScenarioDConfirm(entries) {
  const candidateSlotIds = []
  const candidateSlotRanges = []
  for (const entry of entries) {
    const window = scenarioDDateWindows.value[entry.date]
    // 理論上不會發生：picker 的可選時間本來就被 hourOptions 限制在窗口內
    if (!window) continue
    for (const range of entry.timeRanges) {
      if (!(range.from >= window.start && range.to <= window.end)) continue
      candidateSlotIds.push(window.slotId)
      candidateSlotRanges.push({
        candidateSlotId: window.slotId,
        rangeStart: `${entry.date}T${range.from}:00`,
        rangeEnd: `${entry.date}T${range.to}:00`,
      })
    }
  }
  if (candidateSlotIds.length === 0) {
    actionError.value = '請選擇至少一個候選時段'
    return
  }
  await callAction('join', 'POST', '✅ 報名成功！', { candidateSlotIds, candidateSlotRanges })
}

async function handleCancelJoin() {
  await callAction('join', 'DELETE', '✅ 已取消報名')
}

async function handleConfirmFormation() {
  if (isRangeMode.value) {
    if (!selectedDecisionSlotId.value) {
      actionError.value = '請選擇要確認的候選時段'
      return
    }
    const candidate = [...perfectOverlapCandidates.value, ...partialOverlapCandidates.value].find(
      (c) => c.id === selectedDecisionSlotId.value,
    )
    if (!candidate) return
    await callAction('confirm-formation', 'POST', '✅ 成團成功！', {
      slotStart: candidate.slot_start,
      slotEnd: candidate.slot_end,
    })
    return
  }
  if (isScenarioDMode.value) {
    if (!selectedDecisionSlotId.value) {
      actionError.value = '請選擇要確認的候選時段'
      return
    }
    const group = scenarioDCandidateGroups.value.find((g) =>
      [...g.perfect, ...g.partial].some((seg) => seg.radioId === selectedDecisionSlotId.value),
    )
    const segment = group && [...group.perfect, ...group.partial].find((seg) => seg.radioId === selectedDecisionSlotId.value)
    if (!group || !segment) return
    await callAction('confirm-formation', 'POST', '✅ 成團成功！', {
      candidateSlotId: group.candidateSlotId,
      slotStart: segment.slot_start,
      slotEnd: segment.slot_end,
    })
    return
  }
  if (activity.value?.requires_voting) {
    if (!selectedDecisionSlotId.value) {
      actionError.value = '請選擇要確認的候選時段'
      return
    }
    await callAction('confirm-formation', 'POST', '✅ 成團成功！', {
      candidateSlotId: selectedDecisionSlotId.value,
    })
    return
  }
  await callAction('confirm-formation', 'POST', '✅ 成團成功！')
}

async function handleCancel() {
  await callAction('cancel', 'POST', '✅ 活動已取消')
}

function resetPanel() {
  if (activeFetchController) activeFetchController.abort()
  activity.value = null
  fetchError.value = ''
  actionError.value = ''
  selectedJoinSlotIds.value = []
  selectedDecisionSlotId.value = null
  showAvailabilityPicker.value = false
}

function formatDateTime(date) {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${m}/${d} ${formatTime(date)}`
}

function formatDateKey(dateKey) {
  const [, month, day] = dateKey.split('-')
  return `${parseInt(month)}/${parseInt(day)}`
}

function formatTime(date) {
  const h = date.getHours()
  const min = date.getMinutes()
  const period = h < 12 ? '上午' : '下午'
  const hour = h % 12 || 12
  return `${period} ${hour}:${String(min).padStart(2, '0')}`
}
</script>

<style scoped>
.activity-detail-panel {
  --activity-detail-scale: 1;
  --activity-detail-lift: 0px;
  width: min(324px, 72vw);
  max-height: 100%;
  border-radius: 1px;
  background: var(--activity-focus-bg, #a5dcfb);
  color: var(--bujo-ink);
  display: flex;
  flex-direction: column;
  overflow: hidden;
  box-shadow: 5px 6px 10px rgb(var(--bujo-ink-rgb) / 0.12);
  transform: translateY(var(--activity-detail-lift)) scale(var(--activity-detail-scale));
  transform-origin: center center;
  transition:
    transform 160ms ease,
    filter 160ms ease,
    box-shadow 160ms ease;
}

.activity-detail-panel:hover {
  --activity-detail-lift: -5px;
  filter: saturate(1.02);
  box-shadow: 7px 9px 12px rgb(var(--bujo-ink-rgb) / 0.18);
}

.activity-focus-card--mine-recruiting {
  --activity-focus-bg: var(--bujo-card-pink);
}

.activity-focus-card--mine-confirmed {
  --activity-focus-bg: var(--bujo-card-blue);
}

.activity-focus-card--joined {
  --activity-focus-bg: var(--bujo-card-blue);
}

.activity-focus-card--recruiting {
  --activity-focus-bg: var(--bujo-accent);
}

.activity-focus-card--confirmed {
  --activity-focus-bg: var(--bujo-card-yellow);
}

.activity-focus-card--neutral {
  --activity-focus-bg: var(--bujo-white);
  border: 1px solid var(--bujo-line);
}

.activity-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 17px 20px 9px;
  flex: 0 0 auto;
}

.activity-detail-kicker {
  margin-bottom: 7px;
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  opacity: 0.65;
}

.activity-detail-header h2 {
  margin: 0;
  color: var(--bujo-ink);
  font-size: clamp(24px, 2.35vw, 32px);
  line-height: 1.05;
  font-weight: 700;
}

.activity-detail-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 2px;
}

.activity-detail-date {
  color: rgba(var(--bujo-ink-rgb), 0.72);
  font-family: 'Space Mono', monospace;
  font-size: 25px;
  line-height: 1;
  font-weight: 700;
  white-space: nowrap;
}

.activity-detail-close {
  display: grid;
  flex-shrink: 0;
  place-items: center;
  width: 18px;
  height: 18px;
  margin: -4px -4px 0 0;
  border: 0;
  background: transparent;
  color: rgba(var(--bujo-ink-rgb), 0.5);
  font-size: 15px;
  line-height: 1;
  transition: color 150ms ease;
}

.activity-detail-close:hover {
  color: var(--bujo-ink);
}

.activity-detail-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 12px 20px 14px;
  scrollbar-width: none;
}

.activity-detail-body::-webkit-scrollbar {
  display: none;
}

.activity-detail-state {
  padding: 56px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 700;
}

.activity-detail-state--error,
.activity-detail-error {
  color: #dc2626;
}

.activity-detail-creator,
.activity-detail-participants,
.activity-detail-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-detail-creator {
  margin-bottom: 14px;
  font-size: 14px;
  font-weight: 600;
}

.activity-detail-avatar {
  width: 25px;
  height: 25px;
  border: 1px solid var(--bujo-ink);
  background: var(--bujo-white);
  display: inline-flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
  color: var(--bujo-ink);
  font-size: 9px;
  font-weight: 700;
  overflow: hidden;
}

.activity-detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-detail-info,
.activity-detail-options {
  display: grid;
  gap: 10px;
  font-size: 13px;
  line-height: 1.42;
  font-weight: 600;
}

.activity-detail-label {
  margin-bottom: 3px;
  color: rgba(var(--bujo-ink-rgb), 0.62);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.activity-detail-infinity {
  display: inline-block;
  font-size: 2em;
  font-weight: 400;
  line-height: 1;
  vertical-align: middle;
  transform: translateY(-3px);
}

.activity-detail-description {
  max-height: 4.5rem;
  overflow-y: auto;
  padding-right: 8px;
  white-space: pre-wrap;
}

.activity-detail-badges {
  margin-top: 14px;
  flex-wrap: wrap;
}

.activity-detail-badge,
.activity-detail-needed {
  border: 1px solid var(--bujo-ink);
  padding: 3px 8px;
  background: var(--bujo-white);
  font-size: 12px;
  font-weight: 700;
}

.activity-detail-badge--recruiting {
  background: #fff;
}

.activity-detail-badge--confirmed {
  background: var(--bujo-ink);
  color: var(--bujo-white);
}

.activity-detail-badge--light {
  background: rgba(251, 251, 248, 0.72);
}

.activity-detail-badge--cancelled {
  background: #e5e7eb;
  color: #6b7280;
}

.activity-detail-capacity {
  color: rgba(var(--bujo-ink-rgb), 0.68);
  font-size: 12px;
  font-weight: 600;
}

.activity-detail-join {
  margin-top: 14px;
  padding-bottom: 2px;
}

.activity-detail-avatars {
  display: flex;
  align-items: center;
}

.activity-detail-avatar + .activity-detail-avatar {
  margin-left: -5px;
}

.activity-detail-options {
  margin-top: 16px;
}

.activity-detail-date-list {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.activity-detail-date-list span {
  border: 1.5px solid var(--bujo-ink);
  background: var(--bujo-white);
  color: var(--bujo-ink);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
}

.activity-detail-muted {
  color: rgba(var(--bujo-ink-rgb), 0.58);
  font-size: 12px;
  font-weight: 700;
}

.activity-detail-option,
.activity-detail-option-read {
  border: 1px solid rgba(var(--bujo-ink-rgb), 0.32);
  background: rgba(var(--bujo-white-rgb), 0.35);
  padding: 8px 9px;
}

.activity-detail-option {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
}

.activity-detail-option--spread {
  justify-content: space-between;
}

.activity-detail-option--selected {
  border-color: var(--bujo-ink);
  background: rgba(var(--bujo-white-rgb), 0.62);
}

.activity-detail-error {
  margin: 12px 0 0;
  font-size: 12px;
  font-weight: 750;
}

.activity-detail-footer {
  flex: 0 0 auto;
  border-top: 1px solid rgba(var(--bujo-ink-rgb), 0.3);
  padding: 12px 20px 16px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.activity-detail-footer :deep(button) {
  background: transparent !important;
  color: var(--bujo-ink) !important;
  border: 1px solid var(--bujo-ink) !important;
  box-shadow: none !important;
  font-family: var(--bujo-font-body) !important;
  font-weight: 700 !important;
}

.activity-detail-footer :deep(button:hover) {
  background: var(--bujo-ink) !important;
  color: var(--bujo-white) !important;
}

.activity-detail-success {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(var(--bujo-white-rgb), 0.5);
  border: 1px solid rgba(var(--bujo-ink-rgb), 0.36);
  padding: 9px 10px;
  font-size: 14px;
  font-weight: 700;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: var(--bujo-ink);
  border: 1px solid var(--bujo-page);
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: var(--bujo-accent);
}

@media (max-width: 900px) {
  .activity-detail-panel {
    --activity-detail-scale: 1;
    width: min(100%, 360px);
    height: auto;
    max-height: clamp(340px, 45dvh, 430px);
    min-height: 250px;
  }

  .activity-detail-header,
  .activity-detail-footer {
    flex: 0 0 auto;
  }

  .activity-detail-footer {
    margin-top: auto;
    background: var(--activity-focus-bg, #a5dcfb);
    padding-bottom: 18px;
    position: relative;
    z-index: 2;
  }

  .activity-detail-body {
    flex: 1 1 auto;
    min-height: 0;
    overflow-y: auto;
    scrollbar-width: none;
  }

  .activity-detail-body::-webkit-scrollbar {
    display: none;
  }

  .activity-detail-panel:hover {
    --activity-detail-lift: 0px;
  }

  .activity-detail-description {
    scrollbar-width: none;
  }

  .activity-detail-description::-webkit-scrollbar {
    display: none;
  }
}
</style>
