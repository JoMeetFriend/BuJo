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
            <span :class="fieldLabelClass">人數上限</span>
            <span class="relative block">
              <input
                id="event-limit"
                :value="form.limit ?? ''"
                :class="[inputClass, 'pr-9']"
                type="number"
                inputmode="numeric"
                placeholder="不限"
                @input="
                  form.limit =
                    $event.target.value === '' || Number($event.target.value) <= 0
                      ? null
                      : Number($event.target.value)
                "
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

        <!-- Q1: 日期確定了嗎？ -->
        <div :class="[fieldClass, 'col-span-full']">
          <span :class="fieldLabelClass">日期確定了嗎？</span>
          <div class="grid grid-cols-2 gap-2 max-sm:gap-1.5">
            <button
              type="button"
              :class="scenarioButtonClass(dateMode === 'fixed')"
              @click="dateMode = 'fixed'"
            >
              已確定
            </button>
            <button
              type="button"
              :class="scenarioButtonClass(dateMode === 'range')"
              @click="dateMode = 'range'"
            >
              大概範圍
            </button>
          </div>
          <p class="text-xs leading-5 text-[var(--bujo-muted)]">
            {{
              dateMode === 'fixed'
                ? '日期已經定了，不用開放投票。'
                : '會列出這段期間內的候選日期，讓成員投票選出最終日期。'
            }}
          </p>
        </div>

        <!-- Q2: 時間確定了嗎？ -->
        <div :class="[fieldClass, 'col-span-full']">
          <span :class="fieldLabelClass">時間確定了嗎？</span>
          <div class="grid grid-cols-2 gap-2 max-sm:gap-1.5">
            <button
              type="button"
              :class="scenarioButtonClass(timeMode === 'fixed')"
              @click="timeMode = 'fixed'"
            >
              已確定
            </button>
            <button
              type="button"
              :class="scenarioButtonClass(timeMode === 'vote')"
              @click="timeMode = 'vote'"
            >
              讓大家選
            </button>
          </div>
          <p class="text-xs leading-5 text-[var(--bujo-muted)]">
            {{
              timeMode === 'fixed'
                ? '時間點固定，成員只需確認是否參加。'
                : '會列出候選時段，讓成員投票選出最終時間。'
            }}
          </p>
        </div>

        <!-- 情境說明 -->
        <div
          class="col-span-full border border-[var(--bujo-line-soft)] bg-[var(--bujo-surface-muted)] px-3 py-2 text-xs leading-5 text-[var(--bujo-ink)]"
        >
          {{ scenarioDescription }}
        </div>

        <div
          v-if="dateMode === 'fixed' && timeMode === 'fixed'"
          ref="schedulePickerRef"
          class="col-span-full grid gap-1.5 max-sm:gap-1 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
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

          <UrgentStartWarning v-if="isUrgent" :minutes="minutesUntilStart" />
        </div>

        <div
          v-else-if="dateMode === 'fixed' && timeMode === 'vote'"
          ref="schedulePickerRef"
          class="col-span-full grid gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
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
            <span :class="fieldLabelClass">時段範圍（選填，限制參與者可回報的時間）</span>

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
                          ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
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
                          ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
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

            <UrgentStartWarning v-if="isUrgent" :minutes="minutesUntilStart" />
          </div>
        </div>

        <div
          v-else-if="dateMode === 'range' && timeMode === 'fixed'"
          ref="schedulePickerRef"
          class="col-span-full grid gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
          @click="closePicker"
        >
          <div class="grid gap-2">
            <span :class="fieldLabelClass">選擇候選日期（可多選）</span>

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
                :class="dateButtonClass(cell)"
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
                  class="h-7 w-7 max-sm:h-6 max-sm:w-6 cursor-pointer appearance-none rounded-none border border-[var(--bujo-line)] bg-[var(--bujo-surface)] checked:border-[var(--bujo-ink)] checked:bg-[var(--bujo-ink)] focus:outline-none focus:shadow-[inset_0_0_0_1px_var(--bujo-accent)]"
                  type="checkbox"
                  aria-label="整日"
                  @change="closePicker"
                />
              </label>
            </div>

            <template v-if="!uniformTime.allDay">
              <span :class="fieldLabelClass">統一時間（套用到所有已選日期）</span>
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
                            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
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
                            ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
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

            <UrgentStartWarning v-if="isUrgent" :minutes="minutesUntilStart" />
          </div>
        </div>

        <div
          v-else
          ref="schedulePickerRef"
          class="col-span-full grid gap-3 border border-[var(--bujo-line)] bg-[var(--bujo-surface)] px-3 py-2 max-sm:py-1.5"
          @click="closePicker"
        >
          <div class="grid gap-2">
            <span :class="fieldLabelClass">選擇候選日期，再逐日設定時段</span>

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
              v-for="(slot, index) in editingSlot.timeSlots"
              :key="slot.id"
              class="grid grid-cols-[52px_1fr_12px_1fr_28px] max-sm:grid-cols-[40px_1fr_10px_1fr_24px] items-center gap-2"
            >
              <span :class="fieldLabelClass">時段{{ index + 1 }}</span>

              <span class="relative block">
                <button
                  :class="[pickerButtonClass, 'w-full']"
                  type="button"
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
                          ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
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
                          ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
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

              <button
                type="button"
                class="grid h-8 w-8 place-items-center text-[var(--bujo-muted-strong)] hover:text-[#dc2626]"
                aria-label="刪除候選時段"
                @click.stop="removeCandidateTimeSlot(editingSlot, slot.id)"
              >
                🗑
              </button>
            </div>

            <button
              type="button"
              class="w-fit border border-dashed border-[var(--bujo-line)] bg-transparent px-3 py-1.5 text-sm text-[var(--bujo-muted-strong)] transition-colors duration-150 hover:border-[var(--bujo-ink)] hover:text-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]"
              @click.stop="addCandidateTimeSlot(editingSlot)"
            >
              ＋ 新增候選時段
            </button>
          </div>

          <!-- 已選候選組合 -->
          <div class="grid gap-2 border-t border-dashed border-[var(--bujo-line-soft)] pt-2">
            <span :class="fieldLabelClass">已選候選組合</span>
            <p v-if="configuredSlots.length === 0" class="text-xs text-[var(--bujo-muted)]">尚無</p>
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

          <UrgentStartWarning v-if="isUrgent" :minutes="minutesUntilStart" />
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

          <!-- 流團設定附注（非緊急情況） -->
          <template v-if="!isUrgent">
            <div
              class="flex items-start gap-2 border-t border-dashed border-[var(--bujo-line-soft)] pt-2"
            >
              <span class="flex-1 text-xs leading-5 text-[var(--bujo-muted)]">
                <strong class="text-[var(--bujo-muted-strong)]">{{ deadlineDisplayText }}</strong
                >，人數若不足活動將自動取消
              </span>
              <button
                type="button"
                class="flex-shrink-0 bg-white border border-[var(--bujo-line-soft)] px-2 py-0.5 text-[10px] leading-5 text-[var(--bujo-muted)] transition-colors hover:border-[var(--bujo-ink)] hover:text-[var(--bujo-ink)]"
                @click="toggleDeadlineEditor"
              >
                調整
              </button>
            </div>

            <!-- 流團編輯器 -->
            <div
              v-if="showDeadlineEditor"
              class="flex flex-wrap items-center gap-2 border border-dashed border-[var(--bujo-line)] bg-[var(--bujo-surface-muted)] px-3 py-2"
            >
              <button
                v-for="preset in deadlineValidPresets"
                :key="preset.key"
                type="button"
                class="h-8 rounded-none border px-2 text-xs transition-colors"
                :class="
                  selectedDeadlinePresetKey === preset.key
                    ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
                    : 'border-[var(--bujo-line)] bg-white text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)]'
                "
                @click="selectedDeadlinePresetKey = preset.key"
              >
                {{ preset.label }}
              </button>
              <span v-if="deadlineValidPresets.length === 0" class="text-xs text-[var(--bujo-muted)]"
                >目前沒有可選的流團時間</span
              >
            </div>
          </template>
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
          這個活動將在 <strong>{{ minutesUntilStart }}</strong> 分鐘後開始<br />
          建立後請記得到活動頁面<br />
          <strong>手動確認成團</strong>，才會通知參與者
        </p>
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
import UrgentStartWarning from './UrgentStartWarning.vue'
import partyDanceUrl from '@/assets/party-dance.png'

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

