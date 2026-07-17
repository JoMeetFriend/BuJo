<template>
  <BaseModal :isOpen="modalOpen" title="建立揪團活動" scrollable @close="closeForm">
    <template #default>
      <form id="event-form" class="grid gap-4" @submit.prevent="submitForm">
        <label :class="[fieldClass, 'col-span-full']" for="event-name">
          <span :class="fieldLabelClass"
            >活動名稱
            <span class="text-[var(--bujo-muted-strong)]" aria-hidden="true">*</span></span
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

        <div class="grid grid-cols-2 gap-5 max-sm:gap-2">
          <label :class="fieldClass" for="event-type">
            <span :class="fieldLabelClass">活動類型</span>
            <span class="relative block">
              <select
                id="event-type"
                v-model="form.type"
                :class="[
                  inputClass,
                  'cursor-pointer appearance-none pr-12',
                  form.type === null ? 'text-[var(--bujo-muted)]' : '',
                ]"
              >
                <option :value="null">---</option>
                <option v-for="type in eventTypes" :key="type" :value="type">
                  {{ type }}
                </option>
              </select>
              <svg
                class="pointer-events-none absolute right-5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-current stroke-2 text-[var(--bujo-ink)] [stroke-linecap:round] [stroke-linejoin:round]"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </span>
          </label>

          <div :class="fieldClass">
            <span class="flex items-baseline gap-1.5">
              <span :class="fieldLabelClass">人數上限</span>
              <span class="text-[11px] font-normal leading-none text-[var(--bujo-muted)]">
                含自己
              </span>
            </span>
            <span class="relative block">
              <input
                id="event-limit"
                :value="form.limit ?? ''"
                :class="[inputClass, 'pr-9']"
                type="number"
                inputmode="numeric"
                min="2"
                step="1"
                placeholder="不限"
                @input="updateLimit($event.target.value)"
              />
              <button
                type="button"
                class="absolute right-0 top-0 bottom-0 w-8 flex items-center justify-center border-l border-l-[var(--bujo-line-soft)] text-[var(--bujo-muted)] hover:text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)] focus:outline-none"
                aria-label="清除人數上限"
                @click="form.limit = null"
              >
                ✕
              </button>
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

        <div
          class="col-span-full grid gap-2 border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 py-3"
        >
          <!-- Q1: 日期確定了嗎？ -->
          <div class="px-0.5">
            <div
              class="grid min-h-[34px] grid-cols-[auto_1fr_auto] items-center gap-3 border-b border-[rgb(var(--bujo-ink-rgb)/0.08)] pb-2 max-sm:grid-cols-[1fr_auto] max-sm:gap-x-2 max-sm:gap-y-1"
            >
              <span class="text-[13px] font-semibold leading-5 text-[var(--bujo-ink)]"
                >日期確定了嗎？</span
              >
              <span
                class="min-w-0 text-xs leading-5 text-[var(--bujo-muted)] max-sm:col-span-2 max-sm:row-start-2"
              >
                {{ dateModeHint }}
              </span>
              <label class="gui-switch justify-self-end">
                <input
                  v-model="isDateFixed"
                  class="gui-switch__input"
                  type="checkbox"
                  role="switch"
                  aria-label="日期確定了嗎？"
                />
                <span class="gui-switch__track" aria-hidden="true">
                  <span class="gui-switch__thumb"></span>
                </span>
              </label>
            </div>
          </div>

          <!-- Q2: 時間確定了嗎？ -->
          <div class="px-0.5">
            <div
              class="grid min-h-[34px] grid-cols-[auto_1fr_auto] items-center gap-3 py-0.5 max-sm:grid-cols-[1fr_auto] max-sm:gap-x-2 max-sm:gap-y-1"
            >
              <span class="text-[13px] font-semibold leading-5 text-[var(--bujo-ink)]"
                >時間確定了嗎？</span
              >
              <span
                class="min-w-0 text-xs leading-5 text-[var(--bujo-muted)] max-sm:col-span-2 max-sm:row-start-2"
              >
                {{ timeModeHint }}
              </span>
              <label class="gui-switch justify-self-end">
                <input
                  v-model="isTimeFixed"
                  class="gui-switch__input"
                  type="checkbox"
                  role="switch"
                  aria-label="時間確定了嗎？"
                />
                <span class="gui-switch__track" aria-hidden="true">
                  <span class="gui-switch__thumb"></span>
                </span>
              </label>
            </div>
          </div>
          <!-- 情境說明 -->
          <div
            v-if="dateMode !== 'fixed' || timeMode !== 'fixed'"
            class="border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 py-2 text-xs leading-5 text-[var(--bujo-muted-strong)]"
          >
            {{ scenarioDescription }}
          </div>

          <div
            v-if="dateMode === 'fixed' && timeMode === 'fixed'"
            ref="schedulePickerRef"
            class="grid gap-1.5 max-sm:gap-1 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
            @click="closePicker"
          >
            <div
              v-if="!isStartDateToday"
              class="grid grid-cols-[72px_1fr] max-sm:grid-cols-[56px_1fr] items-center gap-3 max-sm:gap-2"
            >
              <span :class="[fieldLabelClass, 'text-right']">整日：</span>
              <label class="inline-flex w-fit items-center">
                <input
                  v-model="form.allDay"
                  class="h-7 w-7 max-sm:h-6 max-sm:w-6 cursor-pointer appearance-none rounded-none border border-[var(--bujo-line)] bg-[var(--bujo-surface)] checked:border-[var(--bujo-ink)] checked:bg-[var(--bujo-ink)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
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
                    @click.stop="openPicker(row.dateField)"
                  >
                    {{ form[row.dateField] }}
                  </button>

                  <div
                    v-if="activePicker === row.dateField"
                    :class="[pickerPanelClass, 'left-0 w-[280px] max-sm:w-full']"
                    role="dialog"
                    :aria-label="row.dateMenuLabel"
                    @click.stop
                  >
                    <div class="mb-2 flex items-center justify-between gap-2">
                      <button
                        class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                        type="button"
                        aria-label="上一個月"
                        @click="moveMonth(-1)"
                      >
                        ‹
                      </button>
                      <p class="m-0 text-center text-sm leading-none text-[var(--bujo-ink)]">
                        {{ monthTitle }}
                      </p>
                      <button
                        class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                        type="button"
                        aria-label="下一個月"
                        @click="moveMonth(1)"
                      >
                        ›
                      </button>
                    </div>

                    <div
                      class="mb-1 grid grid-cols-7 gap-1 text-center text-sm text-[var(--bujo-muted-strong)]"
                    >
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
                    :class="[
                      pickerButtonClass,
                      'w-full',
                      row.timeField === 'startTime' && timeError ? 'border-[#dc2626]' : '',
                    ]"
                    type="button"
                    :data-time-field="row.timeField"
                    @click.stop="openPicker(row.timeField)"
                  >
                    <span :class="form[row.timeField] ? '' : 'text-[var(--bujo-muted)]'">
                      {{ form[row.timeField] ?? '-- : --' }}
                    </span>
                  </button>
                  <p
                    v-if="row.timeField === 'startTime' && timeError"
                    class="mt-1 flex items-center gap-1 text-xs text-[#dc2626]"
                  >
                    <span>⚠</span> {{ timeError }}
                  </p>

                  <div
                    v-if="activePicker === row.timeField"
                    :class="[pickerPanelClass, 'right-0 w-full min-w-[160px]']"
                    role="listbox"
                    :aria-label="row.timeMenuLabel"
                    @click.stop
                  >
                    <div class="max-h-[208px] overflow-y-auto pr-1">
                      <button
                        v-for="time in currentPickerTimeOptions"
                        :key="time"
                        class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
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

            <ReportCutoffReminder
              :is-warning="isReportCutoffWarning"
              :remaining-minutes="minutesUntilVoteDeadline"
              :time-label="reportCutoffTimeLabel"
              :offset-parts="reportCutoffOffsetParts"
              :show-editor="showDeadlineEditor"
              :presets="DEADLINE_PRESETS"
              :selected-preset-key="selectedDeadlinePresetKey"
              @toggle-editor="toggleDeadlineEditor"
              @select-preset="selectedDeadlinePresetKey = $event"
            />
          </div>

          <div
            v-else-if="dateMode === 'fixed' && timeMode === 'vote'"
            ref="schedulePickerRef"
            class="grid gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
            @click="closePicker"
          >
            <div class="grid grid-cols-[52px_1fr] max-sm:grid-cols-[40px_1fr] items-start gap-2">
              <span :class="[fieldLabelClass, 'pt-2 whitespace-nowrap']">日期：</span>
              <span class="relative block">
                <button
                  id="event-single-date"
                  :class="[pickerButtonClass, 'w-full']"
                  type="button"
                  @click.stop="openPicker('singleDate')"
                >
                  {{ form.singleDate }}
                </button>

                <div
                  v-if="activePicker === 'singleDate'"
                  :class="[pickerPanelClass, 'left-0 w-[280px] max-sm:w-full']"
                  role="dialog"
                  aria-label="活動日期選單"
                  @click.stop
                >
                  <div class="mb-2 flex items-center justify-between gap-2">
                    <button
                      class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                      type="button"
                      aria-label="上一個月"
                      @click="moveMonth(-1)"
                    >
                      ‹
                    </button>
                    <p class="m-0 text-center text-sm leading-none text-[var(--bujo-ink)]">
                      {{ monthTitle }}
                    </p>
                    <button
                      class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                      type="button"
                      aria-label="下一個月"
                      @click="moveMonth(1)"
                    >
                      ›
                    </button>
                  </div>

                  <div
                    class="mb-1 grid grid-cols-7 gap-1 text-center text-sm text-[var(--bujo-muted-strong)]"
                  >
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
            </div>

            <div class="grid gap-2">
              <span :class="fieldLabelClass">可投票時段</span>

              <div class="grid max-w-[280px] grid-cols-[1fr_12px_1fr] items-center gap-2">
                <span class="relative block">
                  <button
                    id="event-time-window-start"
                    :class="[pickerButtonClass, 'w-full']"
                    type="button"
                    @click.stop="toggleSlotPicker('timeWindow:startTime')"
                  >
                    <span :class="timeWindow.startTime ? '' : 'text-[var(--bujo-muted)]'">{{
                      timeWindow.startTime ?? '-- : --'
                    }}</span>
                  </button>
                  <div
                    v-if="openSlotPicker === 'timeWindow:startTime'"
                    :class="[pickerPanelClass, 'left-0 w-full min-w-[160px]']"
                    role="listbox"
                    aria-label="時段範圍開始時間選單"
                    @click.stop
                  >
                    <div class="max-h-[208px] overflow-y-auto pr-1">
                      <button
                        v-for="time in timeWindowStartOptions"
                        :key="time"
                        class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                        :class="
                          timeWindow.startTime === time
                            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
                            : ''
                        "
                        type="button"
                        role="option"
                        :aria-selected="timeWindow.startTime === time"
                        @click="selectSlotTime(timeWindow, 'startTime', time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </span>

                <span class="text-center text-sm text-[var(--bujo-ink)]">–</span>

                <span class="relative block">
                  <button
                    id="event-time-window-end"
                    :class="[pickerButtonClass, 'w-full']"
                    type="button"
                    @click.stop="toggleSlotPicker('timeWindow:endTime')"
                  >
                    <span :class="timeWindow.endTime ? '' : 'text-[var(--bujo-muted)]'">{{
                      timeWindow.endTime ?? '-- : --'
                    }}</span>
                  </button>
                  <div
                    v-if="openSlotPicker === 'timeWindow:endTime'"
                    :class="[pickerPanelClass, 'right-0 w-full min-w-[160px]']"
                    role="listbox"
                    aria-label="時段範圍結束時間選單"
                    @click.stop
                  >
                    <div class="max-h-[208px] overflow-y-auto pr-1">
                      <button
                        v-for="time in timeWindowEndTimeOptions"
                        :key="time"
                        class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                        :class="
                          timeWindow.endTime === time
                            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
                            : ''
                        "
                        type="button"
                        role="option"
                        :aria-selected="timeWindow.endTime === time"
                        @click="selectSlotTime(timeWindow, 'endTime', time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </span>
              </div>

              <p v-if="timeError" class="flex items-center gap-1 text-xs text-[#dc2626]">
                <span>⚠</span> {{ timeError }}
              </p>
            </div>

            <ReportCutoffReminder
              :is-warning="isReportCutoffWarning"
              :remaining-minutes="minutesUntilVoteDeadline"
              :time-label="reportCutoffTimeLabel"
              :offset-parts="reportCutoffOffsetParts"
              :show-editor="showDeadlineEditor"
              :presets="DEADLINE_PRESETS"
              :selected-preset-key="selectedDeadlinePresetKey"
              @toggle-editor="toggleDeadlineEditor"
              @select-preset="selectedDeadlinePresetKey = $event"
            />
          </div>

          <div
            v-else-if="dateMode === 'range' && timeMode === 'fixed'"
            ref="schedulePickerRef"
            class="grid gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
            @click="closePicker"
          >
            <div class="grid gap-2">
              <span :class="fieldLabelClass">候選日期</span>

              <div class="mb-1 flex items-center justify-between gap-2">
                <button
                  class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                  type="button"
                  aria-label="上一個月"
                  @click="moveMonth(-1)"
                >
                  ‹
                </button>
                <p class="m-0 text-center text-sm leading-none text-[var(--bujo-ink)]">
                  {{ monthTitle }}
                </p>
                <button
                  class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                  type="button"
                  aria-label="下一個月"
                  @click="moveMonth(1)"
                >
                  ›
                </button>
              </div>

              <div
                class="mb-1 grid grid-cols-7 gap-1 text-center text-sm text-[var(--bujo-muted-strong)]"
              >
                <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
              </div>

              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="cell in candidateDateCells"
                  :key="cell.key"
                  :class="candidateDateButtonClass(cell)"
                  type="button"
                  :aria-label="cell.key"
                  :aria-pressed="cell.isSelected"
                  :data-date="cell.key"
                  @click="toggleCandidateDate(cell)"
                >
                  {{ cell.label }}
                </button>
              </div>
            </div>

            <div class="grid gap-2 border-t border-dashed border-[var(--bujo-line-soft)] pt-2">
              <div class="grid grid-cols-[52px_1fr] max-sm:grid-cols-[40px_1fr] items-center gap-2">
                <span :class="[fieldLabelClass, 'whitespace-nowrap']">整日：</span>
                <label class="inline-flex w-fit items-center">
                  <input
                    v-model="uniformTime.allDay"
                    :disabled="isAllDayLockedByToday"
                    class="h-7 w-7 max-sm:h-6 max-sm:w-6 cursor-pointer appearance-none rounded-none border border-[var(--bujo-line)] bg-[var(--bujo-surface)] checked:border-[var(--bujo-ink)] checked:bg-[var(--bujo-ink)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--bujo-accent)] disabled:cursor-not-allowed disabled:opacity-40"
                    type="checkbox"
                    aria-label="整日"
                    @change="closePicker"
                  />
                </label>
              </div>

              <template v-if="!uniformTime.allDay">
                <span :class="fieldLabelClass">統一時間（套用到所有已選日期）</span>
                <p
                  v-if="candidateDates.includes(formatDateValue(new Date()))"
                  class="m-0 text-xs text-[var(--bujo-muted-strong)]"
                >
                  日期選擇包含今天，時段僅顯示尚未過去的時間
                </p>
                <div class="grid max-w-[280px] grid-cols-[1fr_12px_1fr] items-center gap-2">
                  <span class="relative block">
                    <button
                      :class="[pickerButtonClass, 'w-full']"
                      type="button"
                      @click.stop="toggleSlotPicker('uniform:startTime')"
                    >
                      <span :class="uniformTime.startTime ? '' : 'text-[var(--bujo-muted)]'">{{
                        uniformTime.startTime ?? '-- : --'
                      }}</span>
                    </button>
                    <div
                      v-if="openSlotPicker === 'uniform:startTime'"
                      :class="[pickerPanelClass, 'left-0 w-full min-w-[160px]']"
                      role="listbox"
                      aria-label="統一開始時間選單"
                      @click.stop
                    >
                      <div class="max-h-[208px] overflow-y-auto pr-1">
                        <button
                          v-for="time in uniformStartTimeOptions"
                          :key="time"
                          class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                          :class="
                            uniformTime.startTime === time
                              ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
                              : ''
                          "
                          type="button"
                          role="option"
                          :aria-selected="uniformTime.startTime === time"
                          @click="selectSlotTime(uniformTime, 'startTime', time)"
                        >
                          {{ time }}
                        </button>
                      </div>
                    </div>
                  </span>

                  <span class="text-center text-sm text-[var(--bujo-ink)]">–</span>

                  <span class="relative block">
                    <button
                      :class="[pickerButtonClass, 'w-full']"
                      type="button"
                      @click.stop="toggleSlotPicker('uniform:endTime')"
                    >
                      <span :class="uniformTime.endTime ? '' : 'text-[var(--bujo-muted)]'">{{
                        uniformTime.endTime ?? '-- : --'
                      }}</span>
                    </button>
                    <div
                      v-if="openSlotPicker === 'uniform:endTime'"
                      :class="[pickerPanelClass, 'right-0 w-full min-w-[160px]']"
                      role="listbox"
                      aria-label="統一結束時間選單"
                      @click.stop
                    >
                      <div class="max-h-[208px] overflow-y-auto pr-1">
                        <button
                          v-for="time in uniformEndTimeOptions"
                          :key="time"
                          class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                          :class="
                            uniformTime.endTime === time
                              ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
                              : ''
                          "
                          type="button"
                          role="option"
                          :aria-selected="uniformTime.endTime === time"
                          @click="selectSlotTime(uniformTime, 'endTime', time)"
                        >
                          {{ time }}
                        </button>
                      </div>
                    </div>
                  </span>
                </div>
              </template>
            </div>

            <ReportCutoffReminder
              :is-warning="isReportCutoffWarning"
              :remaining-minutes="minutesUntilVoteDeadline"
              :time-label="reportCutoffTimeLabel"
              :offset-parts="reportCutoffOffsetParts"
              :show-editor="showDeadlineEditor"
              :presets="DEADLINE_PRESETS"
              :selected-preset-key="selectedDeadlinePresetKey"
              @toggle-editor="toggleDeadlineEditor"
              @select-preset="selectedDeadlinePresetKey = $event"
            />
          </div>

          <div
            v-else
            ref="schedulePickerRef"
            class="grid gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
            @click="closePicker"
          >
            <div class="grid gap-2">
              <span :class="fieldLabelClass">候選日期與時段</span>

              <div class="mb-1 flex items-center justify-between gap-2">
                <button
                  class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                  type="button"
                  aria-label="上一個月"
                  @click="moveMonth(-1)"
                >
                  ‹
                </button>
                <p class="m-0 text-center text-sm leading-none text-[var(--bujo-ink)]">
                  {{ monthTitle }}
                </p>
                <button
                  class="grid h-8 w-8 max-sm:h-7 max-sm:w-7 place-items-center border border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-lg leading-none text-[var(--bujo-ink)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-white)]"
                  type="button"
                  aria-label="下一個月"
                  @click="moveMonth(1)"
                >
                  ›
                </button>
              </div>

              <div
                class="mb-1 grid grid-cols-7 gap-1 text-center text-sm text-[var(--bujo-muted-strong)]"
              >
                <span v-for="weekday in weekdays" :key="weekday">{{ weekday }}</span>
              </div>

              <div class="grid grid-cols-7 gap-1">
                <button
                  v-for="cell in scenario4DateCells"
                  :key="cell.key"
                  :class="scenario4DateButtonClass(cell)"
                  type="button"
                  :disabled="cell.isDisabled"
                  :aria-label="cell.key"
                  :aria-pressed="cell.isCandidate"
                  :data-date="cell.key"
                  @click="toggleScenario4Date(cell)"
                >
                  {{ cell.label }}
                  <span
                    v-if="cell.isConfigured"
                    class="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[var(--bujo-ink)]"
                  />
                </button>
              </div>
            </div>

            <!-- 正在編輯中的候選日時段 -->
            <div
              v-if="editingSlot"
              data-scenario4-editing-panel
              class="grid gap-2 border-t border-dashed border-[var(--bujo-line-soft)] pt-2"
            >
              <div class="flex items-center justify-between gap-2">
                <span :class="fieldLabelClass">{{ shortDate(editingSlot.date) }} 的候選時段</span>
                <button
                  type="button"
                  class="text-xs text-[var(--bujo-muted-strong)] hover:text-[#dc2626]"
                  @click.stop="removeCandidateSlot(editingSlot.date)"
                >
                  移除此候選日期
                </button>
              </div>

              <div
                v-for="slot in editingSlot.timeSlots"
                :key="slot.id"
                class="grid grid-cols-[52px_1fr_12px_1fr] max-sm:grid-cols-[40px_1fr_10px_1fr] items-center gap-2"
              >
                <span :class="fieldLabelClass">時段</span>

                <span class="relative block">
                  <button
                    :class="[pickerButtonClass, 'w-full']"
                    type="button"
                    data-scenario4-start-time-button
                    @click.stop="toggleSlotPicker(`${slot.id}:startTime`)"
                  >
                    <span :class="slot.startTime ? '' : 'text-[var(--bujo-muted)]'">{{
                      slot.startTime ?? '-- : --'
                    }}</span>
                  </button>
                  <div
                    v-if="openSlotPicker === `${slot.id}:startTime`"
                    :class="[pickerPanelClass, 'left-0 w-full min-w-[160px]']"
                    role="listbox"
                    aria-label="候選開始時間選單"
                    @click.stop
                  >
                    <div class="max-h-[208px] overflow-y-auto pr-1">
                      <button
                        v-for="time in slotStartTimeOptions(editingSlot.date)"
                        :key="time"
                        class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                        :class="
                          slot.startTime === time
                            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
                            : ''
                        "
                        type="button"
                        role="option"
                        :aria-selected="slot.startTime === time"
                        @click="selectSlotTime(slot, 'startTime', time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </span>

                <span class="text-center text-sm text-[var(--bujo-ink)]">–</span>

                <span class="relative block">
                  <button
                    :class="[pickerButtonClass, 'w-full']"
                    type="button"
                    @click.stop="toggleSlotPicker(`${slot.id}:endTime`)"
                  >
                    <span :class="slot.endTime ? '' : 'text-[var(--bujo-muted)]'">{{
                      slot.endTime ?? '-- : --'
                    }}</span>
                  </button>
                  <div
                    v-if="openSlotPicker === `${slot.id}:endTime`"
                    :class="[pickerPanelClass, 'right-0 w-full min-w-[160px]']"
                    role="listbox"
                    aria-label="候選結束時間選單"
                    @click.stop
                  >
                    <div class="max-h-[208px] overflow-y-auto pr-1">
                      <button
                        v-for="time in slotEndTimeOptions(slot)"
                        :key="time"
                        class="mb-1 block min-h-9 max-sm:min-h-8 w-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] px-3 max-sm:px-2 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] last:mb-0 hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
                        :class="
                          slot.endTime === time
                            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
                            : ''
                        "
                        type="button"
                        role="option"
                        :aria-selected="slot.endTime === time"
                        @click="selectSlotTime(slot, 'endTime', time)"
                      >
                        {{ time }}
                      </button>
                    </div>
                  </div>
                </span>
              </div>
            </div>

            <!-- 已選候選組合 -->
            <div class="grid gap-2 border-t border-dashed border-[var(--bujo-line-soft)] pt-2">
              <span :class="fieldLabelClass">已選候選組合</span>
              <p v-if="configuredSlots.length === 0" class="text-xs text-[var(--bujo-muted)]">
                尚無
              </p>
              <div v-else class="flex flex-wrap gap-2">
                <span
                  v-for="slot in configuredSlots"
                  :key="slot.id"
                  class="border border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] px-2 py-1 text-xs text-[var(--bujo-ink)]"
                >
                  {{ shortDate(slot.date) }} {{ slot.startTime }}–{{ slot.endTime }}
                </span>
              </div>
            </div>

            <ReportCutoffReminder
              :is-warning="isReportCutoffWarning"
              :remaining-minutes="minutesUntilVoteDeadline"
              :time-label="reportCutoffTimeLabel"
              :offset-parts="reportCutoffOffsetParts"
              :show-editor="showDeadlineEditor"
              :presets="DEADLINE_PRESETS"
              :selected-preset-key="selectedDeadlinePresetKey"
              @toggle-editor="toggleDeadlineEditor"
              @select-preset="selectedDeadlinePresetKey = $event"
            />
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
        <div
          v-if="submitError"
          class="col-span-full flex items-start gap-2 border border-[#dc2626] bg-[var(--bujo-surface)] px-3 py-2 text-xs text-[#dc2626]"
        >
          ⚠️ {{ submitError }}
        </div>
      </form>
    </template>

    <template #footer>
      <PixelButton variant="white" type="button" @click="closeForm">取消</PixelButton>
      <PixelButton form="event-form" type="submit" :disabled="isSubmitting">
        {{ isSubmitting ? '送出中...' : '送出揪團' }}
      </PixelButton>
    </template>
  </BaseModal>

  <!-- 緊急送出確認 dialog -->
  <BaseModal :isOpen="showUrgentConfirm" title="活動即將開始" @close="showUrgentConfirm = false">
    <template #default>
      <div class="grid gap-3 py-2 text-center">
        <p class="text-sm leading-6 text-[var(--bujo-ink)]">
          距離活動開始只剩 {{ minutesUntilCeiling }} 分鐘
        </p>
        <p class="text-sm leading-6 text-[var(--bujo-ink)]">確定要建立活動嗎？</p>
      </div>
    </template>
    <template #footer>
      <PixelButton variant="white" type="button" @click="showUrgentConfirm = false"
        >取消</PixelButton
      >
      <PixelButton type="button" :disabled="isSubmitting" @click="confirmUrgentSubmit">
        {{ isSubmitting ? '送出中...' : '確定送出' }}
      </PixelButton>
    </template>
  </BaseModal>

  <!-- 建立成功彈窗：點右上角 × 關閉 -->
  <BaseModal :isOpen="showSuccessModal" title="建立成功" @close="dismissSuccessModal">
    <div class="flex flex-col items-center gap-2 py-6 text-center">
      <img :src="partyDanceUrl" alt="" class="h-12 w-12" aria-hidden="true" />
      <p class="text-lg font-bold text-[var(--bujo-ink)]">已成功建立活動</p>
      <p class="text-sm text-[var(--bujo-muted-strong)]">好友會在活動列表看到這個揪團</p>
    </div>
  </BaseModal>
