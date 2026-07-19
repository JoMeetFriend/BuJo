<template>
  <article v-if="isOpen" class="activity-detail-panel" :class="focusCardClass">
    <header class="activity-detail-header">
      <div class="activity-detail-top-row">
        <div class="activity-detail-kicker">ACTIVITY ROOM</div>
        <div class="activity-detail-top-actions">
          <div v-if="activity" class="activity-detail-badges">
            <span class="activity-detail-badge" :class="statusBadgeClass">
              {{ statusText }}
            </span>
          </div>
          <button
            v-if="closable"
            type="button"
            class="activity-detail-close"
            aria-label="關閉活動詳情"
            @click="emit('close')"
          >
            ×
          </button>
        </div>
      </div>
      <div class="activity-detail-header-content">
        <div v-if="activity" class="activity-detail-creator">
          <div class="activity-detail-avatar">
            <img
              v-if="activity.creator.avatar_url"
              :src="toAvatarSrc(activity.creator.avatar_url)"
              alt=""
            />
            <UserIcon v-else class="h-4 w-4" aria-hidden="true" />
          </div>
          <span>{{ activity.creator.display_name }}</span>
        </div>
        <h2>{{ activity?.title || '活動詳情' }}</h2>
        <div v-if="activity" class="activity-detail-date">{{ panelDate }}</div>
      </div>
    </header>

    <section class="activity-detail-body">
      <div v-if="loading" class="activity-detail-state">載入中...</div>
      <div v-else-if="fetchError" class="activity-detail-state activity-detail-state--error">
        {{ fetchError }}
      </div>

      <template v-else-if="activity">
        <div v-if="showCandidateChips && isScenarioDMode" class="activity-detail-info">
          <div class="activity-detail-list-block">
            <div class="activity-detail-label">日期、時段投票中</div>
            <div class="activity-detail-date-list">
              <button
                v-for="chip in visibleCandidateChips"
                :key="chip.key"
                type="button"
                class="activity-detail-chip"
                :class="{
                  'activity-detail-chip--mine': chip.isMine,
                  'activity-detail-chip--active': openChipDate === chip.key,
                }"
                @click="toggleChipDate(chip.key)"
                @mouseenter="openChipDate = chip.key"
                @mouseleave="openChipDate === chip.key && (openChipDate = null)"
              >
                {{ chip.chip }}
                <span v-if="openChipDate === chip.key" class="activity-detail-chip-popover">{{
                  chip.timeLabel
                }}</span>
              </button>
              <button
                v-if="hiddenCandidateChipsCount > 0"
                type="button"
                class="activity-detail-chip activity-detail-chip--more"
                @click="candidateChipsExpanded = !candidateChipsExpanded"
              >
                {{ candidateChipsExpanded ? '−' : `+${hiddenCandidateChipsCount}` }}
              </button>
            </div>
          </div>
        </div>

        <div class="activity-detail-info">
          <div v-if="showCandidateChips && isScenarioCMode">
            <div class="activity-detail-label">日期投票中</div>
            <div class="activity-detail-date-list">
              <span
                v-for="chip in visibleCandidateChips"
                :key="chip.key"
                :class="{ 'activity-detail-chip--mine': chip.isMine }"
                >{{ chip.chip }}</span
              >
              <button
                v-if="hiddenCandidateChipsCount > 0"
                type="button"
                class="activity-detail-chip activity-detail-chip--more"
                @click="candidateChipsExpanded = !candidateChipsExpanded"
              >
                {{ candidateChipsExpanded ? '−' : `+${hiddenCandidateChipsCount}` }}
              </button>
            </div>
          </div>
          <div v-else-if="dateText && !(showCandidateChips && isScenarioDMode)">
            <div class="activity-detail-label">日期</div>
            <div>{{ dateText }}</div>
          </div>
          <div v-if="!(showCandidateChips && isScenarioDMode)">
            <div class="activity-detail-label">
              {{ rangeTimeWindowText ? '時間投票中' : '時間' }}
            </div>
            <div>{{ rangeTimeWindowText || timeText }}</div>
          </div>
          <div v-if="activity.location">
            <div class="activity-detail-label">地點</div>
            <div>
              <a
                :href="googleMapsSearchUrl(activity.location)"
                target="_blank"
                rel="noopener noreferrer"
                class="underline decoration-dotted underline-offset-2 hover:decoration-solid"
                ><MapPinIcon class="inline h-4 w-4 shrink-0" aria-hidden="true" />
                {{ activity.location }}</a
              >
            </div>
          </div>
          <div v-if="activity.description">
            <div class="activity-detail-label">備註</div>
            <div class="activity-detail-description custom-scrollbar">
              {{ activity.description }}
            </div>
          </div>
        </div>

        <div v-if="activity.participant_target" class="activity-detail-capacity-row">
          <span class="activity-detail-capacity">
            人數上限 {{ activity.participant_target }} 人
          </span>
        </div>

        <div class="activity-detail-join">
          <div class="activity-detail-participants">
            <div
              class="activity-detail-avatars"
              @mouseenter="openSupporters('participants')"
              @mouseleave="closeSupporters('participants')"
              @touchstart="handleAvatarTouchStart('participants')"
              @touchend="handleAvatarTouchEnd"
              @touchmove="handleAvatarTouchEnd"
            >
              <template v-for="p in visibleParticipants" :key="p.id">
                <img
                  v-if="p.avatar_url"
                  class="activity-detail-avatar activity-detail-participant-avatar"
                  :src="toAvatarSrc(p.avatar_url)"
                  alt=""
                />
                <div
                  v-else
                  class="activity-detail-avatar activity-detail-avatar--text activity-detail-participant-avatar"
                >
                  {{ p.display_name?.slice(0, 2) ?? '?' }}
                </div>
              </template>
              <button
                v-if="hasExpandableParticipants"
                type="button"
                class="activity-detail-avatar activity-detail-avatar--text activity-detail-avatar-toggle"
                :aria-label="participantsExpanded ? '收合參與者頭像' : '展開所有參與者頭像'"
                :aria-expanded="participantsExpanded"
                @click.stop="participantsExpanded = !participantsExpanded"
              >
                +
              </button>
              <span
                v-if="openSupportersKey === 'participants' && activity.participants.length"
                class="activity-detail-chip-popover"
              >
                {{ activity.participants.map((p) => p.display_name).join('、') }}
              </span>
            </div>
            <span class="activity-detail-count">
              {{ activity.current_count }} /
              <span v-if="activity.participant_target">{{ activity.participant_target }}</span>
              <span v-else class="activity-detail-infinity">∞</span>
              人
            </span>
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
            <template v-if="activity.has_joined && selectedScenarioCSlots.length">
              <div class="activity-detail-list-block">
                <div class="activity-detail-label">你報名的日期</div>
                <div class="activity-detail-date-list">
                  <span
                    v-for="slot in selectedScenarioCSlots"
                    :key="slot.id"
                    class="activity-detail-selection-entry"
                  >
                    {{ formatDateKey(toLocalDateKey(slot.slot_start)) }}
                    <span
                      v-if="slot.co_participants && slot.co_participants.length"
                      class="activity-detail-supporters"
                      @mouseenter="openSupporters(`c-${slot.id}`)"
                      @mouseleave="closeSupporters(`c-${slot.id}`)"
                      @touchstart="handleAvatarTouchStart(`c-${slot.id}`)"
                      @touchend="handleAvatarTouchEnd"
                      @touchmove="handleAvatarTouchEnd"
                    >
                      <span
                        v-for="p in slot.co_participants"
                        :key="p.user_id"
                        class="activity-detail-avatar"
                      >
                        <img v-if="p.avatar_url" :src="toAvatarSrc(p.avatar_url)" alt="" />
                        <span v-else>{{ p.display_name?.slice(0, 1) ?? '?' }}</span>
                      </span>
                      <span
                        v-if="openSupportersKey === `c-${slot.id}`"
                        class="activity-detail-chip-popover"
                      >
                        {{ slot.co_participants.map((p) => p.display_name).join('、') }}
                      </span>
                    </span>
                  </span>
                </div>
              </div>
            </template>
          </template>
          <template v-else-if="isScenarioDMode">
            <template v-if="activity.has_joined">
              <div class="activity-detail-label">已報名的時段</div>
              <div v-if="selectedScenarioDSlots.length" class="activity-detail-date-list">
                <span
                  v-for="slot in selectedScenarioDSlots"
                  :key="slot.id"
                  class="activity-detail-selection-entry"
                >
                  {{ slotText(slot, slot.my_range) }}
                  <span
                    v-if="slot.co_participants && slot.co_participants.length"
                    class="activity-detail-supporters"
                    @mouseenter="openSupporters(`d-${slot.id}`)"
                    @mouseleave="closeSupporters(`d-${slot.id}`)"
                    @touchstart="handleAvatarTouchStart(`d-${slot.id}`)"
                    @touchend="handleAvatarTouchEnd"
                    @touchmove="handleAvatarTouchEnd"
                  >
                    <span
                      v-for="p in slot.co_participants"
                      :key="p.user_id"
                      class="activity-detail-avatar"
                    >
                      <img v-if="p.avatar_url" :src="toAvatarSrc(p.avatar_url)" alt="" />
                      <span v-else>{{ p.display_name?.slice(0, 1) ?? '?' }}</span>
                    </span>
                    <span
                      v-if="openSupportersKey === `d-${slot.id}`"
                      class="activity-detail-chip-popover"
                    >
                      {{ slot.co_participants.map((p) => p.display_name).join('、') }}
                    </span>
                  </span>
                </span>
              </div>
              <div v-else class="activity-detail-muted">尚未選擇候選時段</div>
            </template>
          </template>
          <template v-else-if="isRangeMode">
            <template v-if="activity.has_joined">
              <div class="activity-detail-label">你報名的時段</div>
              <div v-if="myRangesEntries.length" class="activity-detail-date-list">
                <span
                  v-for="entry in myRangesEntries"
                  :key="entry.start"
                  class="activity-detail-selection-entry"
                >
                  {{ myRangeLabel(entry) }}
                  <span
                    v-if="entry.co_participants && entry.co_participants.length"
                    class="activity-detail-supporters"
                    @mouseenter="openSupporters(`r-${entry.start}`)"
                    @mouseleave="closeSupporters(`r-${entry.start}`)"
                    @touchstart="handleAvatarTouchStart(`r-${entry.start}`)"
                    @touchend="handleAvatarTouchEnd"
                    @touchmove="handleAvatarTouchEnd"
                  >
                    <span
                      v-for="p in entry.co_participants"
                      :key="p.user_id"
                      class="activity-detail-avatar"
                    >
                      <img v-if="p.avatar_url" :src="toAvatarSrc(p.avatar_url)" alt="" />
                      <span v-else>{{ p.display_name?.slice(0, 1) ?? '?' }}</span>
                    </span>
                    <span
                      v-if="openSupportersKey === `r-${entry.start}`"
                      class="activity-detail-chip-popover"
                    >
                      {{ entry.co_participants.map((p) => p.display_name).join('、') }}
                    </span>
                  </span>
                </span>
              </div>
              <div v-else class="activity-detail-muted">尚未回報時間</div>
            </template>
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
            selectedScenarioCSlots.length &&
            (activity.status === 'voting' || activity.status === 'confirmed')
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">你報名的日期</div>
          <div class="activity-detail-date-list">
            <span
              v-for="slot in selectedScenarioCSlots"
              :key="slot.id"
              class="activity-detail-selection-entry"
            >
              {{ formatDateKey(toLocalDateKey(slot.slot_start)) }}
              <span
                v-if="slot.co_participants && slot.co_participants.length"
                class="activity-detail-supporters"
                @mouseenter="openSupporters(`c2-${slot.id}`)"
                @mouseleave="closeSupporters(`c2-${slot.id}`)"
                @touchstart="handleAvatarTouchStart(`c2-${slot.id}`)"
                @touchend="handleAvatarTouchEnd"
                @touchmove="handleAvatarTouchEnd"
              >
                <span
                  v-for="p in slot.co_participants"
                  :key="p.user_id"
                  class="activity-detail-avatar"
                >
                  <img v-if="p.avatar_url" :src="toAvatarSrc(p.avatar_url)" alt="" />
                  <span v-else>{{ p.display_name?.slice(0, 1) ?? '?' }}</span>
                </span>
                <span
                  v-if="openSupportersKey === `c2-${slot.id}`"
                  class="activity-detail-chip-popover"
                >
                  {{ slot.co_participants.map((p) => p.display_name).join('、') }}
                </span>
              </span>
            </span>
          </div>
        </div>

        <div
          v-if="
            isScenarioDMode &&
            activity.has_joined &&
            (activity.status === 'voting' || activity.status === 'confirmed')
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">已報名的時段</div>
          <div v-if="selectedScenarioDSlots.length" class="activity-detail-date-list">
            <span
              v-for="slot in selectedScenarioDSlots"
              :key="slot.id"
              class="activity-detail-selection-entry"
            >
              {{ slotText(slot, slot.my_range) }}
              <span
                v-if="slot.co_participants && slot.co_participants.length"
                class="activity-detail-supporters"
                @mouseenter="openSupporters(`d2-${slot.id}`)"
                @mouseleave="closeSupporters(`d2-${slot.id}`)"
                @touchstart="handleAvatarTouchStart(`d2-${slot.id}`)"
                @touchend="handleAvatarTouchEnd"
                @touchmove="handleAvatarTouchEnd"
              >
                <span
                  v-for="p in slot.co_participants"
                  :key="p.user_id"
                  class="activity-detail-avatar"
                >
                  <img v-if="p.avatar_url" :src="toAvatarSrc(p.avatar_url)" alt="" />
                  <span v-else>{{ p.display_name?.slice(0, 1) ?? '?' }}</span>
                </span>
                <span
                  v-if="openSupportersKey === `d2-${slot.id}`"
                  class="activity-detail-chip-popover"
                >
                  {{ slot.co_participants.map((p) => p.display_name).join('、') }}
                </span>
              </span>
            </span>
          </div>
          <div v-else class="activity-detail-muted">尚未選擇候選時段</div>
        </div>

        <div
          v-if="
            activity.is_creator &&
            activity.requires_voting &&
            (activity.status === 'recruiting' || activity.status === 'voting')
          "
          class="activity-detail-options"
        >
          <div class="activity-detail-label">{{ decisionSectionLabel }}</div>
          <label
            v-for="entry in visibleEntries('flat', normalizedDecisionEntries)"
            :key="entry.id"
            class="activity-detail-option activity-detail-option--spread"
            :class="{
              'activity-detail-option--selected': selectedDecisionSlotId === entry.radioId,
              'activity-detail-option--expired': isExpired(entry),
            }"
          >
            <span class="activity-detail-option-time">
              <input
                v-if="activity.is_creator"
                type="radio"
                name="decision-slot"
                :value="entry.radioId"
                :disabled="isExpired(entry)"
                v-model="selectedDecisionSlotId"
              />
              <span>{{ slotText(entry) }}</span>
              <span v-if="isExpired(entry)" class="activity-detail-expired-label">已過期</span>
            </span>
            <span class="activity-detail-option-right">
              <span
                v-if="entry.supporters.length"
                class="activity-detail-supporters"
                @mouseenter="openSupporters(entry.radioId)"
                @mouseleave="closeSupporters(entry.radioId)"
                @touchstart="handleAvatarTouchStart(entry.radioId)"
                @touchend="handleAvatarTouchEnd"
                @touchmove="handleAvatarTouchEnd"
              >
                <span v-for="s in entry.supporters" :key="s.user_id" class="activity-detail-avatar">
                  <img v-if="s.avatar_url" :src="toAvatarSrc(s.avatar_url)" alt="" />
                  <span v-else>{{ s.display_name?.slice(0, 1) ?? '?' }}</span>
                </span>
                <span
                  v-if="openSupportersKey === entry.radioId"
                  class="activity-detail-chip-popover"
                >
                  {{ entry.supporters.map((s) => s.display_name).join('、') }}
                </span>
              </span>
              <span class="activity-detail-ratio">{{ ratioText(entry.count) }}</span>
            </span>
          </label>
          <button
            v-if="hasRevealControl(normalizedDecisionEntries.length)"
            type="button"
            class="activity-detail-chip activity-detail-chip--more"
            @click="toggleReveal('flat', normalizedDecisionEntries.length)"
          >
            {{ revealControlText('flat', normalizedDecisionEntries.length) }}
          </button>
        </div>

        <p v-if="actionError" class="activity-detail-error">{{ actionError }}</p>
      </template>
    </section>

    <footer v-if="activity" class="activity-detail-footer">
      <div v-if="successMessage" class="activity-detail-success">
        <DocumentCheckIcon class="h-4 w-4 shrink-0" aria-hidden="true" /><span>{{
          successMessage
        }}</span>
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
            :disabled="actionLoading || (activity.requires_voting && !selectedDecisionSlotId)"
            @click="handleConfirmFormation"
          >
            {{
              actionLoading ? '處理中...' : activity.requires_voting ? '確認此時段成團' : '立即成團'
            }}
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
    :allowed-dates="
      isScenarioDMode ? scenarioDAvailableCandidateDates : scenarioCAvailableCandidateDates
    "
    :date-only="isScenarioCMode"
    :date-windows="
      isScenarioDMode ? scenarioDDateWindows : isScenarioCMode ? scenarioCDateWindows : {}
    "
    :fixed-time-label="scenarioCFixedTimeLabel"
    :initial-dates="isScenarioCMode ? scenarioCInitialDates : []"
    :initial-ranges="isRangeMode ? myRangesInitial : isScenarioDMode ? scenarioDInitialRanges : []"
    @confirm="handlePickerConfirm"
  />
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import { UserIcon, MapPinIcon, DocumentCheckIcon } from '@heroicons/vue/24/outline'
import PixelButton from './ui/PixelButton.vue'
import AvailabilityPickerModal from './AvailabilityPickerModal.vue'
import { toAvatarSrc } from '@/utils/avatar'
import { googleMapsSearchUrl } from '@/utils/mapLink'

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
const participantsExpanded = ref(false)

