## ADDED Requirements

### Requirement: Create-activity form omits secondary helper text

The create-activity form SHALL NOT display the activity-name character-limit hint, the per-scenario schedule-summary description, or the candidate-date section field labels for scenarios C and D.

#### Scenario: Activity name field has no character-limit hint

- **WHEN** the create-activity form is rendered
- **THEN** the activity-name field SHALL NOT show a "max N characters" hint text below it
- **AND** the activity-name input SHALL NOT reference a removed hint element via `aria-describedby`

#### Scenario: No schedule-summary description for scenarios B, C, or D

- **WHEN** the form's active scenario is B (fixed date, voted time), C (voted dates, fixed time), or D (voted dates, voted time)
- **THEN** the form SHALL NOT display a schedule-summary description text block for that scenario

#### Scenario: Candidate-date section has no field label in scenario C

- **WHEN** the form's active scenario is C (voted dates, fixed time)
- **THEN** the candidate-dates calendar section SHALL NOT display a field label above the month navigation controls
- **AND** the month navigation controls and candidate-date grid SHALL render unchanged

#### Scenario: Candidate-date section has no field label in scenario D

- **WHEN** the form's active scenario is D (voted dates, voted time)
- **THEN** the candidate-dates-and-slots calendar section SHALL NOT display a field label above the month navigation controls
- **AND** the month navigation controls and candidate-date grid SHALL render unchanged
