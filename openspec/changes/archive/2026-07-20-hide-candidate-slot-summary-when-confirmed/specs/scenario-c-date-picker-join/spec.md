## MODIFIED Requirements

### Requirement: Scenario C joined state shows selected dates

The activity detail view SHALL display a scenario C participant's selected dates in date language instead of time-slot language, while that participant's status is `recruiting` or `voting`. The activity detail view SHALL NOT display this date summary once the activity status is `confirmed`, and SHALL NOT display it for the activity's creator regardless of activity status, because the creator is automatically recorded as a joined participant at activity creation without ever submitting a candidate-slot selection through the join flow.

#### Scenario: Joined participant views recruiting scenario C activity

- **WHEN** a joined participant opens a recruiting scenario C activity
- **THEN** the activity detail view SHALL show a date summary of the dates the participant selected
- **AND** the primary action SHALL allow revising the selected dates

##### Example: joined participant sees selected dates and can revise

- **GIVEN** a joined participant selected candidate slots for `2026-08-01` and `2026-08-09`
- **AND** the scenario C activity status is `recruiting`
- **WHEN** the participant opens the activity detail view
- **THEN** the detail view SHALL show a date summary containing `8/1` and `8/9`
- **AND** the detail view SHALL provide a date revision action

#### Scenario: Joined participant views scenario C activity during voting

- **WHEN** a joined, non-creator participant opens a scenario C activity whose status is `voting`
- **THEN** the activity detail view SHALL show a date summary of the dates the participant selected
- **AND** the activity detail view SHALL NOT allow revising the selected dates

#### Scenario: Date summary is hidden once the activity is confirmed

- **WHEN** any user opens a scenario C activity whose status is `confirmed`
- **THEN** the activity detail view SHALL NOT show the selected-dates summary, regardless of whether that user has joined

#### Scenario: Date summary is hidden for the creator regardless of status

- **WHEN** the activity's creator opens their own scenario C activity, at any status
- **THEN** the activity detail view SHALL NOT show the selected-dates summary to the creator
