## ADDED Requirements

### Requirement: Sidebar unread notification badge

The system SHALL display an unread notification count badge on the ALERTS navigation icon in both the desktop sidebar and the mobile bottom navigation whenever the unread notification count is greater than zero.

#### Scenario: No unread notifications

- **WHEN** the unread notification count is 0
- **THEN** the ALERTS icon SHALL NOT display a badge

#### Scenario: Has unread notifications

- **WHEN** the unread notification count is greater than 0 and less than or equal to 9
- **THEN** the ALERTS icon SHALL display a badge showing the exact unread count

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
