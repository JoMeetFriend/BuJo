<template>
  <BaseModal
    :isOpen="isOpen"
    :title="activity?.title || '活動詳情'"
    maxWidth="440px"
    @close="handleClose"
  >
    <template #default>
      <!-- 載入中 -->
      <div v-if="loading" class="py-10 text-center text-sm text-[#87C06D]">載入中...</div>

      <!-- 錯誤 -->
      <div v-else-if="fetchError" class="py-10 text-center text-sm text-red-500">{{ fetchError }}</div>

      <div v-else-if="activity" class="flex flex-col gap-5 select-none">
        <!-- 封面佔位 -->
        <div
          class="h-32 flex items-center justify-center border-[1.5px] border-[#4A5040] bg-[#DEF4CD]"
        >
          <svg class="h-12 w-12 text-[#4A5040]" fill="currentColor" viewBox="0 0 24 24">
            <path d="M4 2h16v2H4V2zm2 4h12v2H6V6zm-2 4h16v2H4v-2zm4 4h8v2H8v-2zm-6 4h20v2H2v-2z" />
          </svg>
        </div>

        <!-- 發起人 -->
        <div class="flex items-center gap-2 text-sm">
          <div class="w-6 h-6 border border-[#4A5040] flex items-center justify-center bg-white overflow-hidden shrink-0">
            <img
              v-if="activity.creator.avatar_url"
              :src="activity.creator.avatar_url"
              class="w-full h-full object-cover"
              alt=""
            />
            <span v-else class="text-xs">⭐</span>
          </div>
          <span>{{ activity.creator.display_name }} 發起</span>
        </div>

        <!-- 活動資訊 -->
        <div class="flex flex-col gap-3 text-sm">
          <div>
            <div class="text-xs text-[#87C06D] mb-0.5">時間</div>
            <div>{{ scheduleText }}</div>
          </div>
          <div v-if="activity.location">
            <div class="text-xs text-[#87C06D] mb-0.5">地點</div>
            <div>{{ activity.location }}</div>
          </div>
          <div v-if="activity.description">
            <div class="text-xs text-[#87C06D] mb-0.5">備註</div>
            <div class="text-sm break-words whitespace-pre-wrap max-h-[4.5rem] overflow-y-auto pr-2 custom-scrollbar">
              {{ activity.description }}
            </div>
          </div>
        </div>

        <!-- 狀態 badge -->
        <div class="flex items-center gap-2">
          <span
            class="text-xs border border-[#4A5040] px-2 py-0.5 font-bold"
            :class="statusBadgeClass"
          >
            {{ statusText }}
          </span>
          <span v-if="activity.max_participants" class="text-xs text-[#87C06D]">
            人數上限 {{ activity.max_participants }} 人
          </span>
        </div>

        <!-- 報名人數 -->
        <div class="pb-2">
          <div class="text-xs text-[#87C06D] mb-2">
            已報名 {{ activity.current_count }} 人{{ activity.max_participants ? ` / ${activity.max_participants}` : '' }}
          </div>
          <div class="flex gap-1.5 items-center h-6">
            <div class="flex items-center overflow-hidden h-7">
              <template v-for="p in activity.participants.slice(0, 5)" :key="p.id">
                <img
                  v-if="p.avatar_url"
                  class="inline-block h-6 w-6 border border-[#4A5040] object-cover shrink-0"
                  :src="p.avatar_url"
                  alt=""
                />
                <div
                  v-else
                  class="inline-flex h-6 w-6 shrink-0 items-center justify-center border border-[#4A5040] bg-[#DEF4CD] text-[9px] font-bold text-[#4A5040]"
                >
                  {{ p.display_name?.slice(0, 2) ?? '?' }}
                </div>
              </template>
              <span
                v-if="activity.current_count > 5"
                class="flex items-center justify-center h-6 w-6 border border-[#4A5040] bg-[#FEF7E8] text-[10px] font-bold text-[#4A5040] shrink-0"
              >
                +{{ activity.current_count - 5 }}
              </span>
            </div>
            <span
              v-if="activity.status === 'recruiting' && activity.max_participants && activity.max_participants - activity.current_count > 0"
              class="text-[11px] font-bold border border-[#4A5040] px-2 py-0.5 bg-[#87C06D] text-white tracking-wider"
            >
              還差 {{ activity.max_participants - activity.current_count }} 人
            </span>
          </div>
        </div>

        <!-- 候選時段：報名中，尚未報名者勾選自己方便的時段 -->
        <div
          v-if="activity.requires_voting && activity.status === 'recruiting' && !activity.is_creator && !activity.has_joined"
          class="flex flex-col gap-2"
        >
          <div class="text-xs text-[#87C06D]">選擇你方便的候選時段（可複選）</div>
          <label
            v-for="slot in activity.candidate_slots"
            :key="slot.id"
            class="flex items-center gap-2 text-sm border-[1.5px] border-[#D8E6C8] px-2 py-1.5 cursor-pointer hover:border-[#87C06D]"
          >
            <input type="checkbox" :value="slot.id" v-model="selectedJoinSlotIds" />
            <span>{{ slotText(slot) }}</span>
          </label>
        </div>

        <!-- 候選時段：報名中，已報名者/建立者唯讀查看 -->
        <div
          v-else-if="activity.requires_voting && activity.status === 'recruiting'"
          class="flex flex-col gap-1"
        >
          <div class="text-xs text-[#87C06D]">候選時段</div>
          <div v-for="slot in activity.candidate_slots" :key="slot.id" class="text-sm">
            {{ slotText(slot) }}
          </div>
        </div>

        <!-- 候選時段：建立者決選 / 決選投票階段 -->
        <div
          v-if="activity.requires_voting && (activity.status === 'voting' || activity.status === 'tiebreaking')"
          class="flex flex-col gap-2"
        >
          <div class="text-xs text-[#87C06D]">
            {{ activity.status === 'voting' ? '候選時段（並列最高票）' : '決選投票中' }}
          </div>
          <label
            v-for="slot in activity.decision_candidates"
            :key="slot.id"
            class="flex items-center justify-between gap-2 text-sm border-[1.5px] px-2 py-1.5 cursor-pointer hover:border-[#87C06D]"
            :class="selectedDecisionSlotId === slot.id ? 'border-[#4A5040] bg-[#F0F8E8]' : 'border-[#D8E6C8]'"
          >
            <span class="flex items-center gap-2">
              <input type="radio" name="decision-slot" :value="slot.id" v-model="selectedDecisionSlotId" />
              {{ slotText(slot) }}
            </span>
            <span class="text-xs text-[#87C06D]">{{ slot.count }} 票</span>
          </label>
        </div>

        <!-- 操作錯誤訊息 -->
        <p v-if="actionError" class="text-xs text-red-500">{{ actionError }}</p>
      </div>
    </template>

    <template #footer>
      <!-- 成功 banner -->
      <div
        v-if="successMessage"
        class="flex-1 flex items-center justify-between -mx-5 -my-3 px-4 py-2.5 bg-[#DEF4CD] border-t-2 border-[#4A5040]"
      >
        <span class="text-sm font-bold text-[#4A5040]">{{ successMessage }}</span>
        <button
          type="button"
          @click="handleClose"
          class="w-6 h-6 border border-[#4A5040] flex items-center justify-center text-xs text-[#4A5040] bg-white hover:bg-[#f0f0e8]"
        >✕</button>
      </div>

      <!-- 一般按鈕 -->
      <template v-else>
        <PixelButton variant="white" type="button" @click="handleClose">關閉</PixelButton>

        <!-- 創建者的操作：報名中（免投票）-->
        <template v-if="activity?.is_creator && activity.status === 'recruiting' && !activity.requires_voting">
          <PixelButton
            type="button"
            :disabled="actionLoading"
            @click="handleConfirmFormation"
          >
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

        <!-- 創建者的操作：報名中（投票模式，尚不能成團）-->
        <template v-else-if="activity?.is_creator && activity.status === 'recruiting' && activity.requires_voting">
          <PixelButton
            variant="danger"
            type="button"
            :disabled="actionLoading"
            @click="handleCancel"
          >
            取消活動
          </PixelButton>
        </template>

        <!-- 創建者的操作：候選時段決選階段 -->
        <template v-else-if="activity?.is_creator && (activity.status === 'voting' || activity.status === 'tiebreaking')">
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

        <!-- 非創建者的操作 -->
        <template v-else-if="activity && !activity.is_creator">
          <!-- 未報名 + 揪團中 -->
          <PixelButton
            v-if="activity.status === 'recruiting' && !activity.has_joined"
            type="button"
            :disabled="actionLoading || (activity.requires_voting && selectedJoinSlotIds.length === 0)"
            @click="handleJoin"
          >
            {{ actionLoading ? '處理中...' : '報名參加' }}
          </PixelButton>
          <!-- 已報名 + 揪團中 → 可取消 -->
          <PixelButton
            v-else-if="activity.status === 'recruiting' && activity.has_joined"
            variant="white"
            type="button"
            :disabled="actionLoading"
            @click="handleCancelJoin"
          >
            取消報名
          </PixelButton>
          <!-- 已報名 + 決選投票中 -->
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
    </template>
  </BaseModal>
