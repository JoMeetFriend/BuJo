## ADDED Requirements

### Requirement: AvailabilityPickerModal disables calendar date cells whose entire candidate window has already elapsed

In addition to the existing hour-level filtering within an already-active date's time picker, `AvailabilityPickerModal`'s calendar SHALL determine, per date cell, whether that date's entire candidate window has already fully elapsed relative to the current time, and SHALL disable the cell if so. The window boundary used for this check SHALL be, in priority order: that date's entry in `dateWindows[date].end` when present (scenario D per-date window); otherwise the later of the global `timeWindowStart`/`timeWindowEnd` props when either is present (scenario B/C); otherwise 23:59 of that date (when no window constraint applies at all).

A disabled date cell SHALL NOT respond to click/drag selection (no selection state change occurs), SHALL receive a reduced-opacity visual treatment, and SHALL additionally display a non-color indicator (e.g. a strikethrough on the date number or a small corner icon) rather than relying on opacity/color alone, because the calendar cell has no room for a text label.

#### Scenario: A fully-elapsed scenario D candidate date is disabled

- **WHEN** a date's `dateWindows[date].end` is before the current time
- **THEN** that date's calendar cell SHALL be disabled, non-interactive, and display the non-color expiration indicator

#### Scenario: A fully-elapsed scenario B/C candidate date is disabled

- **WHEN** a date has no per-date `dateWindows` entry, but the later of the global `timeWindowStart`/`timeWindowEnd` is before the current time for that date
- **THEN** that date's calendar cell SHALL be disabled, non-interactive, and display the non-color expiration indicator

#### Scenario: A date with no window constraint uses 23:59 as its elapsed boundary

- **WHEN** a date has neither a `dateWindows` entry nor a global time window constraint
- **THEN** that date's calendar cell SHALL be disabled only once 23:59 of that date has passed, not merely because the current hour is late

#### Scenario: A future date remains fully selectable

- **WHEN** a date's relevant window boundary (per the priority order above) is at or after the current time
- **THEN** that date's calendar cell SHALL remain selectable exactly as it does today, unaffected by this requirement

#### Scenario: Disabling is independent of color alone

- **WHEN** a date cell is disabled per this requirement
- **THEN** the visual treatment SHALL include a non-color indicator in addition to any opacity/color change, so the disabled state remains perceivable without relying on color differentiation

##### Example: window boundary resolution by scenario

| Scenario | `dateWindows[date]` present? | Global `timeWindowStart`/`timeWindowEnd` present? | Boundary used |
| --- | --- | --- | --- |
| D | yes | (ignored) | `dateWindows[date].end` |
| B/C | no | yes | later of `timeWindowStart`/`timeWindowEnd` |
| B/C (no window set) | no | no | 23:59 of that date |
