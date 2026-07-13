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