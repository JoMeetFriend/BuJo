## ADDED Requirements

### Requirement: Decision candidate list is rendered only for the activity creator

`ActivityDetailModal` SHALL render the decision candidate list (the ranked entries showing count, ratio, and supporter avatars) only when the viewing user is the activity's creator. Non-creator viewers SHALL NOT see this section at all, consistent with the backend returning `decision_candidates: null` for non-creator responses.

#### Scenario: Non-creator viewer sees no decision candidate list during voting

- **WHEN** a non-creator, joined participant views an activity in `voting` status
- **THEN** the decision candidate list section SHALL NOT be rendered

#### Scenario: Creator still sees the decision candidate list

- **WHEN** the activity's creator views the same activity in `voting` status
- **THEN** the decision candidate list section SHALL render as before, unaffected

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
