<template>
  <article v-if="isOpen" class="activity-detail-panel">
    <header class="activity-detail-header">
      <div>
        <div class="activity-detail-kicker">ACTIVITY ROOM</div>
        <h2>{{ activity?.title || '活動詳情' }}</h2>
      </div>
      <span v-if="activity" class="activity-detail-date">{{ panelDate }}</span>
    </header>

    <section class="activity-detail-body">
      <div v-if="loading" class="activity-detail-state">載入中...</div>
      <div v-else-if="fetchError" class="activity-detail-state activity-detail-state--error">
        {{ fetchError }}
      </div>

      <template v-else-if="activity">
        <div class="activity-detail-cover">
          <svg class="h-12 w-12 text-[#4A5040]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z" />
          </svg>
        </div>

        <div class="activity-detail-creator">
          <div class="activity-detail-avatar">
            <img v-if="activity.creator.avatar_url" :src="activity.creator.avatar_url" alt="" />
            <span v-else>⭐</span>
          </div>
          <span>{{ activity.creator.display_name }} 發起</span>
        </div>

        <div class="activity-detail-info">
          <div>
            <div class="activity-detail-label">時間</div>
            <div>{{ scheduleText }}</div>
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
          <span v-if="activity.max_participants" class="activity-detail-capacity">
            人數上限 {{ activity.max_participants }} 人
          </span>
        </div>

        <div class="activity-detail-join">
          <div class="activity-detail-label">
            已報名 {{ activity.current_count }} 人{{
              activity.max_participants ? ` / ${activity.max_participants}` : ''
            }}
          </div>
          <div class="activity-detail-participants">
            <div class="activity-detail-avatars">
              <template v-for="p in activity.participants.slice(0, 5)" :key="p.id">
                <img
                  v-if="p.avatar_url"
                  class="activity-detail-avatar"
                  :src="p.avatar_url"
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
                activity.max_participants &&
                activity.max_participants - activity.current_count > 0
              "
              class="activity-detail-needed"
            >
              還差 {{ activity.max_participants - activity.current_count }} 人
            </span>
          </div>
        </div>

        <div
          v-if="
            activity.requires_voting &&
            activity.status === 'recruiting' &&
            !activity.is_creator &&
            !activity.has_joined
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">選擇你方便的候選時段（可複選）</div>
          <label
            v-for="slot in activity.candidate_slots"
            :key="slot.id"
            class="activity-detail-option"
          >
            <input type="checkbox" :value="slot.id" v-model="selectedJoinSlotIds" />
            <span>{{ slotText(slot) }}</span>
          </label>
        </div>

        <div
          v-else-if="activity.requires_voting && activity.status === 'recruiting'"
          class="activity-detail-options"
        >
          <div class="activity-detail-label">候選時段</div>
          <div
            v-for="slot in activity.candidate_slots"
            :key="slot.id"
            class="activity-detail-option-read"
          >
            {{ slotText(slot) }}
          </div>
        </div>

        <div
          v-if="
            activity.requires_voting &&
            (activity.status === 'voting' || activity.status === 'tiebreaking')
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">
            {{ activity.status === 'voting' ? '候選時段（並列最高票）' : '決選投票中' }}
          </div>
          <label
            v-for="slot in activity.decision_candidates"
            :key="slot.id"
            class="activity-detail-option activity-detail-option--spread"
            :class="{ 'activity-detail-option--selected': selectedDecisionSlotId === slot.id }"
          >
            <span>
              <input
                type="radio"
                name="decision-slot"
                :value="slot.id"
                v-model="selectedDecisionSlotId"
              />
              {{ slotText(slot) }}
            </span>
            <span>{{ slot.count }} 票</span>
          </label>
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
            activity?.is_creator &&
            (activity.status === 'voting' || activity.status === 'tiebreaking')
          "
        >
          <PixelButton
            type="button"
            :disabled="actionLoading || !selectedDecisionSlotId"
            @click="handleConfirmFormation"
          >
            {{ actionLoading ? '處理中...' : '確認此時段成團' }}
          </PixelButton>
          <PixelButton
            v-if="activity.status === 'voting'"
            variant="white"
            type="button"
            :disabled="actionLoading"
            @click="handleStartTiebreak"
          >
            發起決選投票
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
              actionLoading || (activity.requires_voting && selectedJoinSlotIds.length === 0)
            "
            @click="handleJoin"
          >
            {{ actionLoading ? '處理中...' : '報名參加' }}
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
          <PixelButton
            v-else-if="activity.status === 'tiebreaking' && activity.has_joined"
            type="button"
            :disabled="actionLoading || !selectedDecisionSlotId"
            @click="handleTiebreakVote"
          >
            {{ actionLoading ? '處理中...' : '送出決選投票' }}
          </PixelButton>
        </template>
      </template>
    </footer>
  </article>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import PixelButton from './ui/PixelButton.vue'

