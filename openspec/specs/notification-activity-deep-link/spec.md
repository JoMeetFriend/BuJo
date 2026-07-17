# notification-activity-deep-link Specification

## Purpose

TBD - created by archiving change 'notification-deep-link-and-unread-api'. Update Purpose after archive.

## Requirements

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


<!-- @trace
source: fix-notification-swipe-click-through
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->

---
### Requirement: Activity page focuses the activity given by the focus query parameter

The activity page SHALL, on mount, read the `focus` query parameter and, when present, select the activity whose id equals the string-normalized `focus` value as the featured activity so its detail view is displayed. Both the notification side and the activity page side MUST normalize the id with string conversion before comparison, because the backend reference id can be an integer. When the `focus` value does not match any activity in the fetched list, the page SHALL fall back to the default featured selection (first activity of the current filter) without showing an error. The query parameter SHALL be read once on mount and SHALL NOT be cleared from the URL, so the link remains shareable and reload-safe.

#### Scenario: Deep link to an existing activity

- **WHEN** the activity page is opened at `/activity?focus=42` and activity `42` is in the fetched activity list
- **THEN** activity `42` becomes the featured activity and its detail view is displayed

#### Scenario: Focus target not in the list

- **WHEN** the activity page is opened at `/activity?focus=999` and no fetched activity has id `999`
- **THEN** the page displays the default featured activity without an error message

#### Scenario: No focus parameter

- **WHEN** the activity page is opened at `/activity` without a `focus` query parameter
- **THEN** the featured selection behaves exactly as before this change

##### Example: id normalization

| focus query value | activity list ids (string) | featured |
| ----------------- | --------------------------- | -------- |
| "42"              | "41", "42", "43"            | "42"     |
| "42" (from integer reference id 42) | "42"     | "42"     |
| "999"             | "41", "42"                  | "41" (fallback to first) |


<!-- @trace
source: notification-deep-link-and-unread-api
updated: 2026-07-14
code:
  - src/components/AlertsPage.vue
  - src/components/AppSidebar.vue
  - src/stores/friendStore.js
  - src/components/FriendsPage.vue
  - src/components/ActivityView.vue
  - src/stores/notificationStore.js
  - src/components/ProfileEditPage.vue
  - src/stores/userStore.js
tests:
  - src/__tests__/notificationStore.test.js
  - src/__tests__/ActivityView.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AppSidebar.test.js
-->

---
### Requirement: Deep-link destination presents a status-appropriate activity view

The activity detail view reached through a notification deep link SHALL reflect the activity's current status: while the activity is in a decision phase (`voting`, or `recruiting` with voting required) the creator SHALL see the formation-confirmation actions, and when the activity is `confirmed` or `cancelled` every viewer SHALL see a read-only result view with no action buttons.

#### Scenario: Creator follows a formation-ready or time-to-pick notification

- **WHEN** the creator opens the deep link of an activity that is in a decision phase
- **THEN** the detail view shows the creator's formation-confirmation actions

#### Scenario: Participant follows a confirmed or cancelled notification

- **WHEN** a participant opens the deep link of an activity whose status is `confirmed` or `cancelled`
- **THEN** the detail view shows the result only, with no action buttons


<!-- @trace
source: notification-deep-link-and-unread-api
updated: 2026-07-14
code:
  - src/components/AlertsPage.vue
  - src/components/AppSidebar.vue
  - src/stores/friendStore.js
  - src/components/FriendsPage.vue
  - src/components/ActivityView.vue
  - src/stores/notificationStore.js
  - src/components/ProfileEditPage.vue
  - src/stores/userStore.js
tests:
  - src/__tests__/notificationStore.test.js
  - src/__tests__/ActivityView.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AppSidebar.test.js
-->

---
### Requirement: Activity lifecycle notifications render and dismiss like standard notifications

The alerts page SHALL render the backend-provided `message` text and the activity category icon for the notification types `formation_ready`, `time_to_pick`, `activity_confirmed`, and `activity_cancelled`, SHALL render no inline accept/reject actions for them, and SHALL allow them to be removed with the existing swipe-dismiss gesture.

#### Scenario: Activity lifecycle notification appears in the list

- **WHEN** the notifications API returns a notification of type `formation_ready`, `time_to_pick`, `activity_confirmed`, or `activity_cancelled` with category `activity`
- **THEN** the list renders its message text with the activity icon and without accept/reject buttons

#### Scenario: Activity lifecycle notification is swipe-dismissed

- **WHEN** a user completes the swipe-dismiss gesture on an activity lifecycle notification
- **THEN** the notification is dismissed exactly like any other dismissible notification

<!-- @trace
source: notification-deep-link-and-unread-api
updated: 2026-07-14
code:
  - src/components/AlertsPage.vue
  - src/components/AppSidebar.vue
  - src/stores/friendStore.js
  - src/components/FriendsPage.vue
  - src/components/ActivityView.vue
  - src/stores/notificationStore.js
  - src/components/ProfileEditPage.vue
  - src/stores/userStore.js
tests:
  - src/__tests__/notificationStore.test.js
  - src/__tests__/ActivityView.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AppSidebar.test.js
-->