## Why

Long or unbroken activity titles can break the Activity page card layout: focused cards can expose clipped third-line text, and rail mini cards can overflow their fixed paper-card area. The UI needs both an input-time limit for new titles and display-time protection for existing or externally-created long titles.

## What Changes

- The create activity form shows that activity titles are limited to 15 characters.
- The create activity form trims titles before submit and blocks over-15-character titles before sending the request.
- Focused Activity cards clamp long titles to two visual lines, keep the full title available through native hover/accessibility text, and prevent clipped third-line text from showing below the clamp.
- Activity rail mini cards clamp long titles to two visual lines and keep the full title available through native hover/accessibility text.

## Non-Goals

- Backend validation is tracked separately in BuJoBackend under `activity-title-length-validation`.
- This change does not modify scheduling, join, deadline, participant, status, or activity payload shape beyond using the trimmed title string.
- This change does not migrate or rewrite existing activity titles.

## Capabilities

### New Capabilities

- `activity-title-length`: Activity title input limits and Activity page card title display containment.

### Modified Capabilities

- None.

## Impact

- `src/components/EventPage.vue`
- `src/components/ActivityDetailModal.vue`
- `src/components/ActivityView.vue`
- `src/__tests__/EventPage.test.js`
- `src/__tests__/ActivityDetailModal.test.js`
- `src/__tests__/ActivityView.test.js`
