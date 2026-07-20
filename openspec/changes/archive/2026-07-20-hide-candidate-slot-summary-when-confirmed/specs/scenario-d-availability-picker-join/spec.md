## MODIFIED Requirements

### Requirement: Scenario D exposes dedicated pre-join and post-join summary text

`ActivityDetailModal` SHALL show a scenario-D-specific label and summary for candidate slot selection, both before joining (showing a prompt when nothing is selected yet) and after joining while the activity is in `voting` status (showing the participant's selected candidate slots), mirroring the scenario C pattern instead of falling through to generic fallback text. This post-join summary SHALL NOT be shown once the activity reaches `confirmed` status, and SHALL NOT be shown to the activity's creator regardless of activity status, because the creator is automatically recorded as a joined participant at activity creation without ever submitting a candidate-slot selection through the join flow.

#### Scenario: Pre-join, nothing selected yet

- **WHEN** a `find_date_time` activity is `recruiting` and the current user has not joined
- **THEN** the options area SHALL show a scenario-D-specific label and a prompt to open the picker

#### Scenario: Post-join summary during voting status

- **WHEN** a `find_date_time` activity has reached `voting` status and the current user has joined and is not the activity's creator
- **THEN** the system SHALL display the participant's selected candidate slots (date and time), not a generic or empty state

#### Scenario: Post-join summary is hidden once the activity is confirmed

- **WHEN** a `find_date_time` activity has reached `confirmed` status
- **THEN** the system SHALL NOT display the post-join candidate-slot summary, regardless of whether the current user has joined

#### Scenario: Post-join summary is hidden for the creator regardless of status

- **WHEN** the activity's creator opens their own `find_date_time` activity, at any status
- **THEN** the system SHALL NOT display the post-join candidate-slot summary to the creator, even though the creator is recorded as a joined participant
