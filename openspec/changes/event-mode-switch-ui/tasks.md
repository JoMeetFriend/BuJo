## 1. EventPage switch UI

- [x] 1.1 Deliver `Event form schedule modes use textless switches` in `src/components/EventPage.vue`: the date and time mode rows render question label, current hint, and textless switch controls; verify by `npm run test:run -- src/__tests__/EventPage.test.js` default-state assertions
- [x] 1.2 Deliver `Mode switches expose accessible switch semantics` in `src/components/EventPage.vue`: each mode switch exposes switch-like checked state, accessible name, and hover/active/focus-visible feedback; verify by EventPage switch accessibility assertions and stylesheet review

## 2. Copy and behavior

- [x] 2.1 Deliver `Mode hints and summary copy match selected modes`: all four dateMode/timeMode combinations show the agreed short hints and summary copy with no full stop punctuation; verify by EventPage tests for default, each toggle state, both-off state, and copy punctuation assertions
- [x] 2.2 Deliver `Mode switch UI remains a frontend-only replacement`: switching controls still drives existing `dateMode` and `timeMode` branches without changing payload/API/deadline/core creation logic; verify by reviewing the EventPage diff and running `npm run build`