// 情境一（日期X時間皆已確定）：開始日期是今天時，只能約當天某個時段，不能整日，
// 所以把「整日」選項藏起來，並清掉可能殘留的勾選
const isStartDateToday = computed(() => form.startDate === today)
watch(isStartDateToday, (isToday) => {
  if (isToday) form.allDay = false
})

// 日期／時間確定情境
const dateMode = ref('fixed') // 'fixed' | 'range'
const timeMode = ref('fixed') // 'fixed' | 'vote'

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
    return '這是一個已確定日期與時間的活動——不需要投票，成員只要回覆「參加/不參加」。'
  }
  if (dateMode.value === 'fixed' && timeMode.value === 'vote') {
    return '日期已經固定，但時間開放投票——會針對這一天，列出幾個候選時段讓成員選。'
  }
  if (dateMode.value === 'range' && timeMode.value === 'fixed') {
    return '日期開放投票，但每個候選日的時間點都固定不變——成員只需選出哪一天適合。'
  }
  return '日期與時間都開放投票——成員需先選日期，再針對該日期選時段。'
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
const uniformTime = reactive({ startTime: null, endTime: null, allDay: false, endTimeUserSet: false })

const candidateDateCells = computed(() => {
  const todayValue = formatDateValue(new Date())
  const firstDay = startOfMonth(visibleMonth.value)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const dateValue = formatDateValue(date)

    return {
      key: dateValue,
      date,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isSelected: candidateDates.value.includes(dateValue),
      isToday: isSameDate(date, new Date()),
      isDisabled: dateValue < todayValue,
    }
  })
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
  const firstDay = startOfMonth(visibleMonth.value)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const dateValue = formatDateValue(date)
    const entry = candidateSlots.value.find((s) => s.date === dateValue)

    return {
      key: dateValue,
      date,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isCandidate: !!entry,
      isEditing: editingSlotDate.value === dateValue,
      isConfigured: !!entry?.timeSlots.some((slot) => slot.startTime && slot.endTime),
      isToday: isSameDate(date, new Date()),
      isDisabled: dateValue < todayValue,
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
  if (cell.isCandidate) {
    return [
      base,
      'border-[var(--bujo-line)] bg-[var(--bujo-card-yellow)] text-[var(--bujo-ink)] hover:border-[var(--bujo-accent)]',
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
    return
  }
  editingSlotDate.value = editingSlotDate.value === cell.key ? null : cell.key
}

function removeCandidateSlot(date) {
  candidateSlots.value = candidateSlots.value.filter((slot) => slot.date !== date)
  if (editingSlotDate.value === date) editingSlotDate.value = null
}

function addCandidateTimeSlot(entry) {
  entry.timeSlots.push({
    id: scenario4SlotIdSeq++,
    startTime: null,
    endTime: null,
    endTimeUserSet: false,
  })
}

function removeCandidateTimeSlot(entry, slotId) {
  entry.timeSlots = entry.timeSlots.filter((slot) => slot.id !== slotId)
}

function shortDate(dateStr) {
  const [, month, day] = dateStr.split('/')
  return `${Number(month)}/${Number(day)}`
}

// 流團設定固定預設清單，由大到小排序（提前量最大排最前面）
const DEADLINE_PRESETS = [
  { key: '1d', label: '1 天前', offsetMs: 24 * 3600000 },
  { key: '12h', label: '12 小時前', offsetMs: 12 * 3600000 },
  { key: '3h', label: '3 小時前', offsetMs: 3 * 3600000 },
  { key: '1h', label: '1 小時前', offsetMs: 1 * 3600000 },
  { key: '30m', label: '30 分鐘前', offsetMs: 30 * 60000 },
]

// 流團設定：選中的預設 key（'1d' | '12h' | '3h' | '1h' | '30m'），null 代表尚未選（或目前沒有有效選項）
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

function parseHourFromTimeStr(timeStr) {
  const match = timeStr?.match(/^(上午|下午)\s+(\d+):(\d+)$/)
  if (!match) return -1
  let hour = Number(match[2])
  if (match[1] === '下午' && hour !== 12) hour += 12
  if (match[1] === '上午' && hour === 12) hour = 0
  return hour
}

// 同一天內比較：結束時間是否晚於開始時間（時段選項只到整點，比小時即可）
function isEndAfterStart(startTime, endTime) {
  return parseHourFromTimeStr(endTime) > parseHourFromTimeStr(startTime)
}

const startTimeOptions = computed(() => {
  if (form.startDate !== formatDateValue(new Date())) return timeOptions
  const currentHour = new Date().getHours()
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > currentHour)
})

