# notification-swipe-dismiss Specification

## Purpose

TBD - created by archiving change 'add-notification-swipe-dismiss'. Update Purpose after archive.

## Requirements

### Requirement: Notification rows reveal dismissal affordance during a left drag

The alerts page SHALL use pointer input to move an eligible notification row only to the left and reveal a trash icon over a dismissal background. The background SHALL begin fully transparent and SHALL continuously increase the alpha of bright red `rgb(239 68 68)` according to left displacement divided by 65 percent of row width, clamped from 0 to 1. A circular SVG progress ring around the trash icon SHALL use the same progress, growing from an empty arc at 0 to a closed circle at 1. The page MUST lock into horizontal dragging only after movement reaches 10 pixels and horizontal displacement is at least 1.25 times vertical displacement.

#### Scenario: Eligible notification is dragged left

- **WHEN** a pointer moves an eligible notification left far enough to satisfy the horizontal lock
- **THEN** the notification content follows the pointer, the dismissal background continuously brightens from transparent toward bright red, and the trash icon progress arc grows toward a full circle

##### Example: Distance controls deep red progress

| Left displacement | Bright red alpha | Ring state | Dismissal state |
| ----- | ----- | ----- | ----- |
| 0% of row width | 0 | empty arc | not committed |
| 32.5% of row width | 0.5 | half circle | not committed |
| 65% of row width | 1 | closed circle | commit threshold reached |

#### Scenario: User scrolls vertically over a notification

- **WHEN** pointer movement is classified as vertical before horizontal dragging is locked
- **THEN** the page preserves native vertical scrolling and does not translate or dismiss the notification

#### Scenario: User drags right

- **WHEN** a pointer moves right from its starting position on a notification
- **THEN** the notification remains at zero horizontal translation and no dismissal request is sent


<!-- @trace
source: add-notification-swipe-dismiss
updated: 2026-07-12
code:
  - src/App.vue
  - src/components/ActivityView.vue
  - src/assets/main.css
  - src/components/ProfileEditPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/stores/notificationStore.js
  - src/components/AppSidebar.vue
  - src/components/DateEventsModal.vue
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
  - src/components/CalendarMain.vue
  - src/components/UrgentStartWarning.vue
  - src/components/AlertsPage.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/notificationStore.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
-->

---
### Requirement: Dismissal requires a long drag

The alerts page SHALL submit dismissal only when left displacement at pointer release is at least 65 percent of the notification row width, which is the same point where the dismissal background reaches fully opaque bright red and the trash icon progress ring closes. Pointer velocity MUST NOT bypass this distance threshold. A release below the threshold SHALL restore the row position, dismissal background, and ring to their original empty state without calling the dismissal API.

#### Scenario: Drag ends below the dismissal threshold

- **WHEN** an eligible notification is released after a left drag shorter than 65 percent of its width
- **THEN** the row returns to its original position, the background returns to fully transparent, the ring returns to an empty arc, and the client does not call the dismissal API

#### Scenario: Drag reaches the dismissal threshold

- **WHEN** an eligible notification is released after a left drag equal to or longer than 65 percent of its width
- **THEN** the background is fully bright red, the ring is closed, the row slides out and collapses, and the client calls `PATCH /api/notifications/:id/dismiss` exactly once without a request body

#### Scenario: Fast short swipe remains below threshold

- **WHEN** an eligible notification is released with high pointer velocity but less than 65 percent left displacement
- **THEN** the row returns to its original position and no dismissal request is sent


<!-- @trace
source: add-notification-swipe-dismiss
updated: 2026-07-12
code:
  - src/App.vue
  - src/components/ActivityView.vue
  - src/assets/main.css
  - src/components/ProfileEditPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/stores/notificationStore.js
  - src/components/AppSidebar.vue
  - src/components/DateEventsModal.vue
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
  - src/components/CalendarMain.vue
  - src/components/UrgentStartWarning.vue
  - src/components/AlertsPage.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/notificationStore.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
