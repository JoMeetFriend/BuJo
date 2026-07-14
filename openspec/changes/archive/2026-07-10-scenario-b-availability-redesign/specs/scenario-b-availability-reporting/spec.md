## ADDED Requirements

### Requirement: Optional time window in scenario B creation form

The activity creation form SHALL allow the creator, when date is fixed and time is open ("讓大家選"), to optionally set a start and end time constraining when participants can report availability, without requiring a list of candidate time slots.

#### Scenario: Creator leaves the time window unset

- **WHEN** the creator submits the form without setting a start or end time for the time window
- **THEN** the system SHALL submit the activity without `timeWindowStart`/`timeWindowEnd`, and SHALL NOT submit any candidate slot list

#### Scenario: Creator sets a partial time window

- **WHEN** the creator sets only one of start/end time for the time window
- **THEN** the form SHALL show a validation error and SHALL NOT submit the form

#### Scenario: Creator sets an invalid time window

- **WHEN** the creator sets an end time that is not later than the start time
- **THEN** the form SHALL show a validation error and SHALL NOT submit the form

### Requirement: Fixed-date availability picker hides the calendar

The availability picker modal SHALL hide its calendar panel and show only the time-range selection panel when a `fixedDate` is provided, while preserving the calendar's multi-date selection behavior for callers that do not provide `fixedDate`.

#### Scenario: Opening the picker for a fixed-date activity

- **WHEN** the picker is opened with a `fixedDate` prop set
- **THEN** the calendar panel SHALL NOT render, and the time-range panel for that date SHALL be shown, defaulting to the full available window marked as available

#### Scenario: Opening the picker without a fixed date

- **WHEN** the picker is opened without a `fixedDate` prop
- **THEN** the calendar panel SHALL render and behave exactly as it does today, unaffected by this change

#### Scenario: Time window constrains selectable hours

- **WHEN** the picker is opened with `timeWindowStart` and `timeWindowEnd` props set
- **THEN** the time selection dropdowns SHALL only offer hours within that window

### Requirement: Availability picker uses the shared modal shell

The availability picker modal SHALL use the shared `BaseModal` component for its overlay, header, and footer, so that it closes on Escape, exposes `role="dialog"` with `aria-modal` and `aria-labelledby`, and matches the z-index and spacing used by other modals in the application.

#### Scenario: Closing with the Escape key

- **WHEN** the availability picker modal is open and the user presses Escape
- **THEN** the modal SHALL close

### Requirement: Join flow for range-mode activities opens the availability picker

For an activity whose `availability_mode` is `range`, clicking the join action SHALL open the availability picker modal instead of showing an inline candidate-slot checkbox list; activities whose `availability_mode` is `slot` SHALL continue to use the existing checkbox list unchanged.

#### Scenario: Participant joins a range-mode activity

- **WHEN** a participant clicks "報名參加" on an activity with `availability_mode: 'range'`
- **THEN** the availability picker modal SHALL open with `fixedDate`, `timeWindowStart`, and `timeWindowEnd` populated from the activity

#### Scenario: Confirming availability submits ranges to the join API

- **WHEN** the participant confirms their selection in the availability picker for a range-mode activity
- **THEN** the system SHALL convert the picker's result into `{ ranges: [{ start, end }] }` and submit it to the join endpoint, treating an all-day selection as a single range spanning the full day

#### Scenario: Slot-mode activities are unaffected

- **WHEN** a participant clicks "報名參加" on an activity with `availability_mode: 'slot'`
- **THEN** the existing inline checkbox candidate-slot list SHALL be shown, unchanged from current behavior

### Requirement: Two-section decision display for range-mode activities

For a range-mode activity, the creator's decision view SHALL render `decision_candidates.perfect_overlap` and `decision_candidates.partial_overlap` as two separate sections, instead of the flat list used for slot-mode activities.

#### Scenario: Creator views ranked candidates

- **WHEN** the creator opens the decision view for a `voting` or `recruiting` range-mode activity
- **THEN** the system SHALL render a "perfect match" section from `perfect_overlap` and a "most available" section from `partial_overlap`

### Requirement: Confirmation submits slot start/end for range-mode activities

For a range-mode activity, confirming formation SHALL submit `{ slotStart, slotEnd }` derived from the selected candidate, instead of `{ candidateSlotId }`.

#### Scenario: Creator confirms a candidate from the ranked list

- **WHEN** the creator selects a candidate from `perfect_overlap` or `partial_overlap` and confirms formation
- **THEN** the system SHALL call the confirm-formation endpoint with `{ slotStart: <selected candidate's slot_start>, slotEnd: <selected candidate's slot_end> }`