</template>

<script setup>
import { ref, computed, watch } from 'vue'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'

const props = defineProps({
  isOpen: Boolean,
  activityId: { type: String, default: null },
})

const emit = defineEmits(['close', 'status-changed'])

const activity = ref(null)
const loading = ref(false)
const fetchError = ref('')
const actionLoading = ref(false)
const actionError = ref('')
const successMessage = ref(null)
const selectedJoinSlotIds = ref([])
const selectedDecisionSlotId = ref(null)

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
    recruiting: 'bg-[#DEF4CD] text-[#4A5040]',
    voting: 'bg-[#FEF7E8] text-[#4A5040]',
    tiebreaking: 'bg-[#FEF7E8] text-[#4A5040]',
    confirmed: 'bg-[#87C06D] text-white',
    cancelled: 'bg-gray-200 text-gray-500',
  }
  return map[activity.value?.status] ?? ''
})

watch(
  () => [props.isOpen, props.activityId],
  ([open, id]) => {
    if (open && id) fetchActivity(id)
    else if (!open) {
      activity.value = null
      fetchError.value = ''
      actionError.value = ''
      selectedJoinSlotIds.value = []
      selectedDecisionSlotId.value = null
    }
  },
  { immediate: true }
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
        ...(body ? { headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) } : {}),
      }
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
        emit('close')
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
    await callAction('join', 'POST', '✅ 報名成功！', { candidateSlotIds: selectedJoinSlotIds.value })
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
    await callAction('confirm-formation', 'POST', '✅ 成團成功！', { candidateSlotId: selectedDecisionSlotId.value })
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

function handleClose() {
  successMessage.value = null
  emit('close')
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
</style>
