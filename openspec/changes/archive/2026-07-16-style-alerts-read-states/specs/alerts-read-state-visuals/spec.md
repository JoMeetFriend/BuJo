## ADDED Requirements

### Requirement: Read and unread notifications have distinct square visual states

The Alerts page SHALL render unread notifications with an accent-tinted paper background, accent border and icon, emphasized ink message text, and a non-interactive unread indicator. The page SHALL render read notifications with the standard paper surface, line border, muted icon, less emphasized message text, and no unread indicator. Notification items and unread indicators MUST remain square and MUST NOT add rounded corners.

#### Scenario: Mixed read states are rendered

- **WHEN** the notification list contains one unread notification and one read notification
- **THEN** only the unread notification SHALL use the unread row state and render the unread indicator
- **THEN** the read notification SHALL use the muted icon and message state without an unread indicator

### Requirement: Marking a notification read updates its visual state

The Alerts page SHALL derive every read-state visual from the existing `notification.isRead` value. When the existing mark-as-read action succeeds, the row SHALL transition its background, border, message color, and icon colors over 450 milliseconds, and the unread indicator SHALL be removed. The state change MUST NOT introduce translation, scale, or shadow animation.

#### Scenario: User marks an unread notification as read

- **WHEN** the user activates an unread notification and the mark-as-read request succeeds
- **THEN** the row SHALL lose its unread state and unread indicator
- **THEN** the existing notification click behavior SHALL otherwise remain unchanged

### Requirement: Unread indicator motion respects reduced motion

The unread indicator SHALL be a 9 pixel non-interactive accent square with an opacity pulse lasting 2.4 seconds. The indicator MUST be hidden from assistive technology. When `prefers-reduced-motion: reduce` is active, the indicator SHALL remain visible without animation.

#### Scenario: Reduced motion is requested

- **WHEN** an unread notification is rendered while the user agent reports `prefers-reduced-motion: reduce`
- **THEN** the unread indicator SHALL remain visible and SHALL NOT pulse
