## Context

`CalendarMain` renders a fixed seven-column grid. Below 640px each date cell is narrow, while the first event chip fills the event row and `.calendar-more-count` is absolutely positioned at the bottom right. On dates with multiple activities the count competes with the title. The component already truncates the first title and opens the full date list when the cell is activated.

## Goals / Non-Goals

**Goals:**

- Give the first event title more usable horizontal space on phones.
- Keep the additional-event count visible without covering the event row.
- Preserve six-week grid height, date interaction, status colors and current-date semantics.

**Non-Goals:**

- Changing activity fetching, sorting, filtering or response data.
- Increasing calendar height, adding horizontal calendar scrolling, or changing tablet/desktop layout.
- Changing the mobile UPCOMING cards or any modal behavior.

## Decisions

### Move the mobile additional-event count to the date corner

At 640px and below, override `.calendar-more-count` with `top: 4px`, `right: 4px`, `bottom: auto`, `font-size: 8px`, `line-height: 1` and zero padding. The existing element and `+N` calculation remain unchanged. This reuses the free date-header corner rather than adding a new row or changing the DOM.

Alternative rejected: hiding `+N` removes useful density information. Keeping it at the bottom continues the overlap. Increasing row height moves the mobile upcoming section down and violates the fixed-height constraint.

### Reduce horizontal chrome without reducing title text

At 640px and below, set the event-list horizontal padding to 2px. Keep the chip title at 10px and one-line truncation, while changing the chip to a 4px dot column, 3px gap and `1px 3px` padding; set the dot to 4px square. This returns width to the title without making the text smaller.

Alternative rejected: hiding the title makes users open every date to identify an activity. A horizontal-scrolling calendar weakens the monthly overview.

### Preserve existing responsive and interaction contracts

All overrides live inside the existing `max-width: 640px` media query. Above 640px the current count and chip styles remain unchanged. The date container markup, 20px mobile current-date marker, single-event count omission, first-event selection and date-cell click/keyboard handlers remain unchanged.

## Implementation Contract

- **Behavior:** On viewports at or below 640px, a multi-event date displays its day number and compact `+N` in the top area, and the earliest activity title occupies the event row without being covered by the count. A single-event date displays no `+N`.
- **Interface / data shape:** No component prop, event, API, activity object or route contract changes. Existing `.calendar-event-chip`, `.calendar-event-list` and `.calendar-more-count` hooks remain available.
- **Failure modes:** Long titles remain one-line truncated. Extremely narrow cells remain clipped within their own cell and MUST NOT create horizontal calendar scrolling or overflow into adjacent dates.
- **Acceptance criteria:** CalendarMain behavior tests prove earliest-event and `+N` semantics plus date-list opening; raw SFC assertions lock the 640px positioning and compact dimensions; focused Vitest, lint, format, build and `git diff --check` pass; 390×844, 375×667 and 320×568 visual checks show no overlap.
- **Scope boundaries:** Only mobile date-cell presentation and its tests are in scope. Existing uncommitted UPCOMING-card and modal changes MUST remain byte-for-byte unchanged outside the new date-cell hunks.

## Risks / Trade-offs

- [Risk] A top-right count can approach a two-digit date on very narrow cells. → Mitigation: use 8px text, no padding and verify at 320px width while preserving the 20px today marker.
- [Risk] CSS source assertions can be brittle after formatting. → Mitigation: assert scoped declarations within the 640px media block instead of a full-file string.
