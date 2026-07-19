## MODIFIED Requirements

### Requirement: Form blocks submission when the computed deadline is not in the future

The create-activity form SHALL validate, immediately before submission, that the computed report-cutoff time (the value shown and adjustable in the first persistent line) is strictly after the current time, for all four scheduling scenarios. This validation SHALL remain in place regardless of whether the value came from the default algorithm or a manual preset selection, as a safeguard against elapsed time between selection and submission. When this validation fails, the form SHALL display its inline error using the message text, color, and icon specified below, shared with all other inline validation errors on this form.

The inline error message text for this specific failure SHALL read "報名截止時間已經過去，請重新調整活動日期或時間". The inline error container SHALL use the `--bujo-notification` design token for both its border and text color, replacing any hard-coded color value. The inline error container SHALL display an `ExclamationTriangleIcon` (from `@heroicons/vue/24/outline`) instead of an emoji character.

#### Scenario: Computed report-cutoff time is already in the past

- **WHEN** the user submits the form and the computed report-cutoff time resolves to a timestamp at or before the current time
- **THEN** the form SHALL show an inline error reading "報名截止時間已經過去，請重新調整活動日期或時間", styled with the `--bujo-notification` color token and an `ExclamationTriangleIcon`, and SHALL NOT submit the request

#### Scenario: Computed report-cutoff time cannot be resolved

- **WHEN** the user submits the form and the computed report-cutoff time resolves to `null` (e.g. missing anchor date or time)
- **THEN** the form SHALL show an inline error and SHALL NOT submit the request

#### Scenario: Computed report-cutoff time is a valid future time

- **WHEN** the user submits the form and the computed report-cutoff time is strictly after the current time
- **THEN** the form SHALL proceed to the schedule-ceiling proximity check described in "Confirmation gate for near-zero decision buffer" before submitting
