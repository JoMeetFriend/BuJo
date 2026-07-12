# activity-decision-view Specification

## Purpose

TBD - created by archiving change 'decision-view-ux-redesign'. Update Purpose after archive.

## Requirements

### Requirement: Decision candidate list renders as a single sorted list without overlap-category headings

`ActivityDetailModal` SHALL render the decision/voting candidate list for scenario B (range mode) and scenario C (`find_date`) by consuming `activity.decision_candidates` as a single array already sorted by `count` descending, and SHALL NOT render "完全重疊" ("perfect overlap") or "部分重疊" ("partial overlap") category headings for these scenarios.

#### Scenario: Scenario B decision list has no overlap-category headings

- **WHEN** `activity.decision_candidates` is a flat array (scenario B, range mode)
- **THEN** the rendered decision list SHALL NOT contain a "完全重疊" or "部分重疊" heading, and each entry SHALL appear in the order provided by the API


<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Each decision entry displays a support ratio and supporter avatars

Each rendered decision entry SHALL display a support ratio text in the form `X/Y人`, where `X` is the entry's `count` and `Y` is a voting denominator computed as `max(0, activity.participants.length - 1)` (excluding the creator). When the computed denominator is `0`, the entry SHALL NOT display a ratio text and SHALL instead display only the count. Each entry SHALL render an avatar for every supporter in its `supporters` array; entries with an empty `supporters` array SHALL render no avatars and SHALL NOT throw an error.

#### Scenario: Ratio text reflects count and voting denominator

- **WHEN** an entry has `count: 2` and `activity.participants.length` is `3` (one creator, two other participants)
- **THEN** the entry SHALL display the ratio text `2/2人`

#### Scenario: Zero denominator suppresses ratio text

- **WHEN** `activity.participants.length` is `1` (only the creator has joined)
- **THEN** entries SHALL display only the count, without a `X/0人` ratio text

##### Example: ratio text by participant count

| `count` | `activity.participants.length` | Rendered text |
| ------- | ------------------------------- | -------------- |
| 2       | 3                                | `2/2人`        |
| 1       | 3                                | `1/2人`        |
| 1       | 1                                | count only, no ratio |


<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Decision list defaults to showing the top 3 entries with progressive reveal

