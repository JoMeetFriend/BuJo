## ADDED Requirements

### Requirement: High-contrast stamp-style unread badge

The system SHALL render the unread notification badge in both the desktop sidebar and mobile bottom navigation with a solid `#b84a43` notification background, white bold monospace text, a minimum width and height of 18 CSS pixels, an off-white boundary matching the surrounding paper surface, and a subtle 2 CSS pixel hard-edged down-right shadow. The badge SHALL remain circular for single-digit counts and SHALL expand horizontally without clipping the `9+` label.

#### Scenario: Desktop unread badge appearance

- **WHEN** the desktop sidebar displays an unread count from 1 through 9
- **THEN** the ALERTS icon SHALL show the count in the high-contrast stamp-style badge at the icon's upper-right corner without covering the envelope body

#### Scenario: Mobile unread badge appearance

- **WHEN** the mobile bottom navigation displays an unread count from 1 through 9
- **THEN** the ALERTS icon SHALL show the same count using the same stamp-style colors, typography, boundary, minimum dimensions, and shadow as the desktop badge

#### Scenario: Capped badge remains legible

- **WHEN** the unread notification count is 10 or greater
- **THEN** both navigation surfaces SHALL display `9+` without clipping, wrapping, or changing the navigation layout
