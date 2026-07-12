## ADDED Requirements

### Requirement: Decision candidate list renders as a single sorted list without overlap-category headings

`ActivityDetailModal` SHALL render the decision/voting candidate list for scenario B (range mode) and scenario C (`find_date`) by consuming `activity.decision_candidates` as a single array already sorted by `count` descending, and SHALL NOT render "完全重疊" ("perfect overlap") or "部分重疊" ("partial overlap") category headings for these scenarios.

#### Scenario: Scenario B decision list has no overlap-category headings

- **WHEN** `activity.decision_candidates` is a flat array (scenario B, range mode)
- **THEN** the rendered decision list SHALL NOT contain a "完全重疊" or "部分重疊" heading, and each entry SHALL appear in the order provided by the API

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

### Requirement: Scenario D retains outer candidate-slot grouping with a unified inner segment list

For scenario D (`find_date_time`), `ActivityDetailModal` SHALL render `activity.decision_candidates` as an outer list grouped by candidate slot (one group per element, keyed by the element's `id`, `slot_start`, and `slot_end`), and SHALL render each group's `segments` array as a single unified list per the "single sorted list", "ratio and avatars", and "top 3 with progressive reveal" requirements above — applied independently per candidate slot group. The outer candidate-slot groups themselves SHALL NOT be merged or reordered by the frontend beyond the order provided by the API.

#### Scenario: Two candidate slots each get their own independent segment list

- **WHEN** `activity.decision_candidates` contains two candidate slot groups, each with its own `segments` array of more than 3 entries
- **THEN** each group SHALL render its own "顯示更多" button and expanding one group's segment list SHALL NOT affect the other group's visible count

### Requirement: Confirm-formation submission matches against the unified segment shape

`handleConfirmFormation` SHALL locate the segment matching the user's selection by looking it up in the normalized single-array segment list (scenario B/C) or within the selected candidate slot group's `segments` array (scenario D), rather than concatenating separate perfect/partial arrays. When no matching segment is found, the function SHALL return without submitting a request, consistent with prior behavior.

#### Scenario: Scenario B submission uses the normalized list

- **WHEN** the creator selects an entry and confirms formation in range mode
- **THEN** the submitted `slotStart`/`slotEnd` SHALL match the selected entry found via a single lookup in the normalized decision list, not a concatenation of two arrays

### Requirement: Fixed-time activities expose participant headcount and avatars to the creator

For scenario A (`schedule_variant: 'fixed'`, no voting), `ActivityDetailModal` SHALL render the same registration headcount (`activity.current_count`) and participant avatars (`activity.participants`) shown for other scenarios, using the same `activity-detail-join` presentation.

#### Scenario: Scenario A activity detail shows registration count and avatars

- **WHEN** the creator opens the detail view of a `fixed`-variant activity that has joined participants
- **THEN** the detail view SHALL display `已報名 {current_count} / ...` and an avatar for each joined participant, matching the presentation used for scenario B/C/D