const isRangeMode = computed(() => activity.value?.availability_mode === 'range')
const isScenarioCMode = computed(() => activity.value?.schedule_variant === 'find_date')
const isScenarioDMode = computed(() => activity.value?.schedule_variant === 'find_date_time')

// 卡片背景色依活動狀態決定——算在元件內部（而不是要求呼叫端自己算好傳 class 進來），
// 這樣不管從哪裡開啟這個元件都會套用到正確的狀態色，不會有呼叫端忘記綁定而永遠落回預設色的情況
const focusCardClass = computed(() => {
  const a = activity.value
  if (!a) return ''
  if (a.is_creator && a.status === 'recruiting') return 'activity-focus-card--mine-recruiting'
  if (a.is_creator && a.status === 'confirmed') return 'activity-focus-card--mine-confirmed'
  if (a.has_joined && !a.is_creator && a.status === 'recruiting')
    return 'activity-focus-card--joined'
  if (a.status === 'confirmed') return 'activity-focus-card--confirmed'
  if (a.status === 'recruiting') return 'activity-focus-card--recruiting'
  return 'activity-focus-card--neutral'
})

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

// 情境三：跟情境四同樣形狀的 dateWindows，傳給 AvailabilityPickerModal 讓它的 isExpired
// 能算出每個候選日「真正的」窗口結束時間（統一時間的結束鐘點），不是整天的 23:59——
// 情境三沒有這個資訊的話，isExpired 會誤用「當天 23:59」當過期邊界，
// 導致候選時段其實已經過去了一整天，日曆格子卻要等到隔天才會被判定成過期
const scenarioCDateWindows = computed(() => {
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

const scenarioCCandidateDates = computed(() => [...scenarioCSlotByDate.value.keys()].sort())

// 已經過去的候選日期不能再從這裡整個濾掉——濾掉會讓 AvailabilityPickerModal 收到的
// allowedDates 裡完全不存在這個日期，它自己的 isExpired 停用樣式（灰階＋刪除線）永遠輪不到套用，
// 使用者會看到過期候選日跟從來不是候選日的格子長得一模一樣，分不出差別。維持顯示但停用的
// 職責交給 AvailabilityPickerModal 的 isExpired/dayClass 處理，這裡只需要回傳完整候選日清單
const scenarioCAvailableCandidateDates = computed(() => scenarioCCandidateDates.value)

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
// 例如「7/12 下午 6:00–下午 9:00」。保留完整物件（不只是文字）是因為每一筆現在還要
// 顯示 co_participants 頭像，不能只留下轉換過的文字標籤
function myRangeLabel(r) {
  const start = new Date(r.start)
  const end = new Date(r.end)
  return `${formatDateKey(toLocalDateKey(r.start))} ${formatTime(start)}–${formatTime(end)}`
}
const myRangesEntries = computed(() => activity.value?.my_ranges ?? [])

// 情境三已選的候選時段，保留完整物件（含 co_participants），不只是文字標籤
const selectedScenarioCSlots = computed(() =>
  (activity.value?.candidate_slots ?? []).filter((slot) => slot.is_selected),
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

// 卡片上「有哪些候選日期」的預覽清單，情境三／四共用同一套資料形狀跟展開/收合邏輯，
// 差別只在情境三不需要點擊看時段（時間本來就統一固定，已經在時間欄位顯示），情境四才需要
// 一旦活動已經成團（confirmed_slot 有值），就不用再顯示候選清單，直接回到 dateText/timeText
// 的確定日期時間顯示即可，候選清單只在還沒定案時才有意義
const showCandidateChips = computed(
  () => (isScenarioCMode.value || isScenarioDMode.value) && !activity.value?.confirmed_slot,
)

const candidateChipsForCard = computed(() => {
  if (isScenarioDMode.value) {
    return Object.entries(scenarioDDateWindows.value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, window]) => ({
        key: date,
        chip: formatDateKey(date),
        timeLabel: `${window.start}–${window.end}`,
        isMine: (activity.value?.candidate_slots ?? []).some(
          (s) => s.id === window.slotId && s.is_selected,
        ),
      }))
  }
  if (isScenarioCMode.value) {
    return scenarioCCandidateDates.value.map((date) => ({
      key: date,
      chip: formatDateKey(date),
      timeLabel: null,
      isMine: scenarioCSelectedDates.value.includes(date),
    }))
  }
  return []
})

// 只先顯示前 3 個候選日期，避免候選一多整張卡片被一大排 chip 塞爆，超過的收在「+N 更多」後面展開
const CANDIDATE_CHIPS_VISIBLE_COUNT = 3
const candidateChipsExpanded = ref(false)
const visibleCandidateChips = computed(() =>
  candidateChipsExpanded.value
    ? candidateChipsForCard.value
    : candidateChipsForCard.value.slice(0, CANDIDATE_CHIPS_VISIBLE_COUNT),
)
const hiddenCandidateChipsCount = computed(() =>
  Math.max(0, candidateChipsForCard.value.length - CANDIDATE_CHIPS_VISIBLE_COUNT),
)

// 情境四點擊日期 chip 顯示當天時段——用點擊/輕觸切換，不是 CSS :hover，桌機點擊跟手機輕觸行為一致；
// 同一時間只會有一個提示框開著，跟 EventPage.vue 的 toggleSlotPicker 同一種「單一展開狀態」模式
const openChipDate = ref(null)
function toggleChipDate(key) {
  if (!isScenarioDMode.value) return
  openChipDate.value = openChipDate.value === key ? null : key
}

const scenarioDCandidateDates = computed(() => Object.keys(scenarioDDateWindows.value).sort())

// 不能整個濾掉過期候選日，理由同情境三——維持顯示但停用的職責交給
// AvailabilityPickerModal 的 isExpired/dayClass 處理
const scenarioDAvailableCandidateDates = computed(() => scenarioDCandidateDates.value)

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

// 情境四已選的候選時段，保留完整物件（含 co_participants），不只是文字標籤
const selectedScenarioDSlots = computed(() =>
  (activity.value?.candidate_slots ?? []).filter((slot) => slot.is_selected),
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

// 把後端回傳的 segment 正規化成畫面統一消費的形狀，情境二／三／四內層共用同一套呈現邏輯
// （比例文字、支持者頭像、前 3 名 + 顯示更多），不再區分「完全重疊」「部分重疊」
// 已過期的候選項目維持顯示（不整個移除），但不能再被點選——情境二/三/四的候選資料都已經
// 透過 normalizeSegment 正規化成同一種形狀，一律用 slot_start 判斷，不需要依情境分支欄位名稱
function isExpired(entry) {
  return !!entry.slot_start && new Date(entry.slot_start).getTime() < Date.now()
}

function normalizeSegment(seg) {
  return {
    id: seg.id,
    radioId: seg.id,
    slot_start: seg.slot_start,
    slot_end: seg.slot_end,
    count: seg.count,
    is_unanimous: seg.is_unanimous,
    supporters: seg.supporters ?? [],
  }
}

// 情境二/三/四的決選候選清單統一依票數排序，不分日期分組——票數相同時排「離現在最近」的
// 那筆在前面（用絕對時間差，不是單純早到晚，這樣已過期跟未過期的候選項目混在同一批同票裡
// 也能正確排出離現在最近的那個，不會因為候選項目已過期就被誤判排到最前面）
function compareDecisionEntries(a, b) {
  if (b.count !== a.count) return b.count - a.count
  const now = Date.now()
  const diffA = Math.abs(new Date(a.slot_start).getTime() - now)
  const diffB = Math.abs(new Date(b.slot_start).getTime() - now)
  return diffA - diffB
}

// 情境二（range 模式）／情境三（find_date）：decision_candidates 都是單一排序陣列，直接正規化；
// 情境四：decision_candidates 是候選時段外層陣列，每筆自己還有一個內層 segments 單一陣列，
// 攤平成單一陣列一起參與全域排序，不再依候選時段分組顯示。radioId 用候選時段 id 當前綴組出來，
// 保證跨候選時段不會撞號（單一候選時段內的 segment id 已經是各自唯一的 slot_start ISO 字串）
const normalizedDecisionEntries = computed(() => {
  const candidates = activity.value?.decision_candidates
  if (!Array.isArray(candidates)) return []
  const flat = isScenarioDMode.value
    ? candidates.flatMap((slot) =>
        (slot.segments ?? []).map((seg) => ({
          ...normalizeSegment(seg),
          radioId: `${slot.id}::${seg.id}`,
        })),
      )
    : candidates.map(normalizeSegment)
  return [...flat].sort(compareDecisionEntries)
})

// confirmFormation 送出候選時段時，情境四還需要候選時段本身的 id（candidateSlotId），
// 這裡只保留這個用途需要的形狀，不再附帶顯示用的日期標籤（決選清單模板已經改用
// normalizedDecisionEntries 的全域排序結果，不再依這個分組結構渲染）
const scenarioDCandidateGroups = computed(() =>
  (activity.value?.decision_candidates ?? []).map((slot) => ({
    candidateSlotId: slot.id,
    segments: (slot.segments ?? []).map((seg) => ({
      ...normalizeSegment(seg),
      radioId: `${slot.id}::${seg.id}`,
    })),
  })),
)

// 投票分母：後端只回傳 is_unanimous 布林值，比例文字的分母由前端推導——情境二/三/四報名時都
// 必須帶非空的 ranges/candidateSlotIds 才能成功，所以每個已報名的非建立者參與者都對應到後端
// 分母裡的一個真人投票者，扣掉建立者後跟後端 is_unanimous 的分母算出來的數字會一致
const votingDenominator = computed(() =>
  Math.max(0, (activity.value?.participants?.length ?? 0) - 1),
)
function ratioText(count) {
  return votingDenominator.value > 0 ? `${count}/${votingDenominator.value}人` : `${count}人`
}

const hasExpandableParticipants = computed(() => (activity.value?.current_count ?? 0) > 5)
const visibleParticipants = computed(() => {
  const participants = activity.value?.participants ?? []
  return participantsExpanded.value ? participants : participants.slice(0, 5)
})

// 決選清單獨立追蹤目前展開到第幾筆，預設 3 筆。「顯示更多」每次多展開 3 筆；
// 全部展開後控制鈕改成「收合」，讓使用者能回到精簡清單
const DEFAULT_VISIBLE_COUNT = 3
const REVEAL_STEP = 3
const visibleCounts = reactive({})
function visibleCountFor(key, total) {
  return Math.min(visibleCounts[key] ?? DEFAULT_VISIBLE_COUNT, total)
}
function visibleEntries(key, entries) {
  return entries.slice(0, visibleCountFor(key, entries.length))
}
function hasRevealControl(total) {
  return total > DEFAULT_VISIBLE_COUNT
}
function isFullyRevealed(key, total) {
  return visibleCountFor(key, total) >= total
}
function revealControlText(key, total) {
  return isFullyRevealed(key, total) ? '收合' : '顯示更多'
}
function toggleReveal(key, total) {
  if (isFullyRevealed(key, total)) {
    visibleCounts[key] = DEFAULT_VISIBLE_COUNT
    return
  }
  visibleCounts[key] = Math.min((visibleCounts[key] ?? DEFAULT_VISIBLE_COUNT) + REVEAL_STEP, total)
}
function resetVisibleCounts() {
  Object.keys(visibleCounts).forEach((key) => delete visibleCounts[key])
}

// 支持者頭像 hover(桌面)/長按(行動裝置) 顯示名單彈出框，同一時間只會有一筆開著，
// 比照既有 openChipDate 的單一展開狀態模式。長按閾值 500ms：放開/移動發生在閾值前視為一般
// 點擊，不開啟名單，避免跟選取候選時段的點擊行為互相干擾
const openSupportersKey = ref(null)
const LONG_PRESS_MS = 500
let supportersLongPressTimer = null
function openSupporters(key) {
  openSupportersKey.value = key
}
function closeSupporters(key) {
  if (openSupportersKey.value === key) openSupportersKey.value = null
}
function handleAvatarTouchStart(key) {
  clearTimeout(supportersLongPressTimer)
  supportersLongPressTimer = setTimeout(() => {
    openSupportersKey.value = key
  }, LONG_PRESS_MS)
}
function handleAvatarTouchEnd() {
  clearTimeout(supportersLongPressTimer)
}

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
    return minText === maxText ? minText : `${minText}~${maxText}`
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
  // 「候選時段投票中」的語氣會讓人誤以為有清單可以勾選；改成顯示建立者實際設定的可回報時間窗，
  // 不然參與者不知道能回報的時間範圍是幾點到幾點，要點進 picker 才看得到
  if (isRangeMode.value) {
    if (a.time_window_start && a.time_window_end) {
      return `${a.time_window_start}–${a.time_window_end}區間 時間投票中`
    }
    return '整天皆可回報'
  }
  if (a.requires_voting) return '候選時段投票中'
  if (a.candidate_slots?.[0]) return timeOnlyText(a.candidate_slots[0])
  return '時間未設定'
})

