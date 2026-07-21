# mobile-calendar-cell-density Specification

## Purpose

TBD - created by archiving change 'improve-mobile-calendar-cell-density'. Update Purpose after archive.

## Requirements

### Requirement: Compact mobile calendar cell content

At viewport widths of 640px or less, the calendar SHALL display the earliest activity title as a single truncated line in each populated date cell and SHALL position the additional-activity count in the top-right date area without covering the event row. The additional-activity count SHALL use the existing `+N` value, where N is the number of activities after the earliest displayed activity.

#### Scenario: Date contains multiple activities

- **WHEN** a date contains two or more activities at a viewport width of 640px or less
- **THEN** the earliest activity remains the only title displayed in the cell
- **AND** the top-right area displays `+N` for all remaining activities
- **AND** the count does not cover the activity title row

#### Scenario: Date contains one activity

- **WHEN** a date contains exactly one activity at a viewport width of 640px or less
- **THEN** the cell displays that activity title as a single truncated line
- **AND** no additional-activity count is displayed


<!-- @trace
source: improve-mobile-calendar-cell-density
updated: 2026-07-20
code:
  - src/components/EventPage.vue
  - src/components/CalendarMain.vue
  - src/components/ui/BaseModal.vue
tests:
  - src/__tests__/BaseModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
-->

---
### Requirement: Mobile density changes preserve calendar contracts

The compact presentation SHALL NOT increase the calendar height, add horizontal calendar scrolling, change the current-date marker, alter activity status colors, or change date-cell click and keyboard behavior. Viewports wider than 640px SHALL retain the existing calendar cell presentation.

#### Scenario: User opens a populated mobile date

- **WHEN** the user activates a populated date cell by click, Enter, or Space
- **THEN** the calendar opens the complete activity list for that date

#### Scenario: Calendar renders outside the phone breakpoint

- **WHEN** the viewport width is greater than 640px
- **THEN** the existing tablet and desktop date-cell layout remains unchanged

<!-- @trace
source: improve-mobile-calendar-cell-density
updated: 2026-07-20
code:
  - src/components/EventPage.vue
  - src/components/CalendarMain.vue
  - src/components/ui/BaseModal.vue
tests:
  - src/__tests__/BaseModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
-->