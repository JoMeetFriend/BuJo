## ADDED Requirements

### Requirement: `actionError` resets when switching to a different activity

`ActivityDetailModal`'s `fetchActivity(activityId)` SHALL reset `actionError` to an empty string at the start of the fetch, in the same reset pass as its other existing per-activity UI state (candidate chip expansion, avatar popovers, visible-count resets). This applies regardless of whether the component instance is freshly mounted or reused for a different `activityId` (as it is when embedded in `ActivityView`'s featured card slot or `DateEventsModal`'s reused detail modal).

#### Scenario: A stale action error does not leak into a different activity

- **WHEN** `actionError` holds a non-empty message from a previous activity (e.g. a join failure) and the component is reused to fetch a different `activityId`
- **THEN** `actionError` SHALL be reset to an empty string before the new activity's data is displayed

#### Scenario: A genuine action error for the newly-fetched activity is unaffected

- **WHEN** `fetchActivity` completes for a new `activityId` and a subsequent user action on that activity produces an error
- **THEN** `actionError` SHALL display that new error normally, unaffected by the reset that occurred at fetch time

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