</template>

<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import BaseModal from './ui/BaseModal.vue'
import PixelButton from './ui/PixelButton.vue'
import ReportCutoffReminder from './ReportCutoffReminder.vue'
import partyDanceUrl from '@/assets/party-dance.png'
import {
  createTimeOptions,
  formatHourAsTimeString,
  parseDateTimeValue,
  parseHourFromTimeStr,
} from '@/utils/timeFormat'

const props = defineProps({
  isOpen: Boolean,
  // 從行事曆日期格點進來時帶入的日期，格式 'YYYY-MM-DD'
  initialDate: { type: String, default: null },
})
const emit = defineEmits(['close', 'submit'])

const route = useRoute()
const router = useRouter()
const isRouteComponent = computed(() => route.name === 'event-new')
const modalOpen = computed(() => (isRouteComponent.value ? true : props.isOpen))

const eventTypes = ['吃飯', '運動', '讀書', '逛街', '看展', '其他']
const dateFields = ['startDate', 'endDate', 'singleDate']
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
  type: null,
  limit: null,
  location: '',
  allDay: false,
  startDate: today,
  startTime: null,
  endDate: today,
  endTime: null,
  singleDate: today,
  note: '',
})

function updateLimit(value) {
  if (value === '') {
    form.limit = null
    return
  }

  const numericValue = Number(value)
  if (!Number.isFinite(numericValue)) {
    form.limit = null
    return
  }

  form.limit = Math.max(2, Math.floor(numericValue))
}

