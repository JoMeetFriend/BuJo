## REMOVED Requirements

### Requirement: Optional time window in scenario B creation form

**Reason**: Under the redesigned deadline model, scenario B's schedule ceiling (the fixed, non-adjustable point at which the system auto-cancels the activity if the creator has not manually confirmed) is anchored on `fixed_date` plus the time window's start time. If the time window is left unset, this anchor has no meaningful value to resolve to (it would fall back to an arbitrary default, such as midnight of `fixed_date`, which for a same-day activity is already in the past by definition). The time window is therefore promoted from optional to required so the schedule ceiling always has a well-defined anchor.
**Migration**: No data migration needed — this only affects the create-activity form's client-side validation for newly-created activities. Existing scenario B activities that were created without a time window are unaffected by this change.

## ADDED Requirements

### Requirement: Time window is required in scenario B creation form

The activity creation form SHALL require the creator, when date is fixed and time is open ("讓大家選"), to set both a start and end time for the time window before the form can be submitted, using the same immediate inline-validation pattern as scenario A's required start-time field (`timeError`-style: inline error shown immediately, submission blocked, and the view scrolled to the relevant field). The form SHALL NOT allow submission with the time window left entirely unset.

#### Scenario: Creator leaves the time window entirely unset

- **WHEN** the creator attempts to submit the form in scenario B without setting either a start or end time for the time window
- **THEN** the form SHALL show an inline validation error on the time window field and SHALL NOT submit the request

#### Scenario: Creator sets a partial time window

- **WHEN** the creator sets only one of start/end time for the time window
- **THEN** the form SHALL show a validation error and SHALL NOT submit the form

#### Scenario: Creator sets an invalid time window

- **WHEN** the creator sets an end time that is not later than the start time
- **THEN** the form SHALL show a validation error and SHALL NOT submit the form

#### Scenario: Creator sets a complete, valid time window

- **WHEN** the creator sets both a start and end time, with end strictly after start
- **THEN** the form SHALL accept the time window and proceed with submission (subject to the other deadline validations described in the `activity-deadline-validation` capability)
