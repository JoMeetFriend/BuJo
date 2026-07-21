# activity-page-responsive-layout Specification

## Purpose

TBD - created by archiving change 'fix-activity-page-short-screen-overflow'. Update Purpose after archive.

## Requirements

### Requirement: Mobile activity detail respects the stage height

The activity index page SHALL constrain the featured activity detail card to the height available in the middle stage when the viewport width is 900px or less. The detail card MUST NOT impose a fixed maximum-height floor that exceeds the stage height.

#### Scenario: Short mobile viewport

- **WHEN** the activity index is displayed at a viewport width of 900px or less and the stage is shorter than the detail content
- **THEN** the detail card remains within the stage height and does not cover the activity card rail


<!-- @trace
source: fix-activity-page-short-screen-overflow
updated: 2026-07-20
code:
  - src/components/ActivityDetailModal.vue
  - src/components/ActivityView.vue
tests:
  - src/__tests__/ActivityView.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Overflowing detail content remains accessible

The activity detail card SHALL keep its header and footer inside the constrained card and SHALL provide vertical scrolling in its body when the content exceeds the available height.

#### Scenario: Detail content exceeds constrained height

- **WHEN** activity details require more vertical space than the constrained mobile card provides
- **THEN** the detail body can scroll vertically while the page remains within the viewport


<!-- @trace
source: fix-activity-page-short-screen-overflow
updated: 2026-07-20
code:
  - src/components/ActivityDetailModal.vue
  - src/components/ActivityView.vue
tests:
  - src/__tests__/ActivityView.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->

---
### Requirement: Short screens reduce decorative vertical spacing

The activity index page SHALL reduce decorative stage padding and activity rail separation when the viewport is both mobile-width and 700px tall or less. Activity filtering and activity selection controls SHALL remain visible.

#### Scenario: Mobile viewport at most 700px tall

- **WHEN** the activity index is displayed at a viewport width of 900px or less and a viewport height of 700px or less
- **THEN** the stage padding and rail separation use compact values without hiding activity controls

<!-- @trace
source: fix-activity-page-short-screen-overflow
updated: 2026-07-20
code:
  - src/components/ActivityDetailModal.vue
  - src/components/ActivityView.vue
tests:
  - src/__tests__/ActivityView.test.js
  - src/__tests__/ActivityDetailModal.test.js
-->