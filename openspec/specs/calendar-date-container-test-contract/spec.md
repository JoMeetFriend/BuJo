# calendar-date-container-test-contract Specification

## Purpose

TBD - created by archiving change 'fix-calendar-date-container-test'. Update Purpose after archive.

## Requirements

### Requirement: Calendar date container test matches the implemented class contract

The CalendarMain component test SHALL assert that the date-number container class is exactly `w-full p-1 leading-none md:p-1.5`. The test MUST retain verification of the date container class and MUST NOT require changes to CalendarMain component markup or styles.

#### Scenario: Current date container class is rendered

- **WHEN** CalendarMain source contains the date-number container
- **THEN** the component test accepts `class="w-full p-1 leading-none md:p-1.5"` and does not expect the obsolete class string without `leading-none`

<!-- @trace
source: fix-calendar-date-container-test
updated: 2026-07-12
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/CalendarMain.test.js
-->