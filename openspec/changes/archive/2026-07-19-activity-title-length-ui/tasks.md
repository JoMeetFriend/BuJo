# Tasks

## 1. Frontend Title Input Limit

- [x] Add EventPage activity name 15-character guidance and validation.

## 2. Activity Card Title Containment

- [x] Clamp ActivityDetailModal focused-card titles to two lines.
- [x] Clamp ActivityView mini-card titles to two lines.
- [x] Prevent the Activity cards protect layout from long existing titles behavior from exposing clipped third-line title text; verified by `npm run build` and targeted Activity card tests.

## 3. Verification

- [x] Update frontend tests for title limit and title accessibility.
- [x] Verify Requirement: Event form limits new activity titles to 15 characters with `src/__tests__/EventPage.test.js`.
- [x] Verify Requirement: Activity cards protect layout from long existing titles with `src/__tests__/ActivityDetailModal.test.js` and `src/__tests__/ActivityView.test.js`.
- [x] Run targeted frontend tests and build.
