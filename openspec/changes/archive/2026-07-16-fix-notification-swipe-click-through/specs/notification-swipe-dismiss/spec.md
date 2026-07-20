## ADDED Requirements

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
