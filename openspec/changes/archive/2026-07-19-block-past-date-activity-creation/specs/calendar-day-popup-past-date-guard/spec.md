## ADDED Requirements

### Requirement: Date popup hides the add-activity entry point for past dates

The date-events popup (`DateEventsModal.vue`) SHALL NOT render an add-activity control for any date strictly before today, in either its populated state (the date already has activities) or its empty state (the date has no activities). The control SHALL render normally, unchanged from prior behavior, for today or any future date.

#### Scenario: Add control is absent for a past date with existing activities

- **WHEN** the date-events popup is opened for a date strictly before today that already has one or more activities
- **THEN** the header add-activity control SHALL NOT be rendered, and the close control SHALL remain rendered

#### Scenario: Add control is absent for a past date with no activities

- **WHEN** the date-events popup is opened for a date strictly before today that has no activities
- **THEN** the empty-state add-activity control SHALL NOT be rendered

#### Scenario: Add control renders normally for today or a future date

- **WHEN** the date-events popup is opened for today's date or any future date, regardless of whether it has activities
- **THEN** the appropriate add-activity control (header or empty-state) SHALL render and SHALL emit an `add` event carrying that date when activated

### Requirement: Empty-state wording distinguishes past dates from today/future dates

The date-events popup's empty-state message SHALL read "這天沒有行程" when the popup's date is strictly before today, and SHALL read "這天還沒有行程" when the popup's date is today or a future date.

#### Scenario: Past date empty state uses past-tense wording

- **WHEN** the date-events popup is opened for a date strictly before today with no activities
- **THEN** the empty-state message SHALL read "這天沒有行程"

#### Scenario: Today or future date empty state uses existing wording

- **WHEN** the date-events popup is opened for today's date or a future date with no activities
- **THEN** the empty-state message SHALL read "這天還沒有行程"

### Requirement: Create-activity form does not apply a past initial date

The create-activity form (`EventPage.vue`) SHALL NOT apply an externally supplied initial date to its scenario-A date fields (`startDate`, `endDate`, `singleDate`) or switch its date/time mode when that supplied date is strictly before today. The form SHALL leave its existing default date (today) in place in that case. When the supplied initial date is today or a future date, the form SHALL apply it exactly as before (switching to scenario A and populating the date fields).

#### Scenario: Past initial date is not applied

- **WHEN** the create-activity form opens with an initial date strictly before today
- **THEN** `form.startDate`, `form.endDate`, and `form.singleDate` SHALL remain at their existing default value, and `dateMode`/`timeMode` SHALL NOT be changed by this initial date

#### Scenario: Today or future initial date is applied as before

- **WHEN** the create-activity form opens with an initial date that is today or a future date
- **THEN** `dateMode` and `timeMode` SHALL switch to `'fixed'`, and `form.startDate`, `form.endDate`, and `form.singleDate` SHALL all be set to that date