// 情境二有設定時間窗時，時間欄位要拆成「時間窗文字」+「時間投票中」淺色提示兩部分渲染，
// 樣式才能跟情境三「候選日期 chip + 日期投票中」、情境四「候選時段 chip + 時段投票中」一致
const rangeTimeWindowText = computed(() => {
  const a = activity.value
  if (!a || a.confirmed_slot || !isRangeMode.value) return ''
  if (!a.time_window_start || !a.time_window_end) return ''
  return `${a.time_window_start}–${a.time_window_end}區間`
})

// subRange（可選）：情境四參與者實際選的子區間 {start, end}，優先顯示子區間而不是候選
// 時段本身的整個窗口——沒有子區間時（null，例如舊資料）才 fallback 顯示整個窗口
function slotText(slot, subRange) {
  if (!slot) return ''
  if (subRange) {
    const start = new Date(subRange.start)
    const end = new Date(subRange.end)
    return `${formatDateTime(start)} - ${formatTime(end)}`
  }
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
  const a = activity.value
  if (!a) return ''
  // 已報名的非建立者在活動還沒有結果之前（揪團中/建立者決選中），看到的是自己的報名狀態，
  // 不是活動整體的生命週期敘述——「建立者決選中」這種語氣是描述建立者在做什麼，跟報名者無關；
  // 已成團/已取消是最終結果，不分角色都要看到同一句話
  const inProgress = a.status === 'recruiting' || a.status === 'voting'
  if (!a.is_creator && a.has_joined && inProgress) {
    return '已報名'
  }
  const map = {
    recruiting: '揪團中',
    voting: '建立者決選中',
    confirmed: '已成團',
    cancelled: '已取消',
  }
  return map[a.status] ?? a.status
})

