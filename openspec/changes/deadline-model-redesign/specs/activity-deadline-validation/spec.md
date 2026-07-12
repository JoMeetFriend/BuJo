## REMOVED Requirements

### Requirement: Same-day schedule correction applies immediately on mount

**Reason**: This requirement described unit-correction behavior (switching the deadline unit to hours when the schedule anchor is already today) for a preset-visibility model where invalid presets were hidden from the list. That visibility-filtering model is replaced by the new smart-default algorithm and always-visible preset list (see MODIFIED requirements below), so there is no longer a "unit" to correct on mount — all five presets remain visible and selectable at all times, and the default selection is computed by the new target-and-degrade algorithm instead of by filtering a preset list.
**Migration**: No user-facing migration needed. The mount-time correctness concern this requirement guarded against (a stale or incorrect preset list right after opening the form) no longer applies because the preset list is no longer filtered by validity.

## MODIFIED Requirements

### Requirement: Deadline offset is selected from a fixed preset list

The create-activity form SHALL offer the deadline offset as a fixed list of presets (`1 天前`, `12 小時前`, `3 小時前`, `1 小時前`, `30 分鐘前`), and SHALL always render all five presets as selectable regardless of whether the resulting report-cutoff time (schedule ceiling minus the preset's offset) is before or after the current time. The form SHALL NOT provide a custom numeric input. Selecting a preset whose resulting report-cutoff time is within 30 minutes of the current time SHALL apply a warning visual style to the report-cutoff display, but SHALL NOT prevent the selection.

#### Scenario: All five presets are always shown regardless of lead time

- **WHEN** the create-activity form's deadline preset editor is opened, for any schedule ceiling lead time
- **THEN** all five presets (`1 天前`, `12 小時前`, `3 小時前`, `1 小時前`, `30 分鐘前`) SHALL be shown as selectable, none hidden

#### Scenario: Manually selecting a preset that yields a near-term report cutoff shows a warning, not a block

- **WHEN** the user manually selects a preset whose resulting report-cutoff time is within 30 minutes of the current time
- **THEN** the report-cutoff display SHALL switch to its warning visual style
- **AND** the selection SHALL be accepted without being reverted or blocked

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

When no preset has been explicitly chosen by the user, the create-activity form SHALL compute the default report-cutoff time using a fixed-target-with-degradation algorithm anchored on the schedule ceiling (the scenario's decision deadline, computed per scenario as described in the deadline model): try `3 小時前` first; if the resulting report-cutoff time is at least 30 minutes ahead of the current time, use it; otherwise try `1 小時前` under the same 30-minute test; otherwise try `30 分鐘前` under the same test; if none of the three provide at least 30 minutes of lead time, the report-cutoff time SHALL equal the schedule ceiling itself (no report buffer). The algorithm SHALL NOT automatically select `12 小時前` or `1 天前` — those two presets remain available only for explicit manual selection. The algorithm SHALL NOT branch on whether the schedule ceiling falls on the same calendar day as the current time; it SHALL only compare actual elapsed time.

#### Scenario: Default selection when 3 hours before the ceiling is safe

- **WHEN** the schedule ceiling is far enough in the future that `3 小時前` yields a report-cutoff time at least 30 minutes ahead of now, and no preset has been explicitly chosen
- **THEN** the form SHALL default the selection to `3 小時前`

#### Scenario: Default selection degrades when 3 hours before the ceiling is unsafe

- **WHEN** `3 小時前` would yield a report-cutoff time less than 30 minutes ahead of now
- **THEN** the form SHALL try `1 小時前`, and if that is also unsafe, `30 分鐘前`, applying the same 30-minute test at each step

#### Scenario: Default selection falls back to no report buffer when every preset is unsafe

- **WHEN** even `30 分鐘前` yields a report-cutoff time less than 30 minutes ahead of now
- **THEN** the report-cutoff time SHALL equal the schedule ceiling itself, and the report-cutoff display SHALL show its warning visual style

##### Example: default selection by schedule ceiling lead time

| Lead time from now until schedule ceiling | Default report-cutoff selection |
| --- | --- |
| 10 天 | `3 小時前` (ceiling − 3h leaves 9 天+ lead, safe) |
| 5 小時 | `3 小時前` (ceiling − 3h leaves 2 小時 lead, safe) |
| 2 小時 | `1 小時前` (ceiling − 3h would be in the past; ceiling − 1h leaves 1 小時 lead, safe) |
| 45 分鐘 | no report buffer (ceiling − 1h would be in the past; ceiling − 30分 leaves only 15分 lead — still unsafe by the 30分 test, so falls through to no buffer, same as the 20分鐘 row) |
| 20 分鐘 | no report buffer (ceiling itself, since even 30 分鐘前 is already in the past) |

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

The create-activity form SHALL validate, immediately before submission, that the computed report-cutoff time (the value shown and adjustable in the first persistent line) is strictly after the current time, for all four scheduling scenarios. This validation SHALL remain in place regardless of whether the value came from the default algorithm or a manual preset selection, as a safeguard against elapsed time between selection and submission.

#### Scenario: Computed report-cutoff time is already in the past

- **WHEN** the user submits the form and the computed report-cutoff time resolves to a timestamp at or before the current time
- **THEN** the form SHALL show an inline error asking the user to adjust the deadline settings or schedule, and SHALL NOT submit the request

#### Scenario: Computed report-cutoff time cannot be resolved

- **WHEN** the user submits the form and the computed report-cutoff time resolves to `null` (e.g. missing anchor date or time)
- **THEN** the form SHALL show an inline error and SHALL NOT submit the request

#### Scenario: Computed report-cutoff time is a valid future time

- **WHEN** the user submits the form and the computed report-cutoff time is strictly after the current time
- **THEN** the form SHALL proceed to the schedule-ceiling proximity check described in "Confirmation gate for near-zero decision buffer" before submitting

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

## ADDED Requirements

### Requirement: Two persistent deadline lines replace the mutually-exclusive adjust-row/warning-banner

The create-activity form SHALL display two persistent lines below the schedule fields, both visible at all times regardless of urgency: a first line showing the report cutoff (`vote_deadline_at`, user-adjustable via the preset editor) and a second line showing the schedule ceiling (`deadline_at`, fixed, not user-adjustable). Each line SHALL independently switch to a warning visual style when its own displayed time is within 30 minutes of the current time. The form SHALL NOT hide either line based on urgency, and SHALL NOT use a separate warning banner component for this purpose.

#### Scenario: Both lines show normal styling when neither is near-term

- **WHEN** both the report cutoff and the schedule ceiling are more than 30 minutes ahead of the current time
- **THEN** both persistent lines SHALL render in their normal (non-warning) visual style

#### Scenario: Only the report-cutoff line shows warning styling

- **WHEN** the report cutoff is within 30 minutes of the current time but the schedule ceiling is not
- **THEN** the first line SHALL switch to its warning visual style and the second line SHALL remain in its normal style

#### Scenario: Only the schedule-ceiling line shows warning styling

- **WHEN** the schedule ceiling is within 30 minutes of the current time but the report cutoff is not (this can occur only when the user has manually widened the report-cutoff gap toward the ceiling)
- **THEN** the second line SHALL switch to its warning visual style and the first line SHALL remain in its normal style

#### Scenario: Report-cutoff line text

- **WHEN** the report cutoff is not within 30 minutes of the current time
- **THEN** the first line SHALL read "報名開放到 {報名截止時間}（{偏移量} 截止）"

#### Scenario: Report-cutoff line warning text

- **WHEN** the report cutoff is within 30 minutes of the current time
- **THEN** the first line SHALL read "報名開放到 {報名截止時間}——活動快開始了，已經沒有緩衝時間"

#### Scenario: Schedule-ceiling line text

- **WHEN** the schedule ceiling is not within 30 minutes of the current time
- **THEN** the second line SHALL read "最晚 {決策硬截止時間} 要手動確認成團，不然活動會自動取消"

#### Scenario: Schedule-ceiling line warning text

- **WHEN** the schedule ceiling is within 30 minutes of the current time
- **THEN** the second line SHALL read "只剩 {N} 分鐘了，記得手動確認成團，不然活動會被自動取消喔"

### Requirement: Report-cutoff line's preset adjustment is triggered by clicking the offset number inline

The offset label within the first persistent line (e.g. the "3" in "3 小時前") SHALL be the trigger for opening the preset editor, styled to indicate interactivity (e.g. underline or accent color), rather than a separate adjust button elsewhere in the row. The clickable hit area SHALL extend beyond the visual bounds of the number itself to include adjacent text, so the effective tap target meets a minimum of 44×44px.

#### Scenario: Clicking the offset number opens the preset editor

- **WHEN** the user clicks or taps the offset number/label within the first persistent line
- **THEN** the preset editor SHALL open, showing all five presets as described in "Deadline offset is selected from a fixed preset list"

#### Scenario: Tap target extends beyond the visual number

- **WHEN** the user taps within the padded area surrounding the offset number (not just the number's own glyph bounds)
- **THEN** the preset editor SHALL still open

### Requirement: Third line for near-term candidate date reminder in scenario C and D

For scenario C (`find_date`) and scenario D (`find_date_time`) only, the create-activity form SHALL render a third, informational-styled (not warning-styled) line below the two persistent deadline lines whenever any of the user's currently selected candidate dates is within 1 hour of the current time. Scenario A and scenario B SHALL NOT render this third line under any condition. This line SHALL use the same reminder copy for both scenario C and scenario D.

#### Scenario: Third line appears when a near-term candidate date is selected in scenario C

- **WHEN** the form is in scenario C and at least one selected candidate date is within 1 hour of the current time
- **THEN** the third line SHALL render with the near-term candidate reminder text

#### Scenario: Third line appears when a near-term candidate slot is configured in scenario D

- **WHEN** the form is in scenario D and at least one configured candidate slot's date is within 1 hour of the current time
- **THEN** the third line SHALL render with the same reminder text used for scenario C

#### Scenario: Third line does not appear for scenario A or B

- **WHEN** the form is in scenario A or scenario B, regardless of how near the schedule anchor is
- **THEN** the third line SHALL NOT render (scenario A and B only ever show the two persistent deadline lines)

#### Scenario: Third line does not appear when no candidate date is near-term

- **WHEN** the form is in scenario C or D and none of the selected candidate dates is within 1 hour of the current time
- **THEN** the third line SHALL NOT render

### Requirement: Confirmation gate for near-zero decision buffer

The create-activity form SHALL intercept submission with a confirmation modal only when the schedule ceiling (`deadline_at`) itself is within 30 minutes of the current time — i.e. when even the no-report-buffer fallback from the default algorithm cannot provide 30 minutes of lead time. This replaces the prior condition of intercepting whenever the schedule anchor was within 1 hour of the current time.

#### Scenario: Confirmation modal appears only at the extreme edge

- **WHEN** the user submits the form and the schedule ceiling is within 30 minutes of the current time
- **THEN** the form SHALL show a confirmation modal reading "活動即將開始，這次建立將不會有任何報名緩衝時間，送出後請立即到活動頁面手動確認成團" and SHALL only submit after the user confirms

#### Scenario: Submission proceeds without a confirmation modal outside the extreme edge

- **WHEN** the user submits the form and the schedule ceiling is more than 30 minutes ahead of the current time, even if the report-cutoff line is itself showing warning styling
- **THEN** the form SHALL submit directly without showing the confirmation modal

### Requirement: `isUrgent` reflects computed deadline proximity, not schedule-anchor proximity

The create-activity form's urgency signal SHALL be computed by checking whether the computed report-cutoff time or the computed schedule-ceiling time is within 30 minutes of the current time, and SHALL NOT be computed by checking whether the schedule anchor itself (the raw activity/candidate date and time before any offset is applied) is within any threshold of the current time.

#### Scenario: Urgency is detected from a near-term computed deadline even when the schedule anchor is not near-term

- **WHEN** the schedule anchor is more than 1 hour away from the current time, but the default-algorithm-selected report-cutoff time resolves to within 30 minutes of the current time
- **THEN** the form SHALL treat this as an urgent state and apply the corresponding warning styling described in "Two persistent deadline lines replace the mutually-exclusive adjust-row/warning-banner"

#### Scenario: No urgency when both computed deadlines have sufficient lead time

- **WHEN** both the computed report-cutoff time and the computed schedule-ceiling time are more than 30 minutes ahead of the current time
- **THEN** the form SHALL NOT treat the current state as urgent, regardless of how close the raw schedule anchor is to the current time
