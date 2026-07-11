# scenario-d-availability-picker-join Specification

## Purpose

TBD - created by archiving change 'scenario-d-availability-picker-join'. Update Purpose after archive.

## Requirements

### Requirement: AvailabilityPickerModal restricts time selection to the per-date candidate window

`AvailabilityPickerModal` SHALL accept an optional `dateWindows` prop mapping a date key to a single `{start, end, slotId}` window (not an array). When the active date has an entry in `dateWindows`, the time panel's selectable hour options SHALL be restricted to that window instead of the global `timeWindowStart`/`timeWindowEnd` props.

#### Scenario: Window restricts selectable hours

- **WHEN** the active date has a `dateWindows` entry `{start: '14:00', end: '16:00'}`
- **THEN** the start/end time dropdowns SHALL only offer hours between 14:00 and 16:00 inclusive


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: New date selection defaults to full window coverage in dateWindows mode

When a date with a `dateWindows` entry is newly selected, the modal SHALL default the selected time range to one range covering that window's full `start`–`end`, rather than defaulting to "all day available".

#### Scenario: Selecting a candidate date pre-fills the window's full range

- **WHEN** a participant selects a date that has a `dateWindows` entry `{start: '14:00', end: '16:00'}`
- **THEN** `selectedDates` for that date SHALL contain one range `{from: '14:00', to: '16:00'}`


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Sub-range confirmation is rejected when it falls outside the window for that date

`handleConfirm` SHALL reject the selection and set an error message when, for a date with a `dateWindows` entry, any selected range is not fully contained within that window.

#### Scenario: Range extending past the window end is rejected

- **WHEN** the active date has a window `{14:00-16:00}`
- **AND** a participant selects a range `15:00`–`17:00` (extending past the window end)
- **THEN** `handleConfirm` SHALL NOT emit `confirm`
- **AND** SHALL set a confirmation error scoped to that date

#### Scenario: Range fully inside the window is accepted

- **WHEN** the active date has a window `{14:00-16:00}`
- **AND** a participant selects a sub-range `14:30`–`15:30` fully inside that window
- **THEN** `handleConfirm` SHALL emit `confirm` including that range


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario D participants use only the availability picker, never a checkbox

For an activity whose `schedule_variant` is `find_date_time`, `ActivityDetailModal` SHALL route all pre-join and post-join candidate slot selection through `AvailabilityPickerModal`. The generic checkbox list used for scenario A SHALL NOT render for `find_date_time` activities at any stage.

#### Scenario: Joining opens the picker instead of showing checkboxes

- **WHEN** a participant who has not joined a `find_date_time` activity clicks "報名參加"
- **THEN** the system SHALL open `AvailabilityPickerModal`
- **AND** SHALL NOT render the checkbox list

#### Scenario: Modifying after joining opens the same picker

- **WHEN** a joined participant on a `recruiting` `find_date_time` activity clicks the single modify button
- **THEN** the system SHALL reopen `AvailabilityPickerModal` pre-filled with the participant's previously selected dates and ranges
- **AND** SHALL NOT render the checkbox list


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario D exposes dedicated pre-join and post-join summary text

`ActivityDetailModal` SHALL show a scenario-D-specific label and summary for candidate slot selection, both before joining (showing a prompt when nothing is selected yet) and after joining once the activity reaches `voting` or `confirmed` status (showing the participant's selected candidate slots), mirroring the scenario C pattern instead of falling through to generic fallback text.

#### Scenario: Pre-join, nothing selected yet

- **WHEN** a `find_date_time` activity is `recruiting` and the current user has not joined
- **THEN** the options area SHALL show a scenario-D-specific label and a prompt to open the picker

#### Scenario: Post-join summary during voting or confirmed status

- **WHEN** a `find_date_time` activity has reached `voting` or `confirmed` status and the current user has joined
- **THEN** the system SHALL display the participant's selected candidate slots (date and time), not a generic or empty state


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Scenario D join submission maps picker ranges back to candidate slot IDs

`ActivityDetailModal` SHALL convert each confirmed picker range into the candidate slot it falls within, and submit `candidateSlotRanges` (in addition to `candidateSlotIds`) to the join API.

#### Scenario: Confirmed ranges map to their originating candidate slots

- **WHEN** the picker confirms ranges for a `find_date_time` activity
- **THEN** for each confirmed range, the system SHALL find the `dateWindows` entry it falls within and submit its `slotId` as part of `candidateSlotIds`
- **AND** SHALL submit the range's start/end as a corresponding `candidateSlotRanges` entry


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Creator decision view shows nested overlap ranking per candidate slot for Scenario D

For a `find_date_time` activity, `ActivityDetailModal`'s creator decision section SHALL render each entry of `activity.decision_candidates` with a nested "完全重疊"/"部分重疊" sub-list built from that entry's own `perfect_overlap`/`partial_overlap` arrays, mirroring the presentation already used for scenario B's flat `perfectOverlapCandidates`/`partialOverlapCandidates`.

#### Scenario: Each candidate slot shows its own overlap breakdown

- **WHEN** the creator views a `find_date_time` activity in `voting` status with two candidate slots, each having its own `perfect_overlap`/`partial_overlap` data
- **THEN** the decision section SHALL render two groups, one per candidate slot
- **AND** each group SHALL list that slot's `perfect_overlap` entries under "完全重疊" and `partial_overlap` entries under "部分重疊"


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Confirming Scenario D formation submits the candidate slot and the chosen narrow window

When the creator selects a segment from a candidate slot's overlap breakdown and confirms formation for a `find_date_time` activity, `ActivityDetailModal` SHALL call the confirm-formation API with `{candidateSlotId, slotStart, slotEnd}`, where `candidateSlotId` identifies the outer candidate slot and `slotStart`/`slotEnd` identify the selected segment.

#### Scenario: Confirming a selected segment submits all three fields

- **WHEN** the creator selects a `partial_overlap` segment under candidate slot `slot-a` and clicks confirm
- **THEN** the system SHALL submit `candidateSlotId: 'slot-a'` together with that segment's `slot_start`/`slot_end` as `slotStart`/`slotEnd`


<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: EventPage candidate slot creation is limited to one slot per date for Scenario D

`EventPage.vue` SHALL NOT offer a control to add more than one candidate time slot for the same candidate date when creating a `find_date_time` activity.

#### Scenario: No add-slot control is available for an already-configured date

- **WHEN** a creator has configured a time slot for a candidate date in the `find_date_time` creation flow
- **THEN** the UI SHALL NOT show a control to add another time slot for that same date

<!-- @trace
source: scenario-d-availability-picker-join
updated: 2026-07-11
code:
  - src/components/DateEventsModal.vue
  - src/components/ActivityDetailModal.vue
  - src/assets/main.css
  - src/components/AvailabilityPickerModal.vue
  - src/components/ActivityView.vue
  - src/components/EventPage.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/EventPage.test.js
-->