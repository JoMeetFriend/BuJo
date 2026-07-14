## 1. EventPage switch UI

- [x] 1.1 Deliver `Event form schedule modes use textless switches` in `src/components/EventPage.vue`: the date and time mode rows render question label, current hint, and textless switch controls; verify by `npm run test:run -- src/__tests__/EventPage.test.js` default-state assertions
- [x] 1.2 Deliver `Mode switches expose accessible switch semantics` in `src/components/EventPage.vue`: each mode switch exposes switch-like checked state, accessible name, and hover/active/focus-visible feedback; verify by EventPage switch accessibility assertions and stylesheet review

## 2. Copy and behavior

- [x] 2.1 Deliver `Mode hints and summary copy match selected modes`: all four dateMode/timeMode combinations show the agreed short hints and summary copy with no full stop punctuation; verify by EventPage tests for default, each toggle state, both-off state, and copy punctuation assertions
- [x] 2.2 Deliver `Mode switch UI remains a frontend-only replacement`: switching controls still drives existing `dateMode` and `timeMode` branches without changing payload/API/deadline/core creation logic; verify by reviewing the EventPage diff and running `npm run build`

## 3. Modern Paper visual hierarchy

- [x] 3.1 Deliver `Schedule mode area follows Modern Paper visual hierarchy` in `src/components/EventPage.vue`: the schedule mode area avoids generic soft-card treatment while keeping the picker visually stronger than helper text; verify by visual review of the EventPage diff and `npm run build`
- [x] 3.2 Deliver `BuJo visual source of truth remains active v1` in `BuJo_Visual_Specification_v1.md`, `AGENTS.md`, and `src/components/ui/PixelButton.vue`: future UI work points to the v1 Modern Paper correction instead of a separate v2 spec; verify by searching for `bujo-visual-specification-v2` and confirming no references remain

## 4. Activity limit input guidance

- [x] 4.1 Deliver `Activity limit input explains creator inclusion` in `src/components/EventPage.vue`: the activity limit label shows `含自己` so creators know the limit includes them; verify by EventPage rendered text review
- [x] 4.2 Deliver `Activity limit input enforces minimum of two when limited` in `src/components/EventPage.vue`: empty limit remains unlimited, while manually entered values below 2 store `2`; verify by `npm run test:run -- src/__tests__/EventPage.test.js` limit-input assertions

## 5. Verification

- [x] 5.1 Verify the completed change with `npm run test:run -- src/__tests__/EventPage.test.js`, `npm run build`, and `git diff --check`; completion means EventPage tests pass, production build succeeds, and the diff has no whitespace errors
