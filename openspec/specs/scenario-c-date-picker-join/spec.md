# scenario-c-date-picker-join Specification

## Purpose

TBD - created by archiving change 'scenario-c-date-picker-join'. Update Purpose after archive.

## Requirements

### Requirement: Scenario C activities are detected from schedule variant

The activity detail view SHALL detect scenario C activities from `schedule_variant: 'find_date'`.

#### Scenario: Loading a scenario C activity

- **WHEN** the client loads an activity detail response that includes `schedule_variant: 'find_date'`
- **THEN** the activity detail view SHALL treat the activity as scenario C

#### Scenario: Loading an activity without schedule variant

- **WHEN** the client loads an activity detail response that does not include `schedule_variant: 'find_date'`
- **THEN** the activity detail view SHALL NOT enable the scenario C date-only picker flow


<!-- @trace
source: scenario-c-date-picker-join
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/App.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/CalendarMain.vue
  - src/components/ProfileEditPage.vue
  - src/components/UrgentStartWarning.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario C join uses a date-only availability picker

The activity detail view SHALL open the availability picker in date-only mode when a participant joins a scenario C activity.

#### Scenario: Participant sees date-language join copy

- **WHEN** a non-creator participant opens a recruiting activity with `schedule_variant: 'find_date'` and has not joined it
- **THEN** the activity detail view SHALL ask the participant to select convenient dates
- **AND** the activity detail view SHALL NOT ask the participant to select convenient time slots

#### Scenario: Participant opens the scenario C join picker

- **WHEN** a non-creator participant clicks the join action for a recruiting activity with `schedule_variant: 'find_date'`
- **THEN** the system SHALL open `AvailabilityPickerModal` with date-only mode enabled
- **AND** the picker title SHALL use date-selection language instead of time-availability language
- **AND** the picker SHALL hide the time panel
- **AND** the picker SHALL allow only the activity's candidate dates to be selected
- **AND** non-candidate dates SHALL appear disabled and SHALL NOT be selectable

#### Scenario: Date-only picker shows fixed activity time

- **GIVEN** a scenario C activity whose candidate slots all use the same start and end time
- **WHEN** the participant opens the date-only picker
- **THEN** the picker SHALL show the fixed activity time above the calendar
- **AND** the picker SHALL NOT allow the participant to edit that time

#### Scenario: Date-only picker shows all-day activity time

- **GIVEN** a scenario C activity whose candidate slots are all-day slots
- **WHEN** the participant opens the date-only picker
- **THEN** the picker SHALL show that the activity time is all-day
- **AND** the picker SHALL NOT show a time editing panel

#### Scenario: Participant confirms selected dates

- **WHEN** the participant confirms one or more selected dates in the scenario C picker
- **THEN** the client SHALL convert the selected dates to the matching `candidateSlotIds`
- **AND** the client SHALL submit `{ candidateSlotIds: [...] }` to the join endpoint

#### Scenario: Participant sees selected date summary

- **WHEN** the participant selects candidate dates in the scenario C picker
- **THEN** the picker SHALL show each selected date as a compact date chip
- **AND** the confirmation area SHALL show the number of selected days

##### Example: selected dates map to candidate slots

- **GIVEN** candidate slots `slot-a` at `2026-08-01T19:00:00`, `slot-b` at `2026-08-03T19:00:00`, and `slot-c` at `2026-08-09T19:00:00`
- **WHEN** the participant selects `2026-08-01` and `2026-08-09`
- **THEN** the join request body SHALL be `{ candidateSlotIds: ['slot-a', 'slot-c'] }`

#### Scenario: Participant confirms without dates

- **WHEN** the participant confirms the scenario C picker without selecting any date
- **THEN** the picker SHALL remain open
- **AND** the system SHALL show an inline validation message requiring at least one day

##### Example: empty date selection stays in the modal

- **GIVEN** the date-only picker is open for allowed dates `2026-08-01`, `2026-08-03`, and `2026-08-09`
- **AND** the participant has selected zero dates
- **WHEN** the participant clicks the confirm action
- **THEN** the picker SHALL remain open
- **AND** the inline validation text SHALL communicate that at least one day is required


<!-- @trace
source: scenario-c-date-picker-join
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/App.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/CalendarMain.vue
  - src/components/ProfileEditPage.vue
  - src/components/UrgentStartWarning.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario C participants can start date revision during recruiting

The activity detail view SHALL allow an already joined participant to reopen the scenario C date-only picker while the activity status is `recruiting`.

#### Scenario: Joined participant revises selected dates

- **WHEN** a joined participant opens a scenario C activity whose status is `recruiting`
- **THEN** the activity detail view SHALL provide a date revision action
- **AND** confirming revised dates SHALL submit the selected dates as `{ candidateSlotIds: [...] }`

#### Scenario: Joined participant revises after recruiting

- **WHEN** a joined participant opens a scenario C activity whose status is `voting` or `confirmed`
- **THEN** the activity detail view SHALL NOT provide a date revision action


<!-- @trace
source: scenario-c-date-picker-join
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/App.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/CalendarMain.vue
  - src/components/ProfileEditPage.vue
  - src/components/UrgentStartWarning.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario C joined state shows selected dates

The activity detail view SHALL display a scenario C participant's selected dates in date language instead of time-slot language.

#### Scenario: Joined participant views recruiting scenario C activity

- **WHEN** a joined participant opens a recruiting scenario C activity
- **THEN** the activity detail view SHALL show a date summary of the dates the participant selected
- **AND** the primary action SHALL allow revising the selected dates

##### Example: joined participant sees selected dates and can revise

- **GIVEN** a joined participant selected candidate slots for `2026-08-01` and `2026-08-09`
- **AND** the scenario C activity status is `recruiting`
- **WHEN** the participant opens the activity detail view
- **THEN** the detail view SHALL show a date summary containing `8/1` and `8/9`
- **AND** the detail view SHALL provide a date revision action

#### Scenario: Joined participant views frozen scenario C activity

- **WHEN** a joined participant opens a scenario C activity whose status is `voting` or `confirmed`
- **THEN** the activity detail view SHALL show a date summary of the dates the participant selected
- **AND** the activity detail view SHALL NOT allow revising the selected dates

<!-- @trace
source: scenario-c-date-picker-join
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/App.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/CalendarMain.vue
  - src/components/ProfileEditPage.vue
  - src/components/UrgentStartWarning.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/EventPage.test.js
-->