-->

---
### Requirement: Pending friendship actions block dismissal

A notification whose actions include `accept` or `reject` MUST NOT be dismissible. Pointer interaction that starts from an inline action button MUST NOT start notification dragging. After the friendship action is completed and refreshed notification data no longer contains either pending action, the row SHALL become eligible for dismissal.

#### Scenario: Pending friend request is dragged

- **WHEN** a notification still exposes an `accept` or `reject` action and the user drags left on it
- **THEN** the row does not translate, reveal the trash affordance, or call the dismissal API

#### Scenario: Friendship action button is used

- **WHEN** the user presses the accept or reject button inside a notification
- **THEN** the existing friendship action runs without starting a drag gesture

#### Scenario: Processed friend request becomes dismissible

- **WHEN** a refreshed friendship notification no longer contains `accept` or `reject` actions
- **THEN** the notification follows the same swipe-dismiss behavior as other eligible notifications


<!-- @trace
source: add-notification-swipe-dismiss
updated: 2026-07-12
code:
  - src/App.vue
  - src/components/ActivityView.vue
  - src/assets/main.css
  - src/components/ProfileEditPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/stores/notificationStore.js
  - src/components/AppSidebar.vue
  - src/components/DateEventsModal.vue
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
  - src/components/CalendarMain.vue
  - src/components/UrgentStartWarning.vue
  - src/components/AlertsPage.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/notificationStore.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
-->

---
### Requirement: Successful dismissal removes only frontend rendering

After a successful dismissal response, the alerts page SHALL remove the notification from its rendered array and recompute unread summary state from the remaining notifications. The frontend MUST NOT persist dismissed notification IDs in localStorage or sessionStorage. The backend contract MUST mark the notification as read, persist a soft-dismiss timestamp, exclude it from later notification listings, and retain its database row.

#### Scenario: Dismiss endpoint succeeds

- **WHEN** `PATCH /api/notifications/:id/dismiss` returns HTTP 200
- **THEN** the dismissed notification is absent from the rendered list and the unread summary reflects only remaining notifications

#### Scenario: Alerts page is loaded again

- **WHEN** the client later requests `GET /api/notifications`
- **THEN** the backend response excludes previously dismissed notifications without client-side ID filtering

#### Scenario: Dismissed notification remains stored

- **WHEN** the backend records a dismissal
- **THEN** it sets `is_read` to true, records a non-null `dismissed_at`, and does not delete the notification row


<!-- @trace
source: add-notification-swipe-dismiss
updated: 2026-07-12
code:
  - src/App.vue
  - src/components/ActivityView.vue
  - src/assets/main.css
  - src/components/ProfileEditPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/stores/notificationStore.js
  - src/components/AppSidebar.vue
  - src/components/DateEventsModal.vue
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
  - src/components/CalendarMain.vue
  - src/components/UrgentStartWarning.vue
  - src/components/AlertsPage.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/notificationStore.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
-->

---
### Requirement: Failed dismissal restores the notification

The alerts page SHALL preserve the notification's original array position and `isRead` value until dismissal succeeds. For any failed dismissal request, including HTTP 404, HTTP 500, timeout, or network failure, the page SHALL restore the row to its original position and visual state and SHALL display `無法移除通知` through the existing alerts error area.

#### Scenario: Dismiss endpoint fails

- **WHEN** the dismissal request rejects or returns a non-success response
- **THEN** the same notification is visible at its original position with its original `isRead` value and the error area displays `無法移除通知`

#### Scenario: Repeated pointer events occur while dismissal is pending

- **WHEN** a notification is already sliding out and waiting for its dismissal response
- **THEN** further pointer and click interactions on that notification do not send additional read or dismissal requests