// 情境一（日期X時間皆已確定）：開始日期是今天時，只能約當天某個時段，不能整日，
// 所以把「整日」選項藏起來，並清掉可能殘留的勾選
const isStartDateToday = computed(() => form.startDate === today)
watch(isStartDateToday, (isToday) => {
  if (isToday) form.allDay = false
})

// 日期／時間確定情境
const dateMode = ref('fixed') // 'fixed' | 'range'
const timeMode = ref('fixed') // 'fixed' | 'vote'
const isDateFixed = computed({
  get: () => dateMode.value === 'fixed',
  set: (checked) => {
    dateMode.value = checked ? 'fixed' : 'range'
  },
})
const isTimeFixed = computed({
  get: () => timeMode.value === 'fixed',
  set: (checked) => {
    timeMode.value = checked ? 'fixed' : 'vote'
  },
})
const dateModeHint = computed(() =>
  dateMode.value === 'fixed' ? '日期確定了！' : '還沒～選幾天讓大家投票',
)
const timeModeHint = computed(() =>
  timeMode.value === 'fixed' ? '時間確定了！' : '還沒～選時段讓大家投票',
)

// 從行事曆日期格點進來：預設情境一（日期固定X時間固定），並把點選的日期帶入
// 情境一的開始／結束日期，以及情境二（日期固定X時間讓大家選）的日期
watch(
  () => props.isOpen,
  (open) => {
    if (!open || !props.initialDate) return
    dateMode.value = 'fixed'
    timeMode.value = 'fixed'
    const dateValue = props.initialDate.replaceAll('-', '/')
    form.startDate = dateValue
    form.endDate = dateValue
    form.singleDate = dateValue
  },
)

