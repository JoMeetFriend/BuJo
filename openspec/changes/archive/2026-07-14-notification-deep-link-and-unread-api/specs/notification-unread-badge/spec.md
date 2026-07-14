## MODIFIED Requirements

### Requirement: Unread count synchronization

The system SHALL keep the sidebar's unread badge synchronized with the Alerts page notification state without requiring a full page reload. The unread count SHALL be fetched from the dedicated endpoint `GET /api/notifications/unread-count`, whose response body is `{ "unreadCount": <integer> }`; the client SHALL NOT fetch the full notification list solely to compute the unread count. In addition to the initial fetch on mount, the system SHALL refetch the unread count when the browser tab becomes visible again and when the in-app route changes. When an unread-count request fails, the badge SHALL keep its previous value and no error UI SHALL be shown.

#### Scenario: Fetch on app load

- **WHEN** the sidebar component mounts
- **THEN** the system SHALL fetch the current unread notification count from `GET /api/notifications/unread-count` and display it on the badge

#### Scenario: Tab becomes visible again

- **WHEN** the document `visibilitychange` event fires and the document visibility state is `visible`
- **THEN** the system SHALL refetch the unread count from `GET /api/notifications/unread-count`

#### Scenario: In-app route navigation

- **WHEN** the user navigates to a different route inside the app
- **THEN** the system SHALL refetch the unread count from `GET /api/notifications/unread-count`

#### Scenario: Unread-count request fails

- **WHEN** the unread-count request fails (including HTTP 401)
- **THEN** the badge SHALL keep its previous value and no error UI SHALL be shown

#### Scenario: Mark single notification as read

- **WHEN** a user marks a single notification as read on the Alerts page
- **THEN** the sidebar's unread badge count SHALL decrease by one

#### Scenario: Mark all notifications as read

- **WHEN** a user marks all notifications as read on the Alerts page
- **THEN** the sidebar's unread badge count SHALL become 0 and the badge SHALL disappear
