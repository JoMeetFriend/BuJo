## MODIFIED Requirements

### Requirement: Form blocks submission when the computed deadline is not in the future

The create-activity form SHALL validate, immediately before submission, that the computed report-cutoff time (the value shown and adjustable in the first persistent line) is strictly after the current time, for all four scheduling scenarios. This validation SHALL remain in place regardless of whether the value came from the default algorithm or a manual preset selection, as a safeguard against elapsed time between selection and submission. The inline error shown for this validation failure SHALL use the `--bujo-danger` design token for its border and text color, not `--bujo-notification`.

#### Scenario: Computed report-cutoff time is already in the past

- **WHEN** the user submits the form and the computed report-cutoff time resolves to a timestamp at or before the current time
- **THEN** the form SHALL show an inline error asking the user to adjust the deadline settings or schedule, styled with the `--bujo-danger` color token, and SHALL NOT submit the request

#### Scenario: Computed report-cutoff time cannot be resolved

- **WHEN** the user submits the form and the computed report-cutoff time resolves to `null` (e.g. missing anchor date or time)
- **THEN** the form SHALL show an inline error and SHALL NOT submit the request

#### Scenario: Computed report-cutoff time is a valid future time

- **WHEN** the user submits the form and the computed report-cutoff time is strictly after the current time
- **THEN** the form SHALL proceed to the schedule-ceiling proximity check described in "Confirmation gate for near-zero decision buffer" before submitting