const scenarioDescription = computed(() => {
  if (dateMode.value === 'fixed' && timeMode.value === 'fixed') {
    return '日期、時間都確定了！大家可以直接報名參加'
  }
  if (dateMode.value === 'fixed' && timeMode.value === 'vote') {
    return '日期確定了，還沒決定時間，選幾個時段讓大家投票'
  }
  if (dateMode.value === 'range' && timeMode.value === 'fixed') {
    return '日期還沒決定，選幾天讓大家投票，時間維持固定'
  }
  return '日期、時間都還沒，選幾個日期＋時段讓大家投票'
})

// 情境二：選填的時段範圍，限制參與者可回報的時間
const timeWindow = reactive({ startTime: null, endTime: null, endTimeUserSet: false })
const openSlotPicker = ref(null) // `${slotId}:startTime` | `${slotId}:endTime` | null

function toggleSlotPicker(key) {
  openSlotPicker.value = openSlotPicker.value === key ? null : key
}

function selectSlotTime(slot, field, time) {
  if (field === 'endTime') {
    slot.endTime = time
    slot.endTimeUserSet = true
    openSlotPicker.value = null
    return
  }

  slot.startTime = time
  if (slot.endTimeUserSet) {
    // 使用者已經手動選過結束時間：只有在新的開始時間讓它不再合理時才清掉，不然尊重使用者的選擇
    if (slot.endTime && parseHourFromTimeStr(slot.endTime) <= parseHourFromTimeStr(time)) {
      slot.endTime = null
      slot.endTimeUserSet = false
    }
  } else {
    // 還沒手動選過結束時間：自動帶入開始時間 +1 小時，一小時是常見的活動時長，省一次選取動作
    const endHour = (parseHourFromTimeStr(time) + 1) % 24
    slot.endTime = timeOptions[endHour]
  }
  openSlotPicker.value = null
}

// 情境三：候選日期（日期開放投票，時間固定）
const candidateDates = ref([])
const uniformTime = reactive({
  startTime: null,
  endTime: null,
  allDay: false,
  endTimeUserSet: false,
})

// 情境三：整日已勾選時，「今天」不可能再是完整一天，跟情境一的 isStartDateToday 規則同理，
// 直接鎖住「今天」這一格，不讓使用者選進一個已經不成立的整日候選日
// 情境三：已選的統一開始時間若已經不在 uniformStartTimeOptions（對今天而言已經過去），
// 「今天」這一格也要鎖住——避免使用者在選了未來日期的時間之後才把今天加進候選日期，
// 讓一個對今天無效的時間留在畫面上、要等送出才被擋下來
const isTodayLockedForCandidateDate = computed(() => {
  if (uniformTime.allDay) return true
  // 不能直接看 uniformStartTimeOptions：那個 computed 只在「今天已經在 candidateDates 裡」
  // 時才會套用過去時段過濾，這裡是在判斷「今天能不能被加進去」，今天當下還不在清單裡，
  // 要強制以「今天」為基準重新篩一次，不能依賴 candidateDates 目前的狀態
  if (
    uniformTime.startTime &&
    !excludePastHoursIfToday(true, timeOptions).includes(uniformTime.startTime)
  ) {
    return true
  }
  return false
})

// 情境三：候選日期已經包含今天時，「整日」開關要鎖住——今天已經過了一部分，不可能是
// 完整一天，跟上面 isTodayLockedForCandidateDate 是同一條規則的另一個方向
const isAllDayLockedByToday = computed(() =>
  candidateDates.value.includes(formatDateValue(new Date())),
)

