## MODIFIED Requirements

### Requirement: Two persistent deadline lines replace the mutually-exclusive adjust-row/warning-banner

The create-activity form SHALL display a single persistent line, rendered directly below the schedule fields of whichever of the four scenarios (fixed date/fixed time, fixed date/voted time, voted dates/fixed time, voted dates/voted time) is currently active, showing the report cutoff (`vote_deadline_at`, user-adjustable via the preset editor). Because the four scenarios are mutually exclusive, exactly one copy of this line SHALL be visible at any time. This line SHALL switch to a warning visual style when the report-cutoff time is within 30 minutes of the current time, or when the default preset algorithm has degraded to no report buffer (no preset yields at least 30 minutes of lead time). The form SHALL NOT display a separate persistent line for the schedule ceiling (`deadline_at`); the schedule ceiling's proximity to the current time is surfaced only through the confirmation modal described in "Confirmation gate for near-zero decision buffer", not through a persistent line. This replaces the prior two-line layout (report cutoff plus a separate schedule-ceiling line) and the prior fixed bottom-of-form position.

#### Scenario: Line appears below the active scenario's own schedule fields, not at a fixed bottom position

- **WHEN** the create-activity form is showing any one of the four scenarios
- **THEN** the persistent report-cutoff line SHALL render directly after that scenario's own date/time selection fields, not at a shared location independent of scenario

##### Example: line follows the active scenario

- **GIVEN** the user switches from scenario A (fixed date/fixed time) to scenario C (voted dates/fixed time)
- **WHEN** the form re-renders for scenario C
- **THEN** the persistent line SHALL appear below scenario C's candidate-date/uniform-time fields, not below scenario A's fields, and no second copy SHALL remain visible

#### Scenario: Line shows normal styling when the report cutoff is not near-term

- **WHEN** the report cutoff is more than 30 minutes ahead of the current time and the default algorithm found a safe preset
- **THEN** the persistent line SHALL render in its normal (non-warning) visual style

#### Scenario: Line shows warning styling when the report cutoff is near-term or no safe preset exists

- **WHEN** the report cutoff is within 30 minutes of the current time, or the default algorithm degraded to no report buffer
- **THEN** the persistent line SHALL switch to its warning visual style

#### Scenario: Report-cutoff line normal text

- **WHEN** the report cutoff is not within 30 minutes of the current time
- **THEN** the line SHALL read "報名開放到 {報名截止時間}（{偏移量} 截止）"

#### Scenario: Report-cutoff line warning text

- **WHEN** the report cutoff is within 30 minutes of the current time, or no safe preset was found
- **THEN** the line SHALL read "距離報名截止僅剩 {X} 分鐘！", where {X} is the number of minutes from now until the report-cutoff time

### Requirement: Confirmation gate for near-zero decision buffer

The create-activity form SHALL intercept submission with a confirmation modal only when the schedule ceiling (`deadline_at`) itself is within 30 minutes of the current time — i.e. when even the no-report-buffer fallback from the default algorithm cannot provide 30 minutes of lead time. This replaces the prior condition of intercepting whenever the schedule anchor was within 1 hour of the current time.

#### Scenario: Confirmation modal appears only at the extreme edge

- **WHEN** the user submits the form and the schedule ceiling is within 30 minutes of the current time
- **THEN** the form SHALL show a confirmation modal reading two lines — "距離活動開始只剩 {X} 分鐘" followed by "確定要建立活動嗎？", where {X} is the number of minutes from now until the schedule ceiling — and SHALL only submit after the user confirms

#### Scenario: Submission proceeds without a confirmation modal outside the extreme edge

- **WHEN** the user submits the form and the schedule ceiling is more than 30 minutes ahead of the current time, even if the report-cutoff line is itself showing warning styling
- **THEN** the form SHALL submit directly without showing the confirmation modal

## REMOVED Requirements

### Requirement: Third line for near-term candidate date reminder in scenario C and D

**Reason**: The three-line layout was simplified to a single report-cutoff line. The informational third line (shown in scenario C/D when a candidate date is within 1 hour) added information density without a corresponding safety function — unlike the schedule-ceiling line it accompanied, it had no confirmation-gate behavior tied to it, so removing it does not change any submission-blocking behavior.

**Migration**: No user action required. Scenario C and D no longer render this line under any condition; no other UI surfaces this candidate-date-proximity information.

#### Scenario: Third line appeared when a near-term candidate date was selected in scenario C (removed)

- **WHEN** the form was in scenario C and at least one selected candidate date was within 1 hour of the current time
- **THEN** the third line used to render with the near-term candidate reminder text; it no longer renders under any condition

#### Scenario: Third line appeared when a near-term candidate slot was configured in scenario D (removed)

- **WHEN** the form was in scenario D and at least one configured candidate slot's date was within 1 hour of the current time
- **THEN** the third line used to render with the same reminder text used for scenario C; it no longer renders under any condition