const props = defineProps({
  isOpen: Boolean,
  activityId: { type: String, default: null },
})

const emit = defineEmits(['status-changed'])

const activity = ref(null)
const loading = ref(false)
const fetchError = ref('')
const actionLoading = ref(false)
const actionError = ref('')
const successMessage = ref(null)
const selectedJoinSlotIds = ref([])
const selectedDecisionSlotId = ref(null)

const panelDate = computed(() => {
  const a = activity.value
  if (!a) return ''
  if (a.confirmed_slot) {
    const start = new Date(a.confirmed_slot.slot_start)
    return `${start.getMonth() + 1}/${start.getDate()}`
  }
  if (a.candidate_slots?.[0]) {
    const start = new Date(a.candidate_slots[0].slot_start)
    return `${start.getMonth() + 1}/${start.getDate()}`
  }
  return ''
})

const scheduleText = computed(() => {
  const a = activity.value
  if (!a) return '時間未設定'
  if (a.confirmed_slot) return slotText(a.confirmed_slot)
  if (a.requires_voting) return '候選時段投票中'
  if (a.candidate_slots?.[0]) return slotText(a.candidate_slots[0])
  return '時間未設定'
})

function slotText(slot) {
  if (!slot) return ''
  const start = new Date(slot.slot_start)
  if (slot.all_day) return `${start.getMonth() + 1}/${start.getDate()} 整天`
  const end = new Date(slot.slot_end)
  return `${formatDateTime(start)} - ${formatTime(end)}`
}

const statusText = computed(() => {
  const map = {
    recruiting: '揪團中',
    voting: '建立者決選中',
    tiebreaking: '決選投票中',
    confirmed: '已成團',
    cancelled: '已取消',
  }
  return map[activity.value?.status] ?? activity.value?.status
})