const candidateDateCells = computed(() => {
  const todayValue = formatDateValue(new Date())
  return buildMonthGridCells(visibleMonth.value).map((cell) => ({
    ...cell,
    isSelected: candidateDates.value.includes(cell.key),
    isDisabled:
      cell.key < todayValue || (cell.key === todayValue && isTodayLockedForCandidateDate.value),
  }))
})

function toggleCandidateDate(cell) {
  if (cell.isDisabled) return
  candidateDates.value = candidateDates.value.includes(cell.key)
    ? candidateDates.value.filter((date) => date !== cell.key)
    : [...candidateDates.value, cell.key].sort()
}

// 情境四：候選日期，且每個日期可有多個候選時段
let scenario4SlotIdSeq = 1
const candidateSlots = ref([]) // [{ date, timeSlots: [{ id, startTime, endTime }] }]
const editingSlotDate = ref(null)

const editingSlot = computed(
  () => candidateSlots.value.find((slot) => slot.date === editingSlotDate.value) ?? null,
)

const configuredSlots = computed(() =>
  candidateSlots.value.flatMap((entry) =>
    entry.timeSlots
      .filter((slot) => slot.startTime && slot.endTime)
      .map((slot) => ({
        id: slot.id,
        date: entry.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
      })),
  ),
)

const scenario4DateCells = computed(() => {
  const todayValue = formatDateValue(new Date())
  return buildMonthGridCells(visibleMonth.value).map((cell) => {
    const entry = candidateSlots.value.find((s) => s.date === cell.key)
    return {
      ...cell,
      isCandidate: !!entry,
      isEditing: editingSlotDate.value === cell.key,
      isConfigured: !!entry?.timeSlots.some((slot) => slot.startTime && slot.endTime),
      isDisabled: cell.key < todayValue,
    }
  })
})

function scenario4DateButtonClass(cell) {
  const base = 'relative h-8 max-sm:h-7 border text-xs leading-none transition-colors'
  if (cell.isDisabled) {
    return [
      base,
      'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-muted)] cursor-not-allowed opacity-40',
    ]
  }
  if (cell.isEditing) {
    return [base, 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]']
  }
  // 已點選成候選日期但時段還沒填完整時，不要用跟「已設定完成」一樣的黃底——
  // 黃底看起來像是已經完成，容易誤導。用邊框標示「還在候選中」就好，填完時段才給黃底
  if (cell.isCandidate && cell.isConfigured) {
    return [
      base,
      'border-[var(--bujo-line)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)] hover:border-[var(--bujo-accent)]',
    ]
  }
  if (cell.isCandidate) {
    return [
      base,
      'border-[var(--bujo-accent)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]',
    ]
  }
  return [
    base,
    'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]',
    !cell.isCurrentMonth && 'text-[var(--bujo-muted)]',
    cell.isToday &&
      'border-[var(--bujo-line)] bg-[var(--bujo-today)] shadow-[inset_0_0_0_1px_var(--bujo-accent)]',
  ]
}

// 點還沒選過的日期時，新增候選日期跟打開編輯面板要一次完成，不能只新增候選日期就
// return——不然使用者要點兩次才看得到時段輸入框，像是壞掉
function toggleScenario4Date(cell) {
  if (cell.isDisabled) return
  if (!cell.isCandidate) {
    candidateSlots.value = [
      ...candidateSlots.value,
      {
        date: cell.key,
        timeSlots: [
          { id: scenario4SlotIdSeq++, startTime: null, endTime: null, endTimeUserSet: false },
        ],
      },
    ].sort((a, b) => a.date.localeCompare(b.date))
    editingSlotDate.value = cell.key
    nextTick(() => focusNewSlotEditor())
    return
  }
  editingSlotDate.value = editingSlotDate.value === cell.key ? null : cell.key
}

// 新增候選日期後編輯面板可能在可視範圍外（尤其手機版），捲動過去並把焦點移到開始時間按鈕，
// 讓使用者清楚知道接下來要做什麼，不用自己往下滑找
function focusNewSlotEditor() {
  const panel = document.querySelector('[data-scenario4-editing-panel]')
  // jsdom（測試環境）沒有實作 scrollIntoView，真實瀏覽器才有，呼叫前先確認存在
  if (typeof panel?.scrollIntoView === 'function') {
    panel.scrollIntoView({ block: 'nearest', behavior: 'smooth' })
  }
  const startButton = document.querySelector('[data-scenario4-start-time-button]')
  startButton?.focus()
}

function removeCandidateSlot(date) {
  candidateSlots.value = candidateSlots.value.filter((slot) => slot.date !== date)
  if (editingSlotDate.value === date) editingSlotDate.value = null
}

function shortDate(dateStr) {
  const [, month, day] = dateStr.split('/')
  return `${Number(month)}/${Number(day)}`
}

// 流團設定固定預設清單，由大到小排序（提前量最大排最前面）——五個選項永遠全部顯示、永遠可點選，
// 不再依「算出來是否還沒過去」隱藏選項；智慧預設演算法只影響「自動選中哪一個」，不影響「顯示哪些」
const DEADLINE_PRESETS = [
  { key: '1d', label: '1 天前', offsetMs: 24 * 3600000 },
  { key: '12h', label: '12 小時前', offsetMs: 12 * 3600000 },
  { key: '3h', label: '3 小時前', offsetMs: 3 * 3600000 },
  { key: '1h', label: '1 小時前', offsetMs: 1 * 3600000 },
  { key: '30m', label: '30 分鐘前', offsetMs: 30 * 60000 },
]

// 智慧預設演算法固定嘗試的偏移量順序（由大到小）；「12 小時前」「1 天前」這兩個較大的偏移量
// 只保留給使用者手動選擇，演算法不會自動選到，避免一般情況下預設就砍掉一整天的報名時間
const AUTO_DEGRADE_OFFSET_KEYS = ['3h', '1h', '30m']

// 安全緩衝門檻：智慧預設演算法降級判斷、兩行常駐文字的警示樣式、二次確認 modal 觸發，
// 三處共用同一個常數，避免各自硬編碼，之後要調整緩衝門檻只需要改這裡
const SAFETY_BUFFER_MS = 30 * 60000

// 流團設定：選中的預設 key（'1d' | '12h' | '3h' | '1h' | '30m'）；null 代表智慧演算法已經降級到
// 「無報名緩衝」（報名截止時間直接等於決策硬截止時間本身），是一個有意義的合法狀態，不是錯誤
const selectedDeadlinePresetKey = ref(null)
const showDeadlineEditor = ref(false)
const showUrgentConfirm = ref(false)
const showSuccessModal = ref(false)
const isSubmitting = ref(false)
const submitError = ref('')
const endTimeUserSet = ref(false)
const timeError = ref('')

const fieldClass = 'grid gap-2'
const fieldLabelClass =
  'text-sm font-semibold leading-none tracking-[0.01em] text-[var(--bujo-ink)]'
const inputClass =
  'min-h-[44px] max-sm:min-h-[38px] w-full rounded-none border border-[var(--bujo-line)] bg-white px-4 py-2 text-sm leading-[1.2] text-[var(--bujo-ink)] outline-none transition-[border-color,box-shadow] duration-150 placeholder:text-[var(--bujo-muted)] focus:border-[var(--bujo-accent)] focus:shadow-[inset_0_0_0_1px_var(--bujo-accent)]'
const pickerButtonClass =
  'min-h-[38px] max-sm:min-h-[34px] whitespace-nowrap rounded-none border border-[var(--bujo-line)] bg-white px-3 py-1.5 text-left text-sm leading-none text-[var(--bujo-ink)] outline-none transition-[border-color,box-shadow] hover:border-[var(--bujo-accent)] focus:border-[var(--bujo-accent)] focus:shadow-[inset_0_0_0_1px_var(--bujo-accent)]'
const pickerPanelClass =
  'absolute top-[calc(100%+6px)] z-50 border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] p-3 shadow-[7px_8px_0_rgb(var(--bujo-ink-rgb)/0.06)] max-sm:static max-sm:mt-1'

const activePicker = ref('')
const schedulePickerRef = ref(null)
const selectedDate = ref(parseDateValue(form.startDate))
const visibleMonth = ref(startOfMonth(selectedDate.value ?? new Date()))

const weekdays = ['日', '一', '二', '三', '四', '五', '六']
const timeOptions = createTimeOptions()

// 同一天內比較：結束時間是否晚於開始時間（時段選項只到整點，比小時即可）
function isEndAfterStart(startTime, endTime) {
  return parseHourFromTimeStr(endTime) > parseHourFromTimeStr(startTime)
}

