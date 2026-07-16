# time-display-format Specification

## Purpose

TBD - created by archiving change 'time-picker-24-hour-format'. Update Purpose after archive.

## Requirements

### Requirement: Time picker options and displayed times use zero-padded 24-hour format

All time selection dropdowns (start time, end time, time window, uniform time, per-slot candidate times) and all displayed activity times SHALL render hours using zero-padded 24-hour format `HH:00` (e.g. `09:00`, `23:00`), covering the range `00:00` through `23:00`. The system SHALL NOT use `上午`/`下午` (AM/PM) prefixes anywhere in time selection or time display.

#### Scenario: Time option list covers all 24 hours in order

- **WHEN** a time selection dropdown is opened
- **THEN** it SHALL offer exactly 24 options, in ascending order, from `00:00` through `23:00`

##### Example: full option list

- **GIVEN** no filtering is applied (the target date is not today)
- **WHEN** the time dropdown renders its option list
- **THEN** the first option is `00:00` and the last option is `23:00`

#### Scenario: Displayed activity time uses 24-hour format

- **WHEN** an already-created activity's scheduled time is rendered (activity detail view, availability picker, activity card)
- **THEN** the hour SHALL be shown as zero-padded 24-hour format (e.g. `14:00`, not `下午 2:00`)


<!-- @trace
source: time-picker-24-hour-format
updated: 2026-07-16
code:
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
  - src/utils/timeFormat.js
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/timeFormat.test.js
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
-->

---
### Requirement: Frontend time formatting and parsing logic is centralized in a shared utility

The frontend SHALL expose time-string formatting and parsing through a single shared module (`src/utils/timeFormat.js`) consumed by every component that generates or parses these strings. No component SHALL maintain its own independent implementation of hour-to-string formatting or string-to-hour parsing.

#### Scenario: Formatting and parsing round-trip is consistent

- **WHEN** an hour number is formatted into a time string and then parsed back
- **THEN** the resulting hour number SHALL equal the original hour number, for every hour from 0 through 23

##### Example: round-trip for boundary hours

| Input hour | Formatted string | Parsed back |
| ---------- | ----------------- | ------------ |
| 0          | `00:00`            | 0            |
| 9          | `09:00`            | 9            |
| 23         | `23:00`            | 23           |


<!-- @trace
source: time-picker-24-hour-format
updated: 2026-07-16
code:
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
  - src/utils/timeFormat.js
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/timeFormat.test.js
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
-->

---
### Requirement: Existing scenario-specific time filtering behavior is unaffected by the format change

Scenario-specific time filtering rules (excluding already-past hours for today, excluding hours not after a chosen start time, locking the "today" candidate-date cell when the selected time is no longer valid) SHALL continue to operate correctly under the new format, because these rules compare parsed hour numbers, not raw strings.

#### Scenario: Past-hour filtering still works after the format change

- **GIVEN** the current time is `14:00` on the target date
- **WHEN** the time dropdown for that date is filtered for already-past hours
- **THEN** hours `00:00` through `14:00` SHALL be excluded and `15:00` through `23:00` SHALL remain, using the same comparison logic as before the format change

<!-- @trace
source: time-picker-24-hour-format
updated: 2026-07-16
code:
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
  - src/utils/timeFormat.js
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/timeFormat.test.js
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
-->