const statusBadgeClass = computed(() => {
  const map = {
    recruiting: 'activity-detail-badge--recruiting',
    voting: 'activity-detail-badge--light',
    tiebreaking: 'activity-detail-badge--light',
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
  loading.value = true
  fetchError.value = ''
  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities/${id}`, {
      credentials: 'include',
    })
    if (!res.ok) {
      fetchError.value = res.status === 404 ? '找不到此活動' : '載入失敗'
      return
    }
    const data = await res.json()
    activity.value = data.activity
    selectedJoinSlotIds.value = []
    selectedDecisionSlotId.value = null
  } catch {
    fetchError.value = '無法連線到伺服器'
  } finally {
    loading.value = false
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

async function handleCancelJoin() {
  await callAction('join', 'DELETE', '✅ 已取消報名')
}

async function handleConfirmFormation() {
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

async function handleStartTiebreak() {
  await callAction('tiebreak/start', 'POST')
}

async function handleTiebreakVote() {
  if (!selectedDecisionSlotId.value) {
    actionError.value = '請選擇一個候選時段'
    return
  }
  await callAction('tiebreak/vote', 'POST', '', { candidateSlotId: selectedDecisionSlotId.value })
}

async function handleCancel() {
  await callAction('cancel', 'POST', '✅ 活動已取消')
}

function resetPanel() {
  activity.value = null
  fetchError.value = ''
  actionError.value = ''
  selectedJoinSlotIds.value = []
  selectedDecisionSlotId.value = null
}

function formatDateTime(date) {
  const m = date.getMonth() + 1
  const d = date.getDate()
  return `${m}/${d} ${formatTime(date)}`
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
  width: min(400px, 78vw);
  max-height: 100%;
  border-radius: 18px;
  background: var(--activity-focus-bg, #a5dcfb);
  color: #202420;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.activity-focus-card--joined {
  --activity-focus-bg: #f5c2f1;
}

.activity-focus-card--recruiting {
  --activity-focus-bg: #a5dcfb;
}

.activity-focus-card--confirmed {
  --activity-focus-bg: #b3e0d3;
}

.activity-focus-card--neutral {
  --activity-focus-bg: #ffffff;
  border: 1px solid #9da197;
}

.activity-detail-header {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  padding: 22px 22px 12px;
  flex: 0 0 auto;
}

.activity-detail-kicker {
  margin-bottom: 7px;
  font-family: 'Courier New', monospace;
  font-size: 11px;
  font-weight: 700;
  letter-spacing: 0.04em;
  opacity: 0.65;
}

.activity-detail-header h2 {
  margin: 0;
  color: #202420;
  font-size: 35px;
  line-height: 0.98;
  font-weight: 950;
}

.activity-detail-date {
  color: rgba(32, 36, 32, 0.76);
  font-size: 31px;
  line-height: 0.95;
  font-weight: 620;
  white-space: nowrap;
}

.activity-detail-body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 22px 18px;
  scrollbar-width: none;
}

.activity-detail-body::-webkit-scrollbar {
  display: none;
}

.activity-detail-state {
  padding: 56px 0;
  text-align: center;
  font-size: 14px;
  font-weight: 850;
}

.activity-detail-state--error,
.activity-detail-error {
  color: #dc2626;
}

.activity-detail-cover {
  height: 104px;
  margin-bottom: 18px;
  border: 1px solid rgba(32, 36, 32, 0.42);
  background: rgba(251, 251, 248, 0.34);
  display: grid;
  place-items: center;
}

.activity-detail-creator,
.activity-detail-participants,
.activity-detail-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-detail-creator {
  margin-bottom: 16px;
  font-size: 14px;
  font-weight: 650;
}

.activity-detail-avatar {
  width: 25px;
  height: 25px;
  border: 1px solid #202420;
  background: #fff;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  object-fit: cover;
  color: #202420;
  font-size: 9px;
  font-weight: 900;
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
  gap: 11px;
  font-size: 14px;
  line-height: 1.42;
  font-weight: 650;
}

.activity-detail-label {
  margin-bottom: 3px;
  color: #2f8f6f;
  font-size: 12px;
  font-weight: 850;
}

.activity-detail-description {
  max-height: 4.5rem;
  overflow-y: auto;
  padding-right: 8px;
  white-space: pre-wrap;
}

.activity-detail-badges {
  margin-top: 16px;
  flex-wrap: wrap;
}

.activity-detail-badge,
.activity-detail-needed {
  border: 1px solid #202420;
  padding: 3px 8px;
  background: #fff;
  font-size: 12px;
  font-weight: 900;
}

.activity-detail-badge--recruiting {
  background: #fff;
}

.activity-detail-badge--confirmed {
  background: #202420;
  color: #fff;
}

.activity-detail-badge--light {
  background: rgba(251, 251, 248, 0.72);
}

.activity-detail-badge--cancelled {
  background: #e5e7eb;
  color: #6b7280;
}

.activity-detail-capacity {
  color: #2f8f6f;
  font-size: 12px;
  font-weight: 750;
}

.activity-detail-join {
  margin-top: 16px;
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

.activity-detail-option,
.activity-detail-option-read {
  border: 1px solid rgba(32, 36, 32, 0.42);
  background: rgba(251, 251, 248, 0.35);
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
  border-color: #202420;
  background: rgba(251, 251, 248, 0.62);
}

.activity-detail-error {
  margin: 12px 0 0;
  font-size: 12px;
  font-weight: 750;
}

.activity-detail-footer {
  flex: 0 0 auto;
  border-top: 1px solid rgba(32, 36, 32, 0.42);
  padding: 14px 22px 18px;
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-wrap: wrap;
}

.activity-detail-success {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  background: rgba(251, 251, 248, 0.5);
  border: 1px solid rgba(32, 36, 32, 0.42);
  padding: 9px 10px;
  font-size: 14px;
  font-weight: 850;
}

.custom-scrollbar::-webkit-scrollbar {
  width: 8px;
}

.custom-scrollbar::-webkit-scrollbar-track {
  background: transparent;
}

.custom-scrollbar::-webkit-scrollbar-thumb {
  background: #4a5040;
  border: 1px solid #fef7e8;
}

.custom-scrollbar::-webkit-scrollbar-thumb:hover {
  background: #87c06d;
}

@media (max-width: 900px) {
  .activity-detail-panel {
    width: 100%;
    max-height: none;
    min-height: 340px;
  }
}
</style>
