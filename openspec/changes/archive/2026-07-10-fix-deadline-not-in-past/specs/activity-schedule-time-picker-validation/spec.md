## ADDED Requirements

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

### Requirement: End-time-after-start-time behavior is unchanged

This change SHALL NOT modify the existing end-time filtering behavior for any scenario — end-time dropdowns SHALL continue to only list hours strictly after the corresponding start time, exactly as currently implemented.

#### Scenario: Existing end-after-start filtering continues to work

- **WHEN** a start time is already selected in any scenario's time picker
- **THEN** the corresponding end-time dropdown SHALL continue to only list hours strictly after that start time, with no change in behavior from before this change

### Requirement: AvailabilityPickerModal end-time options exclude hours not after the range's start time

For each availability range being edited in `AvailabilityPickerModal`, the end-time (`to`) dropdown SHALL only list hours strictly after that specific range's currently selected start (`from`) time, in addition to any `timeWindowStart`/`timeWindowEnd` constraint already applied.

#### Scenario: End-time dropdown excludes hours at or before the selected start time

- **WHEN** a range's start time is set to a given hour
- **THEN** that range's end-time dropdown SHALL NOT list that hour or any earlier hour

#### Scenario: Each range's end-time filtering is independent

- **WHEN** a participant is editing multiple ranges for the same date, each with a different start time
- **THEN** each range's end-time dropdown SHALL be filtered relative to its own start time, not any other range's

### Requirement: AvailabilityPickerModal start-time options exclude hours already past for today

For the date currently being edited in `AvailabilityPickerModal` (`activeDate`, which equals `fixedDate` in fixed-date mode), the start-time (`from`) dropdown SHALL exclude hours that have already passed relative to the current time whenever that date is today.

#### Scenario: Start-time dropdown excludes past hours when editing today

- **WHEN** the date currently being edited equals today
- **THEN** the start-time dropdown SHALL only list hours strictly after the current hour

#### Scenario: Start-time dropdown is unaffected for a future date

- **WHEN** the date currently being edited is after today
- **THEN** the start-time dropdown SHALL list all hours allowed by any `timeWindowStart`/`timeWindowEnd` constraint, unaffected by the current time
