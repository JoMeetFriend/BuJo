## ADDED Requirements

### Requirement: Compact current-date marker

The calendar SHALL identify the current date with a compact muted-red circle behind the day number. The marker SHALL NOT display an adjacent suffix or label. Every day number SHALL use equal horizontal and vertical date-header padding: 4px below the desktop breakpoint and 6px at the desktop breakpoint. The current-day number SHALL retain the same font size and position as every other day number. The marker diameter SHALL be 20px below the desktop breakpoint and 22px at the desktop breakpoint. The current-date cell SHALL NOT use a dedicated full-cell background or inset outline, and its existing event content and interaction behavior SHALL remain unchanged.

#### Scenario: Current date is displayed

- **WHEN** the visible calendar month contains the current local date
- **THEN** exactly one date cell displays a muted-red circle behind its day number without an adjacent suffix or label
- **AND** the current-day number uses the same font size and date-header position as other day numbers
- **AND** the date header has equal horizontal and vertical padding for the active viewport breakpoint
- **AND** that cell does not receive a current-date-specific full-cell fill or inset outline

#### Scenario: Responsive marker sizing

- **WHEN** the calendar is displayed below the desktop breakpoint
- **THEN** the current-date marker diameter is 20px and the date-header padding is 4px on every side
- **WHEN** the calendar is displayed at the desktop breakpoint or wider
- **THEN** the current-date marker diameter is 22px and the date-header padding is 6px on every side

#### Scenario: Other dates are displayed

- **WHEN** a date cell does not represent the current local date
- **THEN** it displays the normal day number without the current-date circle

### Requirement: Current-date semantics

The calendar SHALL expose the current date through the standard `aria-current="date"` semantic on the current-date cell and SHALL omit that semantic from all other date cells.

#### Scenario: Assistive technology reads the current date

- **WHEN** the visible calendar month contains the current local date
- **THEN** exactly one date cell has `aria-current="date"`
