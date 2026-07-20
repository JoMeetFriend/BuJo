## ADDED Requirements

### Requirement: Scenario C and D do not auto-populate a default candidate date on entry

Switching the create-activity form's active scenario to scenario C (candidate dates with a uniform time) or scenario D (candidate dates each with their own time slots) SHALL NOT automatically add a candidate date or candidate slot when the candidate list is currently empty. The candidate list SHALL remain empty until the user explicitly selects a date through the calendar grid.

#### Scenario: Switching to scenario C with no candidate dates leaves the list empty

- **WHEN** the user switches the form to scenario C and no candidate dates have been selected yet
- **THEN** the candidate-dates list SHALL remain empty
- **AND** the form SHALL NOT insert any date into the candidate-dates list on the user's behalf

#### Scenario: Switching to scenario D with no candidate slots leaves the list empty

- **WHEN** the user switches the form to scenario D and no candidate slots have been configured yet
- **THEN** the candidate-slots list SHALL remain empty
- **AND** the form SHALL NOT insert any date or time slot into the candidate-slots list on the user's behalf

#### Scenario: Existing candidate selections are left untouched when re-entering a scenario

- **WHEN** the user switches away from scenario C or D and back again, and the candidate list already contains at least one entry
- **THEN** the existing candidate-dates or candidate-slots entries SHALL remain unchanged