// 這個區塊只在 recruiting/voting 狀態渲染（見外層 v-if），不需要依狀態分支文案——
// 「候選時段」「可提前手動成團」「由建立者自由選擇」都是多餘資訊：清單本身內容一看就是時段列表，
// 提前成團有獨立按鈕可以按，「建立者在選」上方狀態徽章已經講過，不用標題再講一次
const decisionSectionLabel = '目前票數'

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
  // 候選時段 chip 清單的展開/提示框狀態、上一個活動殘留的報名錯誤訊息，都是這個元件實例
  // 自己的 UI 狀態，不是活動資料的一部分——resetPanel() 只在 modal 關閉時觸發，但同一個元件
  // 實例可能在還開著的情況下換一個 activityId 顯示（例如 DateEventsModal 一個列表點不同活動），
  // 這裡沒重置的話上一個活動的錯誤文字/展開狀態會誤帶到下一個活動的卡片上
  actionError.value = ''
  candidateChipsExpanded.value = false
  openChipDate.value = null
  resetVisibleCounts()
  openSupportersKey.value = null
  participantsExpanded.value = false
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
    // 情境二/三都是單一排序陣列，Array.isArray 為 true，套用同一套自動預選邏輯；
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
    await callAction('join', 'POST', '報名成功！', {
      candidateSlotIds: selectedJoinSlotIds.value,
    })
    return
  }
  await callAction('join', 'POST', '報名成功！')
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
  await callAction('join', 'POST', '報名成功！', { ranges })
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
  await callAction('join', 'POST', '報名成功！', { candidateSlotIds })
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
  await callAction('join', 'POST', '報名成功！', { candidateSlotIds, candidateSlotRanges })
}

