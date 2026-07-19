## ADDED Requirements

### Requirement: Event form limits new activity titles to 15 characters

The create activity form SHALL guide and enforce that newly submitted activity titles are at most 15 characters after trimming leading and trailing whitespace.

#### Scenario: Title length guidance is visible

- **WHEN** the create activity form is open
- **THEN** the activity name field SHALL indicate that the maximum title length is 15 characters

#### Scenario: Overlong title is blocked before submission

- **WHEN** the user attempts to submit an activity title longer than 15 characters after trimming
- **THEN** the frontend SHALL show a validation error
- **AND** it SHALL NOT send the create activity request

### Requirement: Activity cards protect layout from long existing titles

Activity card titles SHALL render no more than two visual lines and SHALL prevent unbroken title strings from overflowing the card.

#### Scenario: Focused activity card title is contained

- **WHEN** a focused activity card receives a long title
- **THEN** the rendered title SHALL be visually clamped to two lines
- **AND** the full title SHALL remain available as accessible or hover text

#### Scenario: Focused activity card clamp does not expose a third line

- **WHEN** a focused activity card title is visually clamped to two lines
- **THEN** no clipped glyphs from the third visual line SHALL be visible below the clamped title area

#### Scenario: Activity rail title is contained

- **WHEN** a mini activity card receives a long title
- **THEN** the rendered title SHALL be visually clamped to two lines
- **AND** the full title SHALL remain available as accessible or hover text
