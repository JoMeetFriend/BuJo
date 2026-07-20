## ADDED Requirements

### Requirement: Create-activity modal preserves mobile navigation space

The create-activity form modal SHALL reserve 62px at the bottom of the viewport when the viewport width is 640px or less. The modal overlay and footer MUST NOT overlap that reserved area.

#### Scenario: Create-activity form on a mobile viewport

- **WHEN** the create-activity form is open at a viewport width of 640px or less
- **THEN** the modal overlay ends 62px above the viewport bottom and the mobile navigation remains fully visible

### Requirement: Reserved mobile navigation remains interactive

The reserved mobile navigation area SHALL remain outside the create-activity modal overlay and SHALL accept navigation input while the form is open.

#### Scenario: User leaves the create flow through mobile navigation

- **WHEN** the create-activity form is open on mobile and the user activates a bottom navigation item
- **THEN** the navigation action is not intercepted by the modal overlay

### Requirement: Mobile navigation reservation is opt-in

The shared modal SHALL expose an optional boolean reservation control that defaults to disabled. Only the primary create-activity form SHALL enable the reservation; subsequent confirmation dialogs and unrelated shared modals SHALL retain full-viewport overlay behavior.

#### Scenario: Shared modal does not opt in

- **WHEN** a shared modal is rendered without the reservation control
- **THEN** its overlay retains the existing full-viewport geometry

### Requirement: Long create-activity form remains accessible

The create-activity modal SHALL retain a vertically scrollable body and fixed header and footer when mobile navigation space is reserved.

#### Scenario: Form content exceeds the reduced modal height

- **WHEN** the create-activity form content is taller than the modal area above the navigation
- **THEN** the body scrolls vertically while the header and footer remain inside the modal above the navigation
