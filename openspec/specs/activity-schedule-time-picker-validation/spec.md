# activity-schedule-time-picker-validation Specification

## Purpose

TBD - created by archiving change 'fix-deadline-not-in-past'. Update Purpose after archive.

## Requirements

### Requirement: Start-time pickers exclude hours already past for the relevant date

For scenario B (fixed date, time window start), scenario C (voted candidate dates, uniform start time), and scenario D (voted candidate dates, per-slot start time), the start-time selection dropdown SHALL exclude hours that have already passed relative to the current time whenever the relevant date for that picker is today. This matches the existing behavior already implemented for scenario A's start-time picker (`startTimeOptions`).

#### Scenario: Scenario B time window start excludes past hours when the date is today

- **WHEN** the create-activity form is in scenario B (`dateMode: 'fixed'`, `timeMode: 'vote'`) and `singleDate` equals today
- **THEN** the time window start-time dropdown SHALL only list hours strictly after the current hour

#### Scenario: Scenario B time window start shows the full list for a future date

- **WHEN** `singleDate` is a date after today
- **THEN** the time window start-time dropdown SHALL list all hours, unaffected by the current time

#### Scenario: Scenario C uniform start time excludes past hours when today is among the selected candidate dates

- **WHEN** the create-activity form is in scenario C (`dateMode: 'range'`, `timeMode: 'fixed'`) and today's date is included in `candidateDates`
- **THEN** the uniform start-time dropdown SHALL only list hours strictly after the current hour

#### Scenario: Scenario C uniform start time shows the full list when today is not selected

- **WHEN** none of the selected `candidateDates` is today
- **THEN** the uniform start-time dropdown SHALL list all hours

#### Scenario: Scenario D per-slot start time excludes past hours only for that slot's own date

- **WHEN** the create-activity form is in scenario D (`dateMode: 'range'`, `timeMode: 'vote'`) and the candidate slot currently being edited belongs to today's date
- **THEN** that slot's start-time dropdown SHALL only list hours strictly after the current hour, independent of whether other candidate slots' dates are today

#### Scenario: Scenario D per-slot start time for a future date is unaffected by other slots

- **WHEN** the candidate slot currently being edited belongs to a future date, even if another already-configured candidate slot belongs to today
- **THEN** that slot's start-time dropdown SHALL list all hours


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
### Requirement: End-time-after-start-time behavior is unchanged

This change SHALL NOT modify the existing end-time filtering behavior for any scenario — end-time dropdowns SHALL continue to only list hours strictly after the corresponding start time, exactly as currently implemented.

#### Scenario: Existing end-after-start filtering continues to work

- **WHEN** a start time is already selected in any scenario's time picker
- **THEN** the corresponding end-time dropdown SHALL continue to only list hours strictly after that start time, with no change in behavior from before this change


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
### Requirement: AvailabilityPickerModal end-time options exclude hours not after the range's start time

For each availability range being edited in `AvailabilityPickerModal`, the end-time (`to`) dropdown SHALL only list hours strictly after that specific range's currently selected start (`from`) time, in addition to any `timeWindowStart`/`timeWindowEnd` constraint already applied.

#### Scenario: End-time dropdown excludes hours at or before the selected start time

- **WHEN** a range's start time is set to a given hour
- **THEN** that range's end-time dropdown SHALL NOT list that hour or any earlier hour

#### Scenario: Each range's end-time filtering is independent

- **WHEN** a participant is editing multiple ranges for the same date, each with a different start time
- **THEN** each range's end-time dropdown SHALL be filtered relative to its own start time, not any other range's


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
### Requirement: AvailabilityPickerModal start-time options exclude hours already past for today

For the date currently being edited in `AvailabilityPickerModal` (`activeDate`, which equals `fixedDate` in fixed-date mode), the start-time (`from`) dropdown SHALL exclude hours that have already passed relative to the current time whenever that date is today.

#### Scenario: Start-time dropdown excludes past hours when editing today

- **WHEN** the date currently being edited equals today
- **THEN** the start-time dropdown SHALL only list hours strictly after the current hour

#### Scenario: Start-time dropdown is unaffected for a future date

- **WHEN** the date currently being edited is after today
- **THEN** the start-time dropdown SHALL list all hours allowed by any `timeWindowStart`/`timeWindowEnd` constraint, unaffected by the current time

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
### Requirement: AvailabilityPickerModal disables calendar date cells whose entire candidate window has already elapsed

In addition to the existing hour-level filtering within an already-active date's time picker, `AvailabilityPickerModal`'s calendar SHALL determine, per date cell, whether that date's entire candidate window has already fully elapsed relative to the current time, and SHALL disable the cell if so. The window boundary used for this check SHALL be, in priority order: that date's entry in `dateWindows[date].end` when present (scenario D per-date window); otherwise the later of the global `timeWindowStart`/`timeWindowEnd` props when either is present (scenario B/C); otherwise 23:59 of that date (when no window constraint applies at all).

A disabled date cell SHALL NOT respond to click/drag selection (no selection state change occurs), SHALL receive a reduced-opacity visual treatment, and SHALL additionally display a non-color indicator (e.g. a strikethrough on the date number or a small corner icon) rather than relying on opacity/color alone, because the calendar cell has no room for a text label.

#### Scenario: A fully-elapsed scenario D candidate date is disabled

- **WHEN** a date's `dateWindows[date].end` is before the current time
- **THEN** that date's calendar cell SHALL be disabled, non-interactive, and display the non-color expiration indicator

#### Scenario: A fully-elapsed scenario B/C candidate date is disabled

- **WHEN** a date has no per-date `dateWindows` entry, but the later of the global `timeWindowStart`/`timeWindowEnd` is before the current time for that date
- **THEN** that date's calendar cell SHALL be disabled, non-interactive, and display the non-color expiration indicator

#### Scenario: A date with no window constraint uses 23:59 as its elapsed boundary

- **WHEN** a date has neither a `dateWindows` entry nor a global time window constraint
- **THEN** that date's calendar cell SHALL be disabled only once 23:59 of that date has passed, not merely because the current hour is late

#### Scenario: A future date remains fully selectable

- **WHEN** a date's relevant window boundary (per the priority order above) is at or after the current time
- **THEN** that date's calendar cell SHALL remain selectable exactly as it does today, unaffected by this requirement

#### Scenario: Disabling is independent of color alone

- **WHEN** a date cell is disabled per this requirement
- **THEN** the visual treatment SHALL include a non-color indicator in addition to any opacity/color change, so the disabled state remains perceivable without relying on color differentiation

##### Example: window boundary resolution by scenario

| Scenario | `dateWindows[date]` present? | Global `timeWindowStart`/`timeWindowEnd` present? | Boundary used |
| --- | --- | --- | --- |
| D | yes | (ignored) | `dateWindows[date].end` |
| B/C | no | yes | later of `timeWindowStart`/`timeWindowEnd` |
| B/C (no window set) | no | no | 23:59 of that date |

<!-- @trace
source: deadline-model-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/components/UrgentStartWarning.vue
tests:
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->