// 四情境共用：目標日期是今天時，排除已經過去的小時，否則回傳完整清單。
// 「是不是今天」怎麼算交給呼叫端決定（單一日期比較 vs 候選日期陣列成員判斷），
// 這裡不需要知道資料來源
function excludePastHoursIfToday(isTargetToday, options) {
  if (!isTargetToday) return options
  const currentHour = new Date().getHours()
  return options.filter((t) => parseHourFromTimeStr(t) > currentHour)
}

// 四情境共用：排除不晚於已選開始時間的小時
function excludeNotAfterStart(startTime, options) {
  if (!startTime) return options
  const startHour = parseHourFromTimeStr(startTime)
  return options.filter((t) => parseHourFromTimeStr(t) > startHour)
}

const startTimeOptions = computed(() =>
  excludePastHoursIfToday(form.startDate === formatDateValue(new Date()), timeOptions),
)

const endTimeOptions = computed(() => {
  if (form.endDate !== form.startDate) return timeOptions
  return excludeNotAfterStart(form.startTime, timeOptions)
})

const currentPickerTimeOptions = computed(() =>
  activePicker.value === 'endTime' ? endTimeOptions.value : startTimeOptions.value,
)

// 情境三：統一結束時間須晚於統一開始時間
const uniformEndTimeOptions = computed(() =>
  excludeNotAfterStart(uniformTime.startTime, timeOptions),
)

// 情境三：統一開始時間——今天的日期存在於候選日期時，排除已經過去的小時
const uniformStartTimeOptions = computed(() =>
  excludePastHoursIfToday(candidateDates.value.includes(formatDateValue(new Date())), timeOptions),
)

// 情境四：每個候選時段各自的結束時間須晚於該時段自己的開始時間
function slotEndTimeOptions(slot) {
  return excludeNotAfterStart(slot.startTime, timeOptions)
}

// 情境四：每個候選時段的開始時間——只看該時段自己的日期是不是今天，不受其他候選時段的日期影響
function slotStartTimeOptions(date) {
  return excludePastHoursIfToday(date === formatDateValue(new Date()), timeOptions)
}

// 情境二：時段範圍結束時間須晚於開始時間
const timeWindowEndTimeOptions = computed(() =>
  excludeNotAfterStart(timeWindow.startTime, timeOptions),
)

// 情境二：時段範圍開始時間——singleDate 是今天時，排除已經過去的小時
const timeWindowStartOptions = computed(() =>
  excludePastHoursIfToday(form.singleDate === formatDateValue(new Date()), timeOptions),
)

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
  const todayValue = formatDateValue(new Date())
  const minDate = activeDateField.value === 'endDate' ? form.startDate : todayValue
  return buildMonthGridCells(visibleMonth.value).map((cell) => ({
    ...cell,
    isSelected: selectedDate.value ? isSameDate(cell.date, selectedDate.value) : false,
    isDisabled: cell.key < minDate,
  }))
})

// 決策硬截止時間（deadline_at）的天花板錨點日期時間：情境二用「已確定的日期」+「時段範圍的
// 開始時間」，情境三用「最晚的候選日期」+「統一開始時間」，情境四用「最晚已設定完成的候選
// 日期時段」，情境一沿用原本的 form.startDate/startTime。情境三/四刻意選「最晚」而非「最早」
// ——這個天花板的工作是「建立者完全沒動作時的安全網」，選最晚候選日能讓投票有最大彈性等所有
// 候選日都出結果再收斂，不會因為最早候選日先到就被迫提早截止（避免其他候選日的報名被誤擋）
const scheduleAnchor = computed(() => {
  if (dateMode.value === 'fixed' && timeMode.value === 'vote') {
    return { date: form.singleDate, time: timeWindow.startTime ?? null }
  }
  if (dateMode.value === 'range' && timeMode.value === 'fixed') {
    const latestDate = candidateDates.value[candidateDates.value.length - 1] ?? null
    // 整日時沒有確切時間，後端把整日候選時段的 deadline_at 算成當天 00:00（slot_start）——
    // 這裡要餵同樣的 00:00 錨點，不能留 null 退回 resolveDeadlineAnchor 的 23:59:59 預設值，
    // 不然前端算出的報名截止時間預設會晚於後端實際天花板，送出時被誤擋
    return { date: latestDate, time: uniformTime.allDay ? '00:00' : uniformTime.startTime }
  }
  if (dateMode.value === 'range' && timeMode.value === 'vote') {
    const sorted = [...configuredSlots.value].sort((a, b) =>
      a.date === b.date
        ? parseHourFromTimeStr(a.startTime) - parseHourFromTimeStr(b.startTime)
        : a.date.localeCompare(b.date),
    )
    const latest = sorted[sorted.length - 1] ?? null
    return { date: latest?.date ?? null, time: latest?.startTime ?? null }
  }
  // 情境一整日同理：跟情境三整日一樣，餵 00:00 錨點對齊後端 buildFixedSlot 的 slot_start
  return { date: form.startDate, time: form.allDay ? '00:00' : form.startTime }
})

// 決策硬截止時間本身（天花板解析成實際 Date；沒有設定時間時退回當天 23:59:59，見 resolveDeadlineAnchor）
const scheduleCeilingDate = computed(() =>
  resolveDeadlineAnchor(scheduleAnchor.value.date, scheduleAnchor.value.time),
)

// 智慧預設演算法：固定先試「3 小時前」，算出的報名截止時間距今 <30 分鐘安全緩衝才依序降級
// 「1 小時前」→「30 分鐘前」，都不安全則回傳 null（無報名緩衝，報名截止時間＝天花板本身）。
// 不分「當天/非當天」兩套邏輯，只直接比較算出來的時間距今是否有足夠緩衝
function computeSmartDefaultPresetKey(ceiling) {
  if (!ceiling) return null
  const now = Date.now()
  for (const key of AUTO_DEGRADE_OFFSET_KEYS) {
    const preset = DEADLINE_PRESETS.find((p) => p.key === key)
    if (ceiling.getTime() - preset.offsetMs - now >= SAFETY_BUFFER_MS) return key
  }
  return null
}

// 天花板改變時重新跑一次智慧預設演算法；手動點選預設按鈕直接改 selectedDeadlinePresetKey，
// 不會被這裡蓋掉（watch 只在 scheduleCeilingDate 改變時觸發，不是每次重新渲染都跑）
function syncDeadlinePresetSelection() {
  selectedDeadlinePresetKey.value = computeSmartDefaultPresetKey(scheduleCeilingDate.value)
}

watch(scheduleCeilingDate, syncDeadlinePresetSelection, { immediate: true })

// 報名截止時間（vote_deadline_at）：選中的偏移量套用在天花板上；選中 null（無報名緩衝）時
// 直接等於天花板本身——這跟使用者手動選好一個偏移量、只是剛好貼近現在，是兩種不同的狀態
const voteDeadlineDate = computed(() => {
  if (!scheduleCeilingDate.value) return null
  const preset = DEADLINE_PRESETS.find((p) => p.key === selectedDeadlinePresetKey.value)
  if (!preset) return scheduleCeilingDate.value
  return new Date(scheduleCeilingDate.value.getTime() - preset.offsetMs)
})

function withinSafetyBuffer(date) {
  if (!date) return false
  return date.getTime() - Date.now() <= SAFETY_BUFFER_MS
}

// 第一行（報名截止時間）的警示判斷：本身貼近現在，或演算法已經降級到無報名緩衝——無報名緩衝
// 時報名截止時間雖然等於天花板，但天花板本身可能還有 30~59 分鐘、不會被距今檢查直接抓到，
// 所以額外用 selectedDeadlinePresetKey === null 撐住，跟設計文件「無報名緩衝一律警示」一致
const isReportCutoffWarning = computed(
  () => selectedDeadlinePresetKey.value === null || withinSafetyBuffer(voteDeadlineDate.value),
)

// 第二行（決策硬截止時間）的警示判斷，跟報名截止時間各自獨立
const isScheduleCeilingWarning = computed(() => withinSafetyBuffer(scheduleCeilingDate.value))

