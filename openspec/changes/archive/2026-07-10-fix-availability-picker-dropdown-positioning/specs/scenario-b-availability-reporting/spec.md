## ADDED Requirements

### Requirement: Time picker dropdown stays within the modal card bounds

When a time-of-day dropdown panel is opened inside the availability picker modal, the system SHALL position and size the dropdown panel relative to the modal card's own bounding rectangle, not the browser viewport, so the panel never extends beyond the visible edge of the modal card.

#### Scenario: Dropdown flips upward when there is not enough room below inside the modal card

- **WHEN** a user opens a start-time or end-time dropdown whose trigger button is near the bottom of the modal card
- **THEN** the dropdown panel SHALL open upward (anchored by `bottom`, not `top`) so its options remain within the modal card's visible area

#### Scenario: Dropdown is clamped horizontally to the modal card's left/right edges

- **WHEN** a user opens a dropdown whose trigger button is near the right edge of the modal card
- **THEN** the dropdown panel's horizontal position SHALL be clamped so it does not extend past the modal card's right edge

### Requirement: Scrolling inside the time picker dropdown does not close it

The system SHALL distinguish scroll events that originate inside the open dropdown's own option list from scroll events elsewhere, and SHALL only close the dropdown for the latter.

#### Scenario: Scrolling the dropdown's own option list keeps it open

- **WHEN** a user scrolls within the currently open dropdown panel's option list
- **THEN** the dropdown SHALL remain open

#### Scenario: Scrolling outside the dropdown closes it

- **WHEN** a user scrolls any part of the page or modal outside the currently open dropdown panel
- **THEN** the dropdown SHALL close

### Requirement: Availability picker restores its default state when reopened

For a fixed-date availability picker (no calendar available to re-select a date), closing and reopening the modal SHALL restore the same default time selection it showed on first mount, not an empty unselected state.

#### Scenario: Reopening a fixed-date picker after closing shows the original default time range

- **WHEN** a user opens a fixed-date availability picker, closes it (via the close button), and reopens it
- **THEN** the picker SHALL show the same default date and time selection as when it was first opened (respecting the activity's configured time window), rather than a blank "select a date" placeholder