async function handleCancelJoin() {
  await callAction('join', 'DELETE', '已取消報名')
}

async function handleConfirmFormation() {
  if (isRangeMode.value) {
    if (!selectedDecisionSlotId.value) {
      actionError.value = '請選擇要確認的候選時段'
      return
    }
    const candidate = normalizedDecisionEntries.value.find(
      (c) => c.radioId === selectedDecisionSlotId.value,
    )
    if (!candidate) return
    await callAction('confirm-formation', 'POST', '成團成功！', {
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
      g.segments.some((seg) => seg.radioId === selectedDecisionSlotId.value),
    )
    const segment = group?.segments.find((seg) => seg.radioId === selectedDecisionSlotId.value)
    if (!group || !segment) return
    await callAction('confirm-formation', 'POST', '成團成功！', {
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
    await callAction('confirm-formation', 'POST', '成團成功！', {
      candidateSlotId: selectedDecisionSlotId.value,
    })
    return
  }
  await callAction('confirm-formation', 'POST', '成團成功！')
}

async function handleCancel() {
  await callAction('cancel', 'POST', '活動已取消')
}

function resetPanel() {
  if (activeFetchController) activeFetchController.abort()
  activity.value = null
  fetchError.value = ''
  actionError.value = ''
  selectedJoinSlotIds.value = []
  selectedDecisionSlotId.value = null
  showAvailabilityPicker.value = false
  candidateChipsExpanded.value = false
  openChipDate.value = null
  resetVisibleCounts()
  openSupportersKey.value = null
  participantsExpanded.value = false
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
  const hour = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  return `${hour}:${min}`
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
  padding: 17px 20px 9px;
  flex: 0 0 auto;
}

.activity-detail-header-content {
  min-width: 0;
}

.activity-detail-top-row {
  display: flex;
  justify-content: space-between;
  gap: 16px;
}

.activity-detail-top-row {
  align-items: flex-start;
  margin-bottom: 8px;
}

.activity-detail-top-actions {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.activity-detail-kicker {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 400;
  letter-spacing: 0.08em;
  opacity: 0.65;
}

.activity-detail-header h2 {
  margin: 0;
  min-width: 0;
  color: var(--bujo-ink);
  font-size: clamp(24px, 2.35vw, 32px);
  line-height: 1.05;
  font-weight: 700;
}

.activity-detail-header-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 6px;
}

.activity-detail-date {
  margin-top: 6px;
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
  color: var(--bujo-danger);
}

.activity-detail-creator,
.activity-detail-participants,
.activity-detail-badges {
  display: flex;
  align-items: center;
  gap: 8px;
}

.activity-detail-creator {
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
}

.activity-detail-avatar {
  width: 25px;
  height: 25px;
  border: 1px solid var(--bujo-ink);
  border-radius: 999px;
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

.activity-detail-creator .activity-detail-avatar {
  width: 30px;
  height: 30px;
}

.activity-detail-avatar-toggle {
  cursor: pointer;
  padding: 0;
}

.activity-detail-avatar-toggle:hover,
.activity-detail-avatar-toggle:focus-visible {
  background: var(--bujo-white);
}

.activity-detail-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.activity-detail-info,
.activity-detail-options {
  display: grid;
  gap: 12px;
  font-size: 13px;
  line-height: 1.42;
  font-weight: 600;
}

/* 情境四會有兩個 .activity-detail-info 疊在一起（候選時段 chip 清單＋地點/備註），
   兩個 div 之間本來沒有間距，緊貼著看起來很擠，補上跟區塊內部一致的間距 */
.activity-detail-info + .activity-detail-info {
  margin-top: 12px;
}

.activity-detail-list-block {
  display: block;
}

.activity-detail-label {
  margin-bottom: 5px;
  color: rgba(var(--bujo-ink-rgb), 0.62);
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
}

.activity-detail-infinity {
  display: inline-block;
  font-size: 1.25em;
  font-weight: 400;
  line-height: 1;
  vertical-align: baseline;
}

.activity-detail-description {
  max-height: 4.5rem;
  overflow-y: auto;
  padding-right: 8px;
  white-space: pre-wrap;
}

.activity-detail-badges {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
}

.activity-detail-capacity-row {
  margin-top: 14px;
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

.activity-detail-count {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  font-weight: 700;
  color: rgba(var(--bujo-ink-rgb), 0.78);
  white-space: nowrap;
}

.activity-detail-avatars {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
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

.activity-detail-info > .activity-detail-label + .activity-detail-date-list,
.activity-detail-options > .activity-detail-label + .activity-detail-date-list {
  margin-top: -12px;
}

/* 用 > 限定直接子層，避免這條規則吃到巢狀在裡面的支持者頭像 span（例如 co_participants 頭像列） */
.activity-detail-date-list > span,
.activity-detail-date-list .activity-detail-chip {
  border: none;
  background: var(--bujo-white);
  color: var(--bujo-ink);
  padding: 5px 10px;
  font-size: 12px;
  font-weight: 800;
}

.activity-detail-date-list .activity-detail-chip {
  position: relative;
  cursor: pointer;
  font-family: inherit;
}

/* 「這是我自己選的」用底部一條 accent 色線標示，不用滿版黃底、也不加外框 */
.activity-detail-date-list .activity-detail-chip--mine {
  box-shadow: inset 0 -2px 0 var(--bujo-accent);
}

.activity-detail-date-list .activity-detail-chip--active {
  box-shadow: 0 1px 4px rgb(var(--bujo-ink-rgb) / 0.25);
}

.activity-detail-date-list .activity-detail-chip--more {
  align-self: flex-end;
  padding: 2px 5px;
  font-size: 11px;
  color: rgba(var(--bujo-ink-rgb), 0.72);
  cursor: pointer;
}

.activity-detail-chip-popover {
  position: absolute;
  bottom: calc(100% + 4px);
  left: 0;
  z-index: 6;
  border: none;
  border-radius: 2px;
  background: var(--bujo-white);
  color: var(--bujo-ink);
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 700;
  white-space: nowrap;
  box-shadow: 0 3px 8px rgb(var(--bujo-ink-rgb) / 0.28);
}

.activity-detail-muted {
  color: var(--bujo-muted);
  font-size: 12px;
  font-weight: 500;
}

.activity-detail-selection-entry {
  display: flex;
  align-items: center;
  gap: 6px;
}

.activity-detail-option,
.activity-detail-option-read {
  border: 1px solid rgba(var(--bujo-ink-rgb), 0.32);
  background: rgba(var(--bujo-white-rgb), 0.35);
  padding: 8px 9px;
}

.activity-detail-option {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 4px 8px;
  cursor: pointer;
}

.activity-detail-option--spread {
  justify-content: space-between;
}

.activity-detail-option-time {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  align-items: center;
  gap: 6px;
}

.activity-detail-option-right {
  display: flex;
  align-items: center;
  gap: 6px;
  white-space: nowrap;
  flex-shrink: 0;
  margin-left: auto;
}

.activity-detail-ratio {
  white-space: nowrap;
}

.activity-detail-group-label {
  position: relative;
  cursor: pointer;
  display: inline-block;
}

.activity-detail-supporters {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.activity-detail-option--selected {
  border-color: var(--bujo-ink);
  background: rgba(var(--bujo-white-rgb), 0.62);
}

/* 已過期的候選項目維持顯示在原位置（不整個移除），但停用互動——降低透明度＋游標改為
   不可點選，額外的「已過期」文字標籤（見 template）確保不只靠顏色/透明度傳達語意 */
.activity-detail-option--expired {
  opacity: 0.5;
  cursor: not-allowed;
}

.activity-detail-expired-label {
  font-size: 11px;
  font-weight: 700;
  color: rgba(var(--bujo-ink-rgb), 0.6);
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
  justify-content: center;
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