// 緊急狀態：報名截止時間或決策硬截止時間任一貼近現在就算，不再看活動本身（scheduleAnchor）
// 距今多久——活動距今很近時兩個算出來的時間通常會同步貼近現在，但活動距今稍遠時兩者會脫鉤
// （例如自動選中的偏移量剛好讓算出來的報名截止時間貼近現在），這種情況舊邏輯完全偵測不到
// eslint-disable-next-line no-unused-vars -- EventPage tests assert this setup state through wrapper.vm.
// 不在 template 內使用，僅供測試透過 wrapper.vm 讀取內部狀態
// eslint-disable-next-line no-unused-vars
const isUrgent = computed(() => isReportCutoffWarning.value || isScheduleCeilingWarning.value)

// 距天花板還有幾分鐘（二次確認 modal 用）
const minutesUntilCeiling = computed(() => {
  if (!scheduleCeilingDate.value) return 0
  return Math.max(1, Math.ceil((scheduleCeilingDate.value.getTime() - Date.now()) / 60000))
})

// 距報名截止時間還有幾分鐘（第一行警示文案用）——跟 minutesUntilCeiling 同樣邏輯，
// 只是基準換成 voteDeadlineDate（報名截止）而不是 scheduleCeilingDate（決策硬截止天花板）
const minutesUntilVoteDeadline = computed(() => {
  if (!voteDeadlineDate.value) return 0
  return Math.max(1, Math.ceil((voteDeadlineDate.value.getTime() - Date.now()) / 60000))
})

// 報名截止提醒不顯示年份——這個提醒的時間點必然在近期（截止時間不會晚於活動本身），
// 加年份對這個情境是多餘資訊，跟 formatDateValue（月曆、候選日期等其他地方共用）分開處理
function formatDateTimeDisplay(date) {
  const hour = String(date.getHours()).padStart(2, '0')
  const minute = String(date.getMinutes()).padStart(2, '0')
  return `${date.getMonth() + 1}/${date.getDate()} ${hour}:${minute}`
}

const reportCutoffTimeLabel = computed(() =>
  voteDeadlineDate.value ? formatDateTimeDisplay(voteDeadlineDate.value) : '',
)

// 第一行正常狀態下，偏移量文字拆成「數字」跟「單位」兩段——數字本身是可點擊觸發預設編輯器的
// 目標，單位延伸可點擊熱區，兩段合起來的文字跟現有 preset.label 完全一致
const reportCutoffOffsetParts = computed(() => {
  const preset = DEADLINE_PRESETS.find((p) => p.key === selectedDeadlinePresetKey.value)
  if (!preset) return { number: '', unit: '' }
  const match = preset.label.match(/^(\d+)\s*(.+)$/)
  return match ? { number: match[1], unit: match[2] } : { number: '', unit: preset.label }
})

watch(
  () => form.startTime,
  (val) => {
    if (val) timeError.value = ''
    if (val && form.endDate === form.startDate && form.endTime) {
      if (parseHourFromTimeStr(form.endTime) <= parseHourFromTimeStr(val)) {
        form.endTime = null
        endTimeUserSet.value = false
      }
    }
  },
)

// 統一開始時間變動時「結束時間不合理就清掉」的邏輯已經內建在 selectSlotTime() 裡，這裡不用重複判斷

// 情境二時間窗必填驗證：任一時間被設定後清掉行內錯誤，比照 form.startTime 的清除時機
watch(
  () => [timeWindow.startTime, timeWindow.endTime],
  ([start, end]) => {
    if (start && end) timeError.value = ''
  },
)

watch(
  () => form.startDate,
  (val) => {
    if (form.endDate < val) form.endDate = val
    const todayValue = formatDateValue(new Date())
    if (val === todayValue && form.startTime) {
      if (parseHourFromTimeStr(form.startTime) <= new Date().getHours()) {
        form.startTime = null
      }
    }
  },
)

watch(
  () => form.endDate,
  (val) => {
    if (val === form.startDate && form.endTime && form.startTime) {
      if (parseHourFromTimeStr(form.endTime) <= parseHourFromTimeStr(form.startTime)) {
        form.endTime = null
        endTimeUserSet.value = false
      }
    }
  },
)

watch(
  () => [form.startDate, form.startTime],
  () => {
    if (form.allDay || !form.startTime || endTimeUserSet.value) return
    const start = parseDateTimeValue(form.startDate, form.startTime)
    if (!start) return
    const newEnd = new Date(start.getTime() + 60 * 60 * 1000)
    form.endDate = formatDateValue(newEnd)
    form.endTime = formatHourAsTimeString(newEnd.getHours())
  },
)

function resetForm() {
  const todayStr = formatDateValue(new Date())
  form.name = ''
  form.type = null
  form.limit = null
  form.location = ''
  form.allDay = false
  form.startDate = todayStr
  form.startTime = null
  form.endDate = todayStr
  form.endTime = null
  form.singleDate = todayStr
  form.note = ''
  dateMode.value = 'fixed'
  timeMode.value = 'fixed'
  timeWindow.startTime = null
  timeWindow.endTime = null
  timeWindow.endTimeUserSet = false
  candidateDates.value = []
  uniformTime.startTime = null
  uniformTime.endTime = null
  uniformTime.allDay = false
  uniformTime.endTimeUserSet = false
  scenario4SlotIdSeq = 1
  candidateSlots.value = []
  editingSlotDate.value = null
  syncDeadlinePresetSelection()
  showDeadlineEditor.value = false
  endTimeUserSet.value = false
  submitError.value = ''
  timeError.value = ''
}

function closeForm() {
  closePicker()
  resetForm()
  if (isRouteComponent.value) {
    router.back()
  } else {
    emit('close')
  }
}

function dismissSuccessModal() {
  showSuccessModal.value = false
  closeForm()
}

async function submitForm() {
  closePicker()
  // 二次確認 modal 只在「連無報名緩衝的 fallback 都救不了」的極端情況才跳出（決策硬截止時間
  // 本身距今 ≤30 分鐘），不是看報名截止時間是否貼近現在——報名截止時間貼近現在時就算警示樣式，
  // 只要決策硬截止時間還夠遠，送出還是直接正常送出，不攔截
  if (isScheduleCeilingWarning.value) {
    showUrgentConfirm.value = true
    return
  }
  await doSubmit()
}

async function confirmUrgentSubmit() {
  showUrgentConfirm.value = false
  await doSubmit()
}

async function doSubmit() {
  if (isSubmitting.value) return
  isSubmitting.value = true
  try {
    await doSubmitInternal()
  } finally {
    isSubmitting.value = false
  }
}