const endTimeOptions = computed(() => {
  if (form.endDate !== form.startDate || !form.startTime) return timeOptions
  const startHour = parseHourFromTimeStr(form.startTime)
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > startHour)
})

const currentPickerTimeOptions = computed(() =>
  activePicker.value === 'endTime' ? endTimeOptions.value : startTimeOptions.value,
)

// 情境三：統一結束時間須晚於統一開始時間
const uniformEndTimeOptions = computed(() => {
  if (!uniformTime.startTime) return timeOptions
  const startHour = parseHourFromTimeStr(uniformTime.startTime)
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > startHour)
})

// 情境三：統一開始時間——今天的日期存在於候選日期時，排除已經過去的小時
const uniformStartTimeOptions = computed(() => {
  const todayValue = formatDateValue(new Date())
  if (!candidateDates.value.includes(todayValue)) return timeOptions
  const currentHour = new Date().getHours()
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > currentHour)
})

// 情境四：每個候選時段各自的結束時間須晚於該時段自己的開始時間
function slotEndTimeOptions(slot) {
  if (!slot.startTime) return timeOptions
  const startHour = parseHourFromTimeStr(slot.startTime)
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > startHour)
}

// 情境四：每個候選時段的開始時間——只看該時段自己的日期是不是今天，不受其他候選時段的日期影響
function slotStartTimeOptions(date) {
  if (date !== formatDateValue(new Date())) return timeOptions
  const currentHour = new Date().getHours()
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > currentHour)
}

// 情境二：時段範圍結束時間須晚於開始時間
const timeWindowEndTimeOptions = computed(() => {
  if (!timeWindow.startTime) return timeOptions
  const startHour = parseHourFromTimeStr(timeWindow.startTime)
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > startHour)
})

// 情境二：時段範圍開始時間——singleDate 是今天時，排除已經過去的小時
const timeWindowStartOptions = computed(() => {
  if (form.singleDate !== formatDateValue(new Date())) return timeOptions
  const currentHour = new Date().getHours()
  return timeOptions.filter((t) => parseHourFromTimeStr(t) > currentHour)
})

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

  const firstDay = startOfMonth(visibleMonth.value)
  const startOffset = firstDay.getDay()
  const gridStart = new Date(firstDay)
  gridStart.setDate(firstDay.getDate() - startOffset)

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart)
    date.setDate(gridStart.getDate() + index)
    const dateValue = formatDateValue(date)

    return {
      key: dateValue,
      date,
      label: date.getDate(),
      isCurrentMonth: date.getMonth() === visibleMonth.value.getMonth(),
      isSelected: selectedDate.value ? isSameDate(date, selectedDate.value) : false,
      isToday: isSameDate(date, new Date()),
      isDisabled: dateValue < minDate,
    }
  })
})

// 流團時間／緊急判斷的錨點日期時間：情境二用「已確定的日期」+「時段範圍的開始時間」，
// 情境三用「最早的候選日期」+「統一開始時間」，情境四用「最早已設定完成的候選日期時段」，
// 情境一沿用原本的 form.startDate/startTime
const scheduleAnchor = computed(() => {
  if (dateMode.value === 'fixed' && timeMode.value === 'vote') {
    return { date: form.singleDate, time: timeWindow.startTime ?? null }
  }
  if (dateMode.value === 'range' && timeMode.value === 'fixed') {
    return { date: candidateDates.value[0] ?? null, time: uniformTime.startTime }
  }
  if (dateMode.value === 'range' && timeMode.value === 'vote') {
    const sorted = [...configuredSlots.value].sort((a, b) =>
      a.date === b.date
        ? parseHourFromTimeStr(a.startTime) - parseHourFromTimeStr(b.startTime)
        : a.date.localeCompare(b.date),
    )
    return { date: sorted[0]?.date ?? null, time: sorted[0]?.startTime ?? null }
  }
  return { date: form.startDate, time: form.startTime }
})

// 是否距今 ≤ 1 小時（緊急活動）
const isUrgent = computed(() => {
  if (form.allDay) return false
  const start = parseDateTimeValue(scheduleAnchor.value.date, scheduleAnchor.value.time)
  if (!start) return false
  const diffMs = start.getTime() - Date.now()
  return diffMs > 0 && diffMs <= 60 * 60 * 1000
})

// 距今幾分鐘（緊急顯示用）
const minutesUntilStart = computed(() => {
  const start = parseDateTimeValue(scheduleAnchor.value.date, scheduleAnchor.value.time)
  if (!start) return 0
  return Math.max(1, Math.ceil((start.getTime() - Date.now()) / 60000))
})

// 目前錨點日期時間下，仍然會落在未來的流團設定預設選項（由大到小排序）
const deadlineValidPresets = computed(() =>
  getValidDeadlinePresets(scheduleAnchor.value.date, scheduleAnchor.value.time),
)

const deadlineOffsetMs = computed(
  () => DEADLINE_PRESETS.find((p) => p.key === selectedDeadlinePresetKey.value)?.offsetMs ?? null,
)

// 目前選中的預設如果不再是有效清單裡的選項（或尚未選過），改選清單中最大（最早）的有效選項
// scheduleAnchor 改變時一律重新選最大的有效預設（deadlineValidPresets 只在 anchor 改變時才會重新計算，
// 手動點選預設按鈕本身不會影響 anchor，所以不會被這裡蓋掉）
function syncDeadlinePresetSelection() {
  selectedDeadlinePresetKey.value = deadlineValidPresets.value[0]?.key ?? null
}

watch(deadlineValidPresets, syncDeadlinePresetSelection, { immediate: true })

// 流團時間顯示文字
const deadlineDisplayText = computed(() => {
  const preset = DEADLINE_PRESETS.find((p) => p.key === selectedDeadlinePresetKey.value)
  if (!preset) return ''
  const anchor = resolveDeadlineAnchor(scheduleAnchor.value.date, scheduleAnchor.value.time)
  if (!anchor) return ''
  const d = new Date(anchor.getTime() - preset.offsetMs)
  const period = d.getHours() < 12 ? '上午' : '下午'
  const hour = d.getHours() % 12 || 12
  const minute = String(d.getMinutes()).padStart(2, '0')
  return `${formatDateValue(d)} ${period} ${hour}:${minute}（${preset.label}）`
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
    form.endTime = formatTimeValue(newEnd)
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
  selectedDeadlinePresetKey.value = null
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
  if (isUrgent.value) {
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

async function doSubmitInternal() {
  submitError.value = ''
  const isScenario2 = dateMode.value === 'fixed' && timeMode.value === 'vote'
  const isScenario3 = dateMode.value === 'range' && timeMode.value === 'fixed'
  const isScenario4 = dateMode.value === 'range' && timeMode.value === 'vote'

  if (isScenario2) {
    const hasStart = !!timeWindow.startTime
    const hasEnd = !!timeWindow.endTime
    if (hasStart !== hasEnd) {
      submitError.value = '時段範圍要嘛都填，要嘛都不填'
      return
    }
    if (hasStart && hasEnd && !isEndAfterStart(timeWindow.startTime, timeWindow.endTime)) {
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
    await nextTick()
    document
      .getElementById('event-start-time')
      ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
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
  const deadlineISO = isUrgent.value
    ? (parseDateTimeValue(scheduleAnchor.value.date, scheduleAnchor.value.time)?.toISOString() ??
      null)
    : computeDeadlineISO(scheduleAnchor.value.date, scheduleAnchor.value.time, deadlineOffsetMs.value)

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

function formatTimeValue(date) {
  const period = date.getHours() < 12 ? '上午' : '下午'
  const hour = date.getHours() % 12 || 12
  return `${period} ${hour}:00`
}

function parseDateTimeValue(dateStr, timeStr) {
  if (!timeStr) return null
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

// 只回傳套用在 anchorDate/anchorTime 上仍然晚於現在的預設
function getValidDeadlinePresets(anchorDate, anchorTime) {
  const anchor = resolveDeadlineAnchor(anchorDate, anchorTime)
  if (!anchor) return []
  const now = Date.now()
  return DEADLINE_PRESETS.filter((preset) => anchor.getTime() - preset.offsetMs > now)
}

function computeDeadlineISO(startDateStr, startTimeStr, offsetMs) {
  if (offsetMs == null) return null
  const start = resolveDeadlineAnchor(startDateStr, startTimeStr)
  if (!start) return null
  return new Date(start.getTime() - offsetMs).toISOString()
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
      ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
      : 'border-[var(--bujo-line-soft)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]',
    !cell.isCurrentMonth && 'text-[var(--bujo-muted)]',
    cell.isToday &&
      !cell.isSelected &&
      'border-[var(--bujo-line)] bg-[var(--bujo-today)] shadow-[inset_0_0_0_1px_var(--bujo-accent)]',
  ]
}

function timeButtonClass(time, field) {
  return {
    'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]': form[field] === time,
  }
}

function scenarioButtonClass(active) {
  return [
    'flex min-h-[44px] max-sm:min-h-[38px] items-center justify-center border px-4 py-2 text-sm leading-[1.2] transition-colors',
    active
      ? 'border-[var(--bujo-ink)] bg-[var(--bujo-ink)] text-[var(--bujo-white)]'
      : 'border-[var(--bujo-line)] bg-[var(--bujo-surface)] text-[var(--bujo-ink)] hover:border-[var(--bujo-ink)] hover:bg-[var(--bujo-surface-muted)]',
  ]
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
