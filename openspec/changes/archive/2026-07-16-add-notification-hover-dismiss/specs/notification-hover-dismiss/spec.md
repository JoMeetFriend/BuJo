## ADDED Requirements

### Requirement: Fine-hover read notifications reveal a hover dismiss control

In an environment matching `(hover: hover) and (pointer: fine)`, the alerts page SHALL provide a dismiss X control only for notifications that are read and currently eligible under the existing dismissal rules. An unread notification SHALL keep its existing unread indicator and SHALL NOT reveal the X on hover. A notification whose actions include `accept` or `reject`, or whose friendship action is busy, MUST NOT reveal the X regardless of read state. Once the actions are processed and refreshed data makes the read notification eligible, the X SHALL become available. A touch-only environment SHALL NOT display, reserve layout space for, or place the X in the tab order. Viewport width MUST NOT determine these behaviors.

#### Scenario: Visibility follows read and dismissal state

- **WHEN** notification rows render or their hover/focus state changes
- **THEN** each row SHALL show the unread indicator or dismiss X according to the state matrix

##### Example: Dismiss control state matrix

| Input capability | Read state | Actions | Interaction | Unread indicator | Dismiss X |
| ----- | ----- | ----- | ----- | ----- | ----- |
| fine-hover | unread | none | hover | visible | hidden |
| fine-hover | read | none | idle | hidden | visually hidden with reserved slot |
| fine-hover | read | none | hover | hidden | visible |
| fine-hover | read | none | keyboard focus | hidden | visible |
| fine-hover | read | accept, reject | hover | hidden | absent |
| touch-only | read | none | tap or idle | hidden | absent with no reserved slot or tab stop |

#### Scenario: Processed friend request becomes hover-dismissible

- **WHEN** an accepted or rejected friend-request notification refreshes without `accept` or `reject` actions and is read
- **THEN** a fine-hover row SHALL reveal the dismiss X on hover or keyboard focus

### Requirement: Hover dismiss control uses the approved X microinteraction

The dismiss control SHALL reserve a 32 by 32 CSS pixel hit area with an 8 CSS pixel corner radius. The entire control SHALL be vertically centered against the notification row's cross axis for both single-line and multi-line row heights; centering the X glyph only within a top-aligned control is insufficient. Its resting icon color SHALL be `#98968a`. When revealed, it SHALL transition over 180 milliseconds from opacity 0 and `translateY(10px)` to full opacity and zero vertical translation. Hovering the X itself SHALL transition its background and icon color over 200 milliseconds to `rgba(196, 64, 52, 0.12)` and `#c44034`. The notification row MUST retain the existing square Modern Paper styling and MUST NOT gain the reference prototype's rounded-card, lift, or shadow treatment.

#### Scenario: Eligible fine-hover read row is hovered

- **WHEN** a fine-hover user hovers an eligible read notification at any viewport width
- **THEN** the reserved X control fades upward into view without changing the notification content width

#### Scenario: Pointer hovers the X

- **WHEN** the pointer moves from the read notification row onto its visible X
- **THEN** the X uses the approved pale-red background and red icon colors over the 200 millisecond transition

#### Scenario: X control is centered within the notification row

- **WHEN** an eligible read notification reveals the X in a row whose content makes the row taller than the 32 CSS pixel control
- **THEN** the entire 32 by 32 CSS pixel control SHALL remain vertically centered between the row's top and bottom edges instead of aligning to the top edge

##### Example: Centering in a 64 pixel content box

- **GIVEN** a notification row content box is 64 CSS pixels high and the dismiss control is 32 CSS pixels high
- **WHEN** the dismiss control is revealed
- **THEN** the control's top and bottom free space are both 16 CSS pixels

#### Scenario: Reduced motion is requested

- **WHEN** the user agent reports `prefers-reduced-motion: reduce`
- **THEN** the X SHALL appear without visible translation and its transition duration SHALL be at most 1 millisecond

### Requirement: Hover dismiss activation reuses soft dismissal without activating the row

The X SHALL be a semantic button with `type="button"` and accessible name `移除通知`. Pointerdown and click from the X MUST NOT start the row swipe gesture, mark the notification as read, or activate activity deep-link navigation. The handler MUST recheck that the notification is read and dismissible, then call `PATCH /api/notifications/:id/dismiss` exactly once through the existing soft-dismiss flow. While the request and existing 220 millisecond animation wait are pending, X activation SHALL collapse the notification vertically while keeping horizontal translation and dismissal progress at zero, so the red swipe background, progress ring, and trash icon remain unrevealed. Success SHALL remove the notification after the collapse. Failure SHALL keep the notification in its original position and read state and SHALL display `無法移除通知`.

#### Scenario: X successfully dismisses a read activity notification

- **WHEN** the user activates the X on an eligible read activity notification with id `notification-act`
- **THEN** the client calls `PATCH /api/notifications/notification-act/dismiss` exactly once, keeps the row at `translateX(0px)` with zero dismissal progress while vertically collapsing it, removes the notification after the existing animation, and does not call its read endpoint or navigate

#### Scenario: X dismissal fails

- **WHEN** the dismiss request triggered by X rejects with an HTTP or network failure
- **THEN** the notification remains rendered in its original position and read state and the page displays `無法移除通知`

#### Scenario: Friendship action remains isolated

- **WHEN** a pending friend notification exposes `accept` or `reject`
- **THEN** the X is absent and the existing friendship buttons remain the only inline actions

### Requirement: Pointer input type controls swipe dismissal

The alerts page SHALL enable swipe movement, progress visuals, the 65 percent dismissal threshold, soft dismissal, and rollback only when the active pointer event reports `pointerType` equal to `touch`. Mouse, pen, and missing pointer types MUST keep the notification at `translateX(0px)`, MUST keep swipe progress at zero, and MUST NOT invoke the dismiss API. Pending or busy friendship notifications MUST remain ineligible for touch swipe until their actions have been processed.

#### Scenario: Touch input preserves swipe dismissal

- **WHEN** a touch pointer drags an eligible notification left to 64 percent and then to 65 percent of its row width in separate gestures
- **THEN** the 64 percent gesture SHALL restore the row and the 65 percent gesture SHALL invoke soft dismissal exactly once, move the row fully left, reach 100 percent progress with the existing red background, ring, and trash affordance, and preserve rollback and unread-summary behavior

#### Scenario: Non-touch input never moves or dismisses the row

- **WHEN** a mouse, pen, or pointer with an empty type drags an eligible notification horizontally beyond the existing axis-lock distance
- **THEN** the row SHALL remain at zero translation with zero dismissal progress and the client SHALL NOT call the dismiss endpoint

### Requirement: Non-touch horizontal drag consumes only its synthetic click

For mouse, pen, and missing pointer types, the alerts page SHALL reuse the existing 10 CSS pixel lock distance and 1.25 horizontal-to-vertical axis ratio to recognize a horizontal drag. Once recognized, the row SHALL consume the first subsequent pointer click so it does not mark the notification as read or navigate. After that guard is consumed, the next ordinary pointer activation SHALL use the existing row click behavior. If no synthetic click occurs, the next pointerdown SHALL clear the stale guard before tracking the new interaction. Keyboard Enter and Space activation MUST remain unaffected.

#### Scenario: Mouse drag synthetic click is isolated

- **WHEN** a mouse pointer completes a qualifying horizontal drag and the browser dispatches its synthetic click
- **THEN** that click SHALL neither mark the notification as read nor navigate, and a following ordinary pointer click SHALL perform the existing activation behavior

#### Scenario: Stale drag guard clears on the next interaction

- **WHEN** a qualifying non-touch drag does not produce a synthetic click and a new pointerdown begins
- **THEN** the stale guard SHALL be cleared so the new interaction and its ordinary click use the existing activation behavior
