# event-form-calendar-grid Specification

## Purpose

TBD - created by archiving change 'refactor-eventpage-shared-time-calendar-logic'. Update Purpose after archive.

## Requirements

### Requirement: Calendar grid disables dates before today

For every scenario's calendar (scenario A/B date picker, scenario C candidate-date picker, scenario D candidate-date picker), each of the 42 rendered grid cells SHALL be marked disabled when its date is strictly before today, except when the field being edited is scenario A's end date, in which case the floor SHALL be the already-selected start date instead of today.

#### Scenario: Dates before today are disabled

- **WHEN** the calendar grid is rendered for any scenario
- **THEN** every cell whose date is strictly before today SHALL have `isDisabled: true`

#### Scenario: Scenario A end-date field uses the selected start date as the floor instead of today

- **WHEN** the field currently being edited is scenario A's end date and a start date has already been selected
- **THEN** cells before the selected start date SHALL be disabled, even if that start date is in the future (today is not the floor in this case)


<!-- @trace
source: refactor-eventpage-shared-time-calendar-logic
updated: 2026-07-10
code:
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Calendar grid marks the current day

Every rendered grid cell SHALL indicate whether its date is today, independent of any scenario-specific selection state.

#### Scenario: Today's cell is flagged

- **WHEN** the calendar grid is rendered
- **THEN** the cell whose date equals today SHALL have `isToday: true`, and all other cells SHALL have `isToday: false`


<!-- @trace
source: refactor-eventpage-shared-time-calendar-logic
updated: 2026-07-10
code:
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario-specific selection state is layered onto the shared grid

Each scenario's calendar grid SHALL derive its own selection-related fields from that scenario's own state, in addition to the shared today/disabled/current-month fields:

- Scenario A/B (single date): each cell SHALL have `isSelected: true` when it matches the currently selected date, `false` otherwise.
- Scenario C (candidate dates): each cell SHALL have `isSelected: true` when its date is included in the candidate-dates list, `false` otherwise.
- Scenario D (candidate dates with per-date time slots): each cell SHALL have `isCandidate: true` when a candidate-slot entry exists for its date; `isConfigured: true` when that entry has at least one time slot with both a start and end time set; `isEditing: true` when its date is the date currently being edited.

#### Scenario: Scenario A/B single-date selection

- **WHEN** a date has been selected in scenario A or B
- **THEN** the grid cell matching that date SHALL have `isSelected: true`, and all other cells SHALL have `isSelected: false`

#### Scenario: Scenario C candidate-date selection

- **WHEN** a date is included in the candidate-dates list in scenario C
- **THEN** the corresponding grid cell SHALL have `isSelected: true`

#### Scenario: Scenario D candidate/configured/editing state

- **WHEN** a candidate-slot entry exists for a date, has at least one fully-set time slot, and is the date currently being edited
- **THEN** the corresponding grid cell SHALL have `isCandidate: true`, `isConfigured: true`, and `isEditing: true` simultaneously

<!-- @trace
source: refactor-eventpage-shared-time-calendar-logic
updated: 2026-07-10
code:
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario C and D do not auto-populate a default candidate date on entry

Switching the create-activity form's active scenario to scenario C (candidate dates with a uniform time) or scenario D (candidate dates each with their own time slots) SHALL NOT automatically add a candidate date or candidate slot when the candidate list is currently empty. The candidate list SHALL remain empty until the user explicitly selects a date through the calendar grid.

#### Scenario: Switching to scenario C with no candidate dates leaves the list empty

- **WHEN** the user switches the form to scenario C and no candidate dates have been selected yet
- **THEN** the candidate-dates list SHALL remain empty
- **AND** the form SHALL NOT insert any date into the candidate-dates list on the user's behalf

#### Scenario: Switching to scenario D with no candidate slots leaves the list empty

- **WHEN** the user switches the form to scenario D and no candidate slots have been configured yet
- **THEN** the candidate-slots list SHALL remain empty
- **AND** the form SHALL NOT insert any date or time slot into the candidate-slots list on the user's behalf

#### Scenario: Existing candidate selections are left untouched when re-entering a scenario

- **WHEN** the user switches away from scenario C or D and back again, and the candidate list already contains at least one entry
- **THEN** the existing candidate-dates or candidate-slots entries SHALL remain unchanged

<!-- @trace
source: remove-scenario-cd-default-candidate-date
updated: 2026-07-20
code:
  - src/composables/useAppTour.js
  - src/locales/en.json
  - src/components/CalendarMain.vue
  - src/components/AppTourHelpButton.vue
  - src/components/EventPage.vue
  - src/composables/useEventScenarioGuide.js
  - src/App.vue
  - src/components/ProfileAccountModal.vue
  - src/components/ReportCutoffReminder.vue
  - src/components/AppSidebar.vue
  - src/locales/zh-TW.json
tests:
  - src/__tests__/useAppTour.test.js
  - src/__tests__/AppTour.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useEventScenarioGuide.test.js
-->

---
### Requirement: Create-activity form omits secondary helper text

The create-activity form SHALL NOT display the activity-name character-limit hint, the per-scenario schedule-summary description, or the candidate-date section field labels for scenarios C and D.

#### Scenario: Activity name field has no character-limit hint

- **WHEN** the create-activity form is rendered
- **THEN** the activity-name field SHALL NOT show a "max N characters" hint text below it
- **AND** the activity-name input SHALL NOT reference a removed hint element via `aria-describedby`

#### Scenario: No schedule-summary description for scenarios B, C, or D

- **WHEN** the form's active scenario is B (fixed date, voted time), C (voted dates, fixed time), or D (voted dates, voted time)
- **THEN** the form SHALL NOT display a schedule-summary description text block for that scenario

#### Scenario: Candidate-date section has no field label in scenario C

- **WHEN** the form's active scenario is C (voted dates, fixed time)
- **THEN** the candidate-dates calendar section SHALL NOT display a field label above the month navigation controls
- **AND** the month navigation controls and candidate-date grid SHALL render unchanged

#### Scenario: Candidate-date section has no field label in scenario D

- **WHEN** the form's active scenario is D (voted dates, voted time)
- **THEN** the candidate-dates-and-slots calendar section SHALL NOT display a field label above the month navigation controls
- **AND** the month navigation controls and candidate-date grid SHALL render unchanged

<!-- @trace
source: simplify-event-form-helper-text
updated: 2026-07-20
code:
  - src/components/EventPage.vue
tests:
  - src/__tests__/EventPage.test.js
-->