## MODIFIED Requirements

### Requirement: Activity notification click navigates to the referenced activity

The alerts page SHALL, when a notification whose `reference.type` is `"activity"` and whose `reference.id` is present is activated by a normal pointer click, Enter, or Space, mark the notification as read and navigate to the activity page route `/activity` with query parameter `focus` set to the string form of `reference.id`. A failure of the mark-as-read request MUST NOT block the navigation. Notifications without an activity reference SHALL keep the existing activation behavior of marking as read without navigation. A one-time pointer click guard armed by a horizontal drag SHALL apply before pointer-click activation and SHALL be consumed when it blocks that click. The pointer click guard MUST NOT block Enter or Space activation.

#### Scenario: Click an activity notification

- **WHEN** a user clicks a notification with `reference: { type: "activity", id: 42, status: "voting" }` without an armed pointer click guard
- **THEN** the client marks the notification as read and navigates to `/activity?focus=42`

#### Scenario: Mark-as-read fails but navigation proceeds

- **WHEN** a user activates an activity notification and the mark-as-read request fails
- **THEN** the client still navigates to `/activity?focus=<id>`

#### Scenario: Click a non-activity notification

- **WHEN** a user clicks a notification whose `reference` is absent or whose `reference.type` is not `"activity"`
- **THEN** the client marks it as read and does not navigate

#### Scenario: Pointer click suppressed after a horizontal drag

- **WHEN** a pointer-generated click lands on an activity notification while its one-time pointer click guard is armed
- **THEN** the client consumes the guard and neither marks the notification as read nor navigates

#### Scenario: Enter bypasses pointer click guard

- **WHEN** an activity notification has an armed pointer click guard and the user activates it with Enter
- **THEN** the client marks the notification as read and navigates to its activity focus route

#### Scenario: Space bypasses pointer click guard

- **WHEN** an activity notification has an armed pointer click guard and the user activates it with Space
- **THEN** the client marks the notification as read and navigates to its activity focus route