Each decision list (the flat list for scenario B/C, and each candidate slot's inner segment list for scenario D) SHALL independently track how many entries are currently visible, defaulting to `3`. When a list has more entries than are currently visible, a "顯示更多" ("show more") button SHALL be rendered below the list. Clicking the button SHALL increase the visible count for that list by `3` (not reveal all remaining entries at once), up to the list's total length. When the visible count reaches the list's total length, the button SHALL NOT be rendered.

#### Scenario: A list with 7 entries reveals progressively

- **WHEN** a decision list has 7 entries and the visible count is at its default of 3
- **THEN** the first 3 entries SHALL be visible and a "顯示更多" button SHALL be rendered

#### Scenario: Clicking "show more" reveals exactly 3 more entries

- **WHEN** the user clicks "顯示更多" on a list with 7 entries currently showing 3
- **THEN** the visible count SHALL become 6, not 7

#### Scenario: The button disappears once the list is fully expanded

- **WHEN** the user clicks "顯示更多" again on a list with 7 entries currently showing 6
- **THEN** the visible count SHALL become 7 and the "顯示更多" button SHALL no longer be rendered

#### Scenario: A list with 3 or fewer entries never shows the button

- **WHEN** a decision list has 3 entries
- **THEN** all 3 SHALL be visible by default and no "顯示更多" button SHALL be rendered


<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Supporter avatars reveal names on desktop hover and mobile long-press

Each decision entry's avatar group SHALL reveal a popover listing supporter display names when triggered. On pointer-capable (desktop) interaction, the popover SHALL open on `mouseenter` and close on `mouseleave`. On touch interaction, the popover SHALL open only after the touch is held for at least 500ms (`touchstart` followed by a 500ms delay without an intervening `touchend`/`touchmove`); a touch released before 500ms SHALL NOT open the popover.

#### Scenario: Desktop hover opens the supporter popover

- **WHEN** the pointer enters an entry's avatar group
- **THEN** the popover listing supporter display names SHALL become visible

#### Scenario: A short tap on mobile does not open the popover

- **WHEN** a touch starts and ends (`touchend`) within 500ms on an entry's avatar group
- **THEN** the popover SHALL NOT become visible

#### Scenario: A long press on mobile opens the popover

- **WHEN** a touch starts on an entry's avatar group and remains held for at least 500ms without `touchend` or `touchmove`
- **THEN** the popover listing supporter display names SHALL become visible


<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Scenario D retains outer candidate-slot grouping with a unified inner segment list

For scenario D (`find_date_time`), `ActivityDetailModal` SHALL render `activity.decision_candidates` as an outer list grouped by candidate slot (one group per element, keyed by the element's `id`, `slot_start`, and `slot_end`), and SHALL render each group's `segments` array as a single unified list per the "single sorted list", "ratio and avatars", and "top 3 with progressive reveal" requirements above — applied independently per candidate slot group. The outer candidate-slot groups themselves SHALL NOT be merged or reordered by the frontend beyond the order provided by the API.

#### Scenario: Two candidate slots each get their own independent segment list

- **WHEN** `activity.decision_candidates` contains two candidate slot groups, each with its own `segments` array of more than 3 entries
- **THEN** each group SHALL render its own "顯示更多" button and expanding one group's segment list SHALL NOT affect the other group's visible count


<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Confirm-formation submission matches against the unified segment shape

`handleConfirmFormation` SHALL locate the segment matching the user's selection by looking it up in the normalized single-array segment list (scenario B/C) or within the selected candidate slot group's `segments` array (scenario D), rather than concatenating separate perfect/partial arrays. When no matching segment is found, the function SHALL return without submitting a request, consistent with prior behavior.

#### Scenario: Scenario B submission uses the normalized list

- **WHEN** the creator selects an entry and confirms formation in range mode
- **THEN** the submitted `slotStart`/`slotEnd` SHALL match the selected entry found via a single lookup in the normalized decision list, not a concatenation of two arrays


<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Fixed-time activities expose participant headcount and avatars to the creator

For scenario A (`schedule_variant: 'fixed'`, no voting), `ActivityDetailModal` SHALL render the same registration headcount (`activity.current_count`) and participant avatars (`activity.participants`) shown for other scenarios, using the same `activity-detail-join` presentation.

#### Scenario: Scenario A activity detail shows registration count and avatars

- **WHEN** the creator opens the detail view of a `fixed`-variant activity that has joined participants
- **THEN** the detail view SHALL display `已報名 {current_count} / ...` and an avatar for each joined participant, matching the presentation used for scenario B/C/D

<!-- @trace
source: decision-view-ux-redesign
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Decision candidate list is rendered only for the activity creator

`ActivityDetailModal` SHALL render the decision candidate list (the ranked entries showing count, ratio, and supporter avatars) only when the viewing user is the activity's creator. Non-creator viewers SHALL NOT see this section at all, consistent with the backend returning `decision_candidates: null` for non-creator responses.

#### Scenario: Non-creator viewer sees no decision candidate list during voting

- **WHEN** a non-creator, joined participant views an activity in `voting` status
- **THEN** the decision candidate list section SHALL NOT be rendered

#### Scenario: Creator still sees the decision candidate list

- **WHEN** the activity's creator views the same activity in `voting` status
- **THEN** the decision candidate list section SHALL render as before, unaffected


<!-- @trace
source: decision-view-participant-scope
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Read-only selection summaries display co-participant avatars with hover and long-press name reveal

For a non-creator viewer, each entry in the read-only "your selection" summaries (scenario B's reported time ranges, scenario C's selected dates, scenario D's selected candidate slots) SHALL display an avatar for every participant in that entry's `co_participants` array, shown by default without requiring a hover or tap. Hovering (desktop) or long-pressing (mobile) an avatar group SHALL reveal a popover listing those participants' display names, using the same interaction behavior as supporter avatars elsewhere in the decision view.

#### Scenario: Co-participant avatars render by default

- **WHEN** a non-creator viewer's selected candidate slot has a non-empty `co_participants` array
- **THEN** an avatar SHALL be visible for each co-participant without any hover or tap interaction

#### Scenario: Hovering an avatar group reveals names

- **WHEN** the pointer enters a selection summary entry's avatar group
- **THEN** a popover listing the co-participants' display names SHALL become visible

#### Scenario: Empty co_participants renders no avatars

- **WHEN** a selection summary entry's `co_participants` array is empty
- **THEN** no avatar SHALL be rendered for that entry, and no error SHALL occur


<!-- @trace
source: decision-view-participant-scope
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Status badge text reflects registration status for joined non-creator viewers during in-progress phases

For an activity in `recruiting` or `voting` status, `ActivityDetailModal` SHALL display "已報名" as the status badge text when the viewing user is a joined participant and not the creator, instead of the status-based text otherwise shown. For `confirmed` and `cancelled` statuses, and for the creator or a non-joined viewer in any status, the status badge text SHALL remain the existing status-based text unchanged.

#### Scenario: Joined non-creator sees registration status during recruiting

- **WHEN** a non-creator, joined participant views an activity in `recruiting` status
- **THEN** the status badge SHALL display "已報名"

#### Scenario: Joined non-creator sees registration status during voting

- **WHEN** a non-creator, joined participant views an activity in `voting` status
- **THEN** the status badge SHALL display "已報名"

#### Scenario: Creator sees the unchanged status text

- **WHEN** the activity's creator views the same activity in `recruiting` or `voting` status
- **THEN** the status badge SHALL display the existing status-based text ("揪團中" or "建立者決選中"), unaffected by their own participation

#### Scenario: Confirmed and cancelled statuses are unaffected by role

- **WHEN** any viewer, creator or non-creator, views an activity in `confirmed` or `cancelled` status
- **THEN** the status badge SHALL display the existing status-based text ("已成團" or "已取消") regardless of role

<!-- @trace
source: decision-view-participant-scope
updated: 2026-07-12
code:
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: `actionError` resets when switching to a different activity

`ActivityDetailModal`'s `fetchActivity(activityId)` SHALL reset `actionError` to an empty string at the start of the fetch, in the same reset pass as its other existing per-activity UI state (candidate chip expansion, avatar popovers, visible-count resets). This applies regardless of whether the component instance is freshly mounted or reused for a different `activityId` (as it is when embedded in `ActivityView`'s featured card slot or `DateEventsModal`'s reused detail modal).

#### Scenario: A stale action error does not leak into a different activity

- **WHEN** `actionError` holds a non-empty message from a previous activity (e.g. a join failure) and the component is reused to fetch a different `activityId`
- **THEN** `actionError` SHALL be reset to an empty string before the new activity's data is displayed

#### Scenario: A genuine action error for the newly-fetched activity is unaffected

- **WHEN** `fetchActivity` completes for a new `activityId` and a subsequent user action on that activity produces an error
- **THEN** `actionError` SHALL display that new error normally, unaffected by the reset that occurred at fetch time


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

---
### Requirement: Expired candidate items render as disabled with a non-color label, not hidden

For scenario B (range mode), scenario C (`find_date`), and scenario D (`find_date_time`), each entry in the decision candidate list whose time range has already fully elapsed relative to the current time SHALL remain rendered in the list at its normal sort position, SHALL receive a disabled visual treatment (reduced opacity, non-interactive cursor, no click/hover handlers), and SHALL display a non-color text label (e.g. "已過期") indicating expiration. This requirement does not apply to scenario A, which has no candidate list.

For scenario C and D, an entry's expiration SHALL be determined by comparing its `slot_start` field to the current time. For scenario B, whose decision candidates are time-range segments (not `ActivityCandidateSlot` records), an entry's expiration SHALL be determined by comparing that segment's own range-start time (as returned by the API) to the current time.

#### Scenario: An expired scenario C/D candidate slot remains visible but disabled

- **WHEN** a decision candidate entry's `slot_start` is before the current time
- **THEN** the entry SHALL remain in the rendered list at its normal position, SHALL be visually disabled, and SHALL display the "已過期" label
- **AND** clicking the entry SHALL NOT trigger any selection behavior

#### Scenario: An expired scenario B range segment remains visible but disabled

- **WHEN** a decision candidate entry (scenario B range-mode segment) has a range-start time before the current time
- **THEN** the entry SHALL remain in the rendered list at its normal position, SHALL be visually disabled, and SHALL display the "已過期" label

#### Scenario: A non-expired candidate entry is unaffected

- **WHEN** a decision candidate entry's relevant start time is at or after the current time
- **THEN** the entry SHALL render with its normal (non-disabled) interactive styling, with no expiration label

#### Scenario: Scenario A has no expiration treatment to apply

- **WHEN** the activity is scenario A (fixed date and time, `requires_voting` is false)
- **THEN** no decision candidate list is rendered, and this requirement does not apply

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