// jsdom（測試環境）沒有實作 scrollIntoView，真實瀏覽器才有，呼叫前先確認存在，
// 三處行內驗證錯誤（情境一開始時間、情境二時段範圍起訖）共用同一個安全呼叫方式
async function scrollToFieldIfPossible(elementId) {
  await nextTick()
  const el = document.getElementById(elementId)
  if (typeof el?.scrollIntoView === 'function') {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

async function doSubmitInternal() {
  submitError.value = ''
  const isScenario2 = dateMode.value === 'fixed' && timeMode.value === 'vote'
  const isScenario3 = dateMode.value === 'range' && timeMode.value === 'fixed'
  const isScenario4 = dateMode.value === 'range' && timeMode.value === 'vote'

  if (isScenario2) {
    // 時段範圍從選填改為必填（新截止時間模型下，情境二的決策硬截止天花板錨定在時間窗開始時間，
    // 留空就沒有明確依據可以算），比照情境一 timeError 的即時驗證模式：行內錯誤＋捲動到該欄位
    if (!timeWindow.startTime) {
      timeError.value = '請選擇時段範圍的開始時間'
      await scrollToFieldIfPossible('event-time-window-start')
      return
    }
    if (!timeWindow.endTime) {
      timeError.value = '請選擇時段範圍的結束時間'
      await scrollToFieldIfPossible('event-time-window-end')
      return
    }
    if (!isEndAfterStart(timeWindow.startTime, timeWindow.endTime)) {
      submitError.value = '時段範圍的結束時間要晚於開始時間'
      return
    }
  } else if (isScenario3) {
    if (candidateDates.value.length === 0) {
      submitError.value = '請至少選擇一個候選日期'
      return
    }
    if (!uniformTime.allDay && (!uniformTime.startTime || !uniformTime.endTime)) {
      submitError.value = '請設定統一時間'
      return
    }
    if (!uniformTime.allDay && !isEndAfterStart(uniformTime.startTime, uniformTime.endTime)) {
      submitError.value = '統一結束時間要晚於開始時間'
      return
    }
  } else if (isScenario4) {
    if (configuredSlots.value.length === 0) {
      submitError.value = '請至少為一個候選日期設定完整的候選時段'
      return
    }
    if (configuredSlots.value.some((s) => !isEndAfterStart(s.startTime, s.endTime))) {
      submitError.value = '每個候選時段的結束時間都要晚於開始時間'
      return
    }
  } else if (!form.allDay && !form.startTime) {
    timeError.value = '請選擇開始時間'
    await scrollToFieldIfPossible('event-start-time')
    return
  } else if (
    !form.allDay &&
    form.endDate === form.startDate &&
    form.endTime &&
    !isEndAfterStart(form.startTime, form.endTime)
  ) {
    submitError.value = '結束時間要晚於開始時間'
    return
  }
  timeError.value = ''
  const limitValue = !form.limit || isNaN(form.limit) ? null : form.limit
  const deadlineISO = voteDeadlineDate.value ? voteDeadlineDate.value.toISOString() : null

  // 最後一道防線：即使流團設定改用預設選項（選的當下一定還在未來），送出前還是要重新驗證一次，
  // 避免選好之後過了一段時間才送出，計算出的流團時間其實已經不晚於現在
  if (!deadlineISO || new Date(deadlineISO) <= new Date()) {
    submitError.value = '流團時間已經不在未來，請重新調整流團設定或活動時間'
    return
  }

  const commonPayload = {
    title: form.name,
    location: form.location || null,
    limit: limitValue,
    note: form.note || null,
    type: form.type,
    deadline: deadlineISO,
  }

  let payload
  if (isScenario2) {
    payload = {
      ...commonPayload,
      singleDate: form.singleDate,
      ...(timeWindow.startTime && timeWindow.endTime
        ? { timeWindowStart: timeWindow.startTime, timeWindowEnd: timeWindow.endTime }
        : {}),
    }
  } else if (isScenario3) {
    payload = {
      ...commonPayload,
      candidateDates: candidateDates.value,
      uniformTime: uniformTime.allDay
        ? { allDay: true }
        : { startTime: uniformTime.startTime, endTime: uniformTime.endTime },
      // 建立者預設對所有自己選的候選日期都算「方便」
      creatorSlotIndexes: candidateDates.value.map((_, i) => i),
    }
  } else if (isScenario4) {
    payload = {
      ...commonPayload,
      dateSlots: configuredSlots.value.map((s) => ({
        date: s.date,
        startTime: s.startTime,
        endTime: s.endTime,
      })),
      // 建立者預設對所有自己設定完成的候選時段都算「方便」
      creatorSlotIndexes: configuredSlots.value.map((_, i) => i),
    }
  } else {
    payload = {
      ...commonPayload,
      startDate: form.startDate,
      startTime: form.startTime,
      endDate: form.endDate,
      endTime: form.endTime,
      allDay: form.allDay,
    }
  }

  try {
    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/activities`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      const data = await res.json().catch(() => ({}))
      submitError.value = data.message || '建立活動失敗，請稍後再試'
      return
    }
    const data = await res.json()
    emit('submit', data.activity)
    showSuccessModal.value = true
  } catch {
    submitError.value = '無法連線到伺服器，請確認後再試'
  }
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
  openSlotPicker.value = null
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
  const dateValue = formatDateValue(pickedDate)
  const todayValue = formatDateValue(new Date())
  const minDate = activeDateField.value === 'endDate' ? form.startDate : todayValue
  if (dateValue < minDate) return

  selectedDate.value = pickedDate
  form[activeDateField.value] = dateValue
  closePicker()
}

function selectTime(time) {
  if (activeTimeField.value === 'endTime') {
    endTimeUserSet.value = true
  }
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
  if (!value) return null
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

// 沒有指定時間的日期（情境二沒填時段範圍、allDay 等）視為「整天都有可能發生」，
// 用當天最晚的時間點（23:59:59）當計算基準，而不是當天 00:00——
// 用 00:00 的話同一天的活動一定會被算成「已經過期」，當天的活動反而永遠不能設定流團時間
function resolveDeadlineAnchor(dateStr, timeStr) {
  const withTime = parseDateTimeValue(dateStr, timeStr)
  if (withTime) return withTime
  const dateOnly = parseDateValue(dateStr)
  if (!dateOnly) return null
  dateOnly.setHours(23, 59, 59, 999)
  return dateOnly
}

function isSameDate(firstDate, secondDate) {
  return (
    firstDate.getFullYear() === secondDate.getFullYear() &&
    firstDate.getMonth() === secondDate.getMonth() &&
    firstDate.getDate() === secondDate.getDate()
  )
}

// 三個情境的月曆共用的 42 格網格數學（算第一天、往前補到週日、產生 42 格）。
// 每格的情境專屬欄位（isSelected/isCandidate/isEditing/isConfigured/isDisabled）
// 由呼叫端疊加，這裡不需要知道是哪個情境——key 本身就是每格的日期字串，可以直接當
// 比較用的日期值，不用另外多存一個 dateValue 欄位
function buildMonthGridCells(month) {
  const firstDay = startOfMonth(month)
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
      isCurrentMonth: date.getMonth() === month.getMonth(),
      isToday: isSameDate(date, new Date()),
    }
  })
}

function dateButtonClass(cell) {
  const base = 'h-8 max-sm:h-7 border text-xs leading-none'
  if (cell.isDisabled) {
    return [
      base,
      'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-muted)] cursor-not-allowed opacity-40',
    ]
  }
  return [
    base,
    'transition-colors',
    cell.isSelected
      ? 'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
      : 'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]',
    !cell.isCurrentMonth && 'text-[var(--bujo-muted)]',
    cell.isToday &&
      !cell.isSelected &&
      'border-[var(--bujo-line)] bg-[var(--bujo-today)] shadow-[inset_0_0_0_1px_var(--bujo-accent)]',
  ]
}

// 情境三候選日期跟情境一/二的單一固定日期語意不同——A/B 選的是「這就是最終日期」，黑底代表已經
// 定案；情境三選的是「這是候選日期之一，還在投票階段」，跟情境四「已設定完成」的黃底語意更接近，
// 所以另外複製一份 dateButtonClass，不直接改共用的 dateButtonClass（會連帶影響 A/B 的單一日期選取）
function candidateDateButtonClass(cell) {
  const base = 'h-8 max-sm:h-7 border text-xs leading-none'
  if (cell.isDisabled) {
    return [
      base,
      'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-muted)] cursor-not-allowed opacity-40',
    ]
  }
  return [
    base,
    'transition-colors',
    cell.isSelected
      ? 'border-[var(--bujo-line)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]'
      : 'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]',
    !cell.isCurrentMonth && 'text-[var(--bujo-muted)]',
    cell.isToday &&
      !cell.isSelected &&
      'border-[var(--bujo-line)] bg-[var(--bujo-today)] shadow-[inset_0_0_0_1px_var(--bujo-accent)]',
  ]
}

function timeButtonClass(time, field) {
  return {
    'border-[var(--bujo-ink)] bg-[var(--bujo-day-selected)] text-[var(--bujo-ink)]':
      form[field] === time,
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
.gui-switch {
  display: inline-flex;
  cursor: pointer;
  user-select: none;
  -webkit-tap-highlight-color: transparent;
}

.gui-switch__input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.gui-switch__track {
  position: relative;
  display: inline-flex;
  width: 54px;
  height: 30px;
  align-items: center;
  border-radius: 9999px;
  background: #edf1ed;
  transition:
    background-color 150ms ease,
    transform 150ms ease,
    box-shadow 150ms ease;
}

.gui-switch__thumb {
  position: absolute;
  left: 3px;
  width: 24px;
  height: 24px;
  border-radius: 9999px;
  background: #fff;
  box-shadow:
    0 1px 3px rgb(var(--bujo-ink-rgb) / 0.14),
    0 0 0 1px rgb(var(--bujo-white-rgb) / 0.72);
  transition:
    transform 150ms ease,
    width 150ms ease,
    box-shadow 150ms ease;
}

.gui-switch:hover .gui-switch__track {
  box-shadow: 0 0 0 3px rgb(var(--bujo-ink-rgb) / 0.04);
}

.gui-switch__input:checked + .gui-switch__track {
  background: #a8d0d1;
}

.gui-switch__input:checked + .gui-switch__track .gui-switch__thumb {
  transform: translateX(24px);
}

.gui-switch:active .gui-switch__thumb {
  width: 27px;
}

.gui-switch__input:focus-visible + .gui-switch__track {
  box-shadow: 0 0 0 3px #d7f0dc;
}
</style>
