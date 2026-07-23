## MODIFIED Requirements

### Requirement: Calendar grid disables dates before today

For every scenario's calendar (scenario A/B date picker, scenario C candidate-date picker, scenario D candidate-date picker), each of the 42 rendered grid cells SHALL be marked disabled when its date is strictly before today.

#### Scenario: Dates before today are disabled

- **WHEN** the calendar grid is rendered for any scenario
- **THEN** every cell whose date is strictly before today SHALL have `isDisabled: true`

## ADDED Requirements

### Requirement: Scenario A form fields consist of a single date and a start/end time range

The create-activity form's scenario A (fixed date, fixed time) SHALL render exactly one date field, labeled "日期", and a start/end time range field, labeled "時間", instead of the previous "開始"/"結束" rows that each paired an independently selectable date field with a time field.

#### Scenario: Scenario A shows exactly one date field

- **WHEN** the form's active scenario is A (fixed date, fixed time)
- **THEN** the form SHALL render exactly one date selection control
- **AND** the form SHALL NOT render a second, independently selectable end-date control

#### Scenario: Scenario A shows a start/end time range when not all-day

- **WHEN** the form's active scenario is A and the "整日" (all-day) toggle is off
- **THEN** the form SHALL render a "時間" field containing a start-time control and an end-time control side by side
- **AND** the end-time control SHALL only list hours strictly after the currently selected start time, using the same filtering rule already applied to scenario B's time-window end-time control

#### Scenario: Scenario A hides the time range when all-day is enabled

- **WHEN** the form's active scenario is A and the "整日" (all-day) toggle is on
- **THEN** the "時間" field SHALL NOT be rendered

### Requirement: Scenario A's end date always matches its single selected date

The create-activity form SHALL NOT allow scenario A's internal end-date value to diverge from its single selected date, in either all-day or non-all-day mode. The end-date value used when submitting the activity SHALL always equal the selected date.

#### Scenario: Submission always uses a single date for scenario A

- **WHEN** the user submits the create-activity form in scenario A
- **THEN** the submitted start-date and end-date values SHALL be equal

#### Scenario: All-day mode also keeps a single date

- **WHEN** the form's active scenario is A and the "整日" (all-day) toggle is on
- **THEN** the form SHALL still only expose one selectable date, and the submitted start-date and end-date values SHALL be equal