<!-- @trace
source: add-notification-swipe-dismiss
updated: 2026-07-12
code:
  - src/App.vue
  - src/components/ActivityView.vue
  - src/assets/main.css
  - src/components/ProfileEditPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/stores/notificationStore.js
  - src/components/AppSidebar.vue
  - src/components/DateEventsModal.vue
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
  - src/components/CalendarMain.vue
  - src/components/UrgentStartWarning.vue
  - src/components/AlertsPage.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/notificationStore.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
-->

---
### Requirement: Existing notification interactions and accessibility remain available

Swipe dismissal SHALL preserve click, Enter, and Space marking an eligible non-dragged notification as read, the mark-all-read action, and friendship accept and reject actions. Once a horizontal drag is recognized, the resulting click MUST NOT trigger mark-as-read. The trash affordance SHALL expose the accessible name `移除通知`. When reduced motion is requested, the page SHALL remove smooth translation and use a near-immediate collapse while preserving all gesture thresholds and outcomes.

#### Scenario: Notification is clicked without dragging

- **WHEN** an unread notification receives a click without a recognized horizontal drag
- **THEN** the existing single-notification read request is sent

#### Scenario: Drag release emits a click

- **WHEN** a horizontal drag completes and the browser subsequently emits a click event
- **THEN** the page suppresses that click and does not send a separate mark-as-read request

#### Scenario: Reduced motion is enabled

- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** dismissal retains the distance-driven transparent-to-bright-red and progress-ring feedback and 65 percent commit threshold without smooth translation animation

<!-- @trace
source: add-notification-swipe-dismiss
updated: 2026-07-12
code:
  - src/App.vue
  - src/components/ActivityView.vue
  - src/assets/main.css
  - src/components/ProfileEditPage.vue
  - src/components/AvailabilityPickerModal.vue
  - src/components/EventPage.vue
  - src/stores/notificationStore.js
  - src/components/AppSidebar.vue
  - src/components/DateEventsModal.vue
  - output/playwright/refine-alerts-unread-badge-mobile-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-9-plus.png
  - output/playwright/refine-alerts-unread-badge-desktop-1.png
  - src/components/CalendarMain.vue
  - src/components/UrgentStartWarning.vue
  - src/components/AlertsPage.vue
  - output/playwright/refine-alerts-unread-badge-mobile-1.png
  - src/components/ActivityDetailModal.vue
tests:
  - src/__tests__/ActivityDetailModal.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/EventPage.test.js
  - src/__tests__/notificationStore.test.js
  - src/__tests__/friendStore.test.js
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/AlertsPage.test.js
  - src/__tests__/AvailabilityPickerModal.test.js
  - src/__tests__/RegisterViews.test.js
-->

---
### Requirement: Horizontal drag suppresses exactly its next pointer click

After a notification row locks into horizontal dragging, the alerts page SHALL arm a one-time guard for the next pointer-generated click associated with that row. Pointer release, pointer cancellation, and visual reset below the 65 percent dismissal threshold MUST NOT clear the armed guard before the click is handled. When the guarded click occurs, the page SHALL consume the guard and SHALL neither mark the notification as read nor navigate. The next pointerdown SHALL clear an unconsumed guard from an earlier gesture before starting a new gesture. The guard MUST NOT depend on elapsed time, device type, or viewport size.

#### Scenario: Slow drag below threshold is released and clicked

- **WHEN** a notification row locks into a horizontal left drag, remains active for longer than 250 milliseconds, is released below 65 percent of row width, and then receives a pointer-generated click
- **THEN** the row returns to its original position, no dismissal request is sent, the click guard is consumed, no read request is sent, and no navigation occurs

#### Scenario: Guarded click is consumed once

- **WHEN** the pointer-generated click after a horizontal drag is blocked and a later normal pointer gesture clicks the same notification
- **THEN** the later click follows normal notification activation behavior

#### Scenario: Platform emits no click after drag

- **WHEN** a horizontal drag ends without a pointer-generated click and the user begins a new pointer gesture on the same notification
- **THEN** the new pointerdown clears the unconsumed guard before processing the new gesture

<!-- @trace
source: fix-notification-swipe-click-through
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->