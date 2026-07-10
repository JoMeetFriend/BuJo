# activity-deadline-validation Specification

## Purpose

TBD - created by archiving change 'fix-deadline-not-in-past'. Update Purpose after archive.

## Requirements

### Requirement: Same-day schedule correction applies immediately on mount

The create-activity form SHALL apply the day-to-hour deadline unit correction as soon as the relevant schedule date is already today, without requiring the user to change the date first.

#### Scenario: Form mounts with an already-today schedule anchor

- **WHEN** the create-activity form is opened and the current scenario's schedule anchor date equals today at the moment of mounting
- **THEN** the deadline unit SHALL be set to hours immediately, without waiting for the anchor date to change


<!-- @trace
source: fix-deadline-not-in-past
updated: 2026-07-10
code:
  - src/components/ActivityDetailModal.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Deadline offset is selected from a fixed preset list

The create-activity form SHALL replace the free-form number-plus-unit deadline input with a fixed list of offset presets (`1 天前`, `12 小時前`, `3 小時前`, `1 小時前`, `30 分鐘前`), and SHALL only render presets whose resulting deadline (schedule anchor time minus the preset's offset) is strictly after the current time. The form SHALL NOT provide a custom numeric input.

#### Scenario: All presets are valid for a far-future activity

- **WHEN** the schedule anchor is more than 1 day away from the current time
- **THEN** all five presets SHALL be shown as selectable

#### Scenario: Only shorter presets are valid for a near-term activity

- **WHEN** the schedule anchor is less than 12 hours but more than 3 hours away from the current time
- **THEN** only `3 小時前`, `1 小時前`, and `30 分鐘前` SHALL be shown as selectable; `1 天前` and `12 小時前` SHALL NOT be shown

##### Example: preset availability by lead time

| Lead time until schedule anchor | Presets shown |
| --- | --- |
| 2 天 | 1 天前, 12 小時前, 3 小時前, 1 小時前, 30 分鐘前 |
| 6 小時 | 3 小時前, 1 小時前, 30 分鐘前 |
| 45 分鐘 | 30 分鐘前 |
| 20 分鐘 | （無，落入既有的「距今 ≤ 1 小時」緊急流程，流團設定區塊隱藏） |


<!-- @trace
source: fix-deadline-not-in-past
updated: 2026-07-10
code:
  - src/components/ActivityDetailModal.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Default preset selection

The create-activity form SHALL default to the largest (earliest) valid preset from the currently shown list when the schedule anchor changes.

#### Scenario: Default selection on a far-future activity

- **WHEN** the schedule anchor is more than 1 day away and no preset has been explicitly chosen yet
- **THEN** the form SHALL default the selection to `1 天前`

#### Scenario: Default selection updates when the schedule anchor shortens the valid list

- **WHEN** the schedule anchor changes such that the previously selected preset is no longer in the valid list
- **THEN** the form SHALL re-select the largest remaining valid preset


<!-- @trace
source: fix-deadline-not-in-past
updated: 2026-07-10
code:
  - src/components/ActivityDetailModal.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Form blocks submission when the computed deadline is not in the future

The create-activity form SHALL validate, immediately before submission, that the computed deadline is strictly after the current time, for all four scheduling scenarios. This validation SHALL remain in place even with preset-based selection, as a safeguard against the elapsed time between selecting a preset and submitting the form.

#### Scenario: Computed deadline is already in the past

- **WHEN** the user submits the form and the computed deadline resolves to a timestamp at or before the current time
- **THEN** the form SHALL show an inline error asking the user to adjust the deadline settings or schedule, and SHALL NOT submit the request

#### Scenario: Computed deadline cannot be resolved

- **WHEN** the user submits the form and the computed deadline resolves to `null` (e.g. missing anchor date or time)
- **THEN** the form SHALL show an inline error and SHALL NOT submit the request

#### Scenario: Computed deadline is a valid future time

- **WHEN** the user submits the form and the computed deadline is strictly after the current time
- **THEN** the form SHALL submit the request as it does today

<!-- @trace
source: fix-deadline-not-in-past
updated: 2026-07-10
code:
  - src/components/ActivityDetailModal.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->