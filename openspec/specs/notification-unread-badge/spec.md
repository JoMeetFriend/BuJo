# notification-unread-badge Specification

## Purpose

TBD - created by archiving change 'alerts-unread-badge'. Update Purpose after archive.

## Requirements

### Requirement: Sidebar unread notification badge

The system SHALL display an unread notification count badge on the ALERTS navigation icon in both the desktop sidebar and the mobile bottom navigation whenever the unread notification count is greater than zero.

#### Scenario: No unread notifications

- **WHEN** the unread notification count is 0
- **THEN** the ALERTS icon SHALL NOT display a badge

#### Scenario: Has unread notifications

- **WHEN** the unread notification count is greater than 0 and less than or equal to 9
- **THEN** the ALERTS icon SHALL display a badge showing the exact unread count

---
### Requirement: Badge count cap

The system SHALL cap the displayed badge text at "9+" when the unread count exceeds 9, so the badge never grows unbounded.

#### Scenario: More than nine unread notifications

- **WHEN** the unread notification count is 10 or more
- **THEN** the badge SHALL display "9+" instead of the exact number

##### Example: capping boundary

| Unread Count | Badge Text  |
| ------------ | ----------- |
| 0            | (no badge)  |
| 1            | "1"         |
| 9            | "9"         |
| 10           | "9+"        |
| 12           | "9+"        |

---
### Requirement: Unread count synchronization

The system SHALL keep the sidebar's unread badge synchronized with the Alerts page notification state without requiring a full page reload.

#### Scenario: Fetch on app load

- **WHEN** the sidebar component mounts
- **THEN** the system SHALL fetch the current unread notification count from the notifications API

#### Scenario: Mark single notification as read

- **WHEN** a user marks a single notification as read on the Alerts page
- **THEN** the sidebar's unread badge count SHALL decrease by one

#### Scenario: Mark all notifications as read

- **WHEN** a user marks all notifications as read on the Alerts page
- **THEN** the sidebar's unread badge count SHALL become 0 and the badge SHALL disappear

---
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

<!-- @trace
source: refine-alerts-unread-badge
updated: 2026-07-11
code:
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - src/assets/main.css
  - src/components/AppSidebar.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
tests:
  - src/__tests__/AppSidebar.test.js
-->