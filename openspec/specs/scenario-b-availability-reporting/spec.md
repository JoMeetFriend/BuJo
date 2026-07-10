# scenario-b-availability-reporting Specification

## Purpose

TBD - created by archiving change 'scenario-b-availability-redesign'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: scenario-b-availability-redesign
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
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


<!-- @trace
source: scenario-b-availability-redesign
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Availability picker uses the shared modal shell

The availability picker modal SHALL use the shared `BaseModal` component for its overlay, header, and footer, so that it closes on Escape, exposes `role="dialog"` with `aria-modal` and `aria-labelledby`, and matches the z-index and spacing used by other modals in the application.

#### Scenario: Closing with the Escape key

- **WHEN** the availability picker modal is open and the user presses Escape
- **THEN** the modal SHALL close


<!-- @trace
source: scenario-b-availability-redesign
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
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


<!-- @trace
source: scenario-b-availability-redesign
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Two-section decision display for range-mode activities

For a range-mode activity, the creator's decision view SHALL render `decision_candidates.perfect_overlap` and `decision_candidates.partial_overlap` as two separate sections, instead of the flat list used for slot-mode activities.

#### Scenario: Creator views ranked candidates

- **WHEN** the creator opens the decision view for a `voting` or `recruiting` range-mode activity
- **THEN** the system SHALL render a "perfect match" section from `perfect_overlap` and a "most available" section from `partial_overlap`


<!-- @trace
source: scenario-b-availability-redesign
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Confirmation submits slot start/end for range-mode activities

For a range-mode activity, confirming formation SHALL submit `{ slotStart, slotEnd }` derived from the selected candidate, instead of `{ candidateSlotId }`.

#### Scenario: Creator confirms a candidate from the ranked list

- **WHEN** the creator selects a candidate from `perfect_overlap` or `partial_overlap` and confirms formation
- **THEN** the system SHALL call the confirm-formation endpoint with `{ slotStart: <selected candidate's slot_start>, slotEnd: <selected candidate's slot_end> }`

<!-- @trace
source: scenario-b-availability-redesign
updated: 2026-07-10
code:
  - src/components/EventPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/EventPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Time picker dropdown stays within the modal card bounds

When a time-of-day dropdown panel is opened inside the availability picker modal, the system SHALL position and size the dropdown panel relative to the modal card's own bounding rectangle, not the browser viewport, so the panel never extends beyond the visible edge of the modal card.

#### Scenario: Dropdown flips upward when there is not enough room below inside the modal card

- **WHEN** a user opens a start-time or end-time dropdown whose trigger button is near the bottom of the modal card
- **THEN** the dropdown panel SHALL open upward (anchored by `bottom`, not `top`) so its options remain within the modal card's visible area

#### Scenario: Dropdown is clamped horizontally to the modal card's left/right edges

- **WHEN** a user opens a dropdown whose trigger button is near the right edge of the modal card
- **THEN** the dropdown panel's horizontal position SHALL be clamped so it does not extend past the modal card's right edge

<!-- @trace
source: fix-availability-picker-dropdown-positioning
updated: 2026-07-10
code:
  - src/components/AvailabilityPickerModal.vue
tests:
  - src/__tests__/AvailabilityPickerModal.test.js
-->

---
### Requirement: Scrolling inside the time picker dropdown does not close it

The system SHALL distinguish scroll events that originate inside the open dropdown's own option list from scroll events elsewhere, and SHALL only close the dropdown for the latter.

#### Scenario: Scrolling the dropdown's own option list keeps it open

- **WHEN** a user scrolls within the currently open dropdown panel's option list
- **THEN** the dropdown SHALL remain open

#### Scenario: Scrolling outside the dropdown closes it

- **WHEN** a user scrolls any part of the page or modal outside the currently open dropdown panel
- **THEN** the dropdown SHALL close

<!-- @trace
source: fix-availability-picker-dropdown-positioning
updated: 2026-07-10
code:
  - src/components/AvailabilityPickerModal.vue
tests:
  - src/__tests__/AvailabilityPickerModal.test.js
-->

---
### Requirement: Availability picker restores its default state when reopened

For a fixed-date availability picker (no calendar available to re-select a date), closing and reopening the modal SHALL restore the same default time selection it showed on first mount, not an empty unselected state.

#### Scenario: Reopening a fixed-date picker after closing shows the original default time range

- **WHEN** a user opens a fixed-date availability picker, closes it (via the close button), and reopens it
- **THEN** the picker SHALL show the same default date and time selection as when it was first opened (respecting the activity's configured time window), rather than a blank "select a date" placeholder

<!-- @trace
source: fix-availability-picker-dropdown-positioning
updated: 2026-07-10
code:
  - src/components/AvailabilityPickerModal.vue
tests:
  - src/__tests__/AvailabilityPickerModal.test.js
-->
