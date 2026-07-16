## ADDED Requirements

### Requirement: Notification rows animate after the initial successful load

The Alerts page SHALL animate only the non-empty notification batch returned by its first successful notification request. Each eligible row SHALL transition from opacity 0 and a 10 pixel downward offset to its normal fully opaque position over 400 milliseconds. The page MUST NOT apply the initial-load animation to any later successful notification request during the same component lifetime.

#### Scenario: Initial request is still pending

- **WHEN** the Alerts page initial notification request has not resolved
- **THEN** the page SHALL display its existing loading status and SHALL NOT render notification rows

#### Scenario: First successful non-empty response

- **WHEN** the initial notification request succeeds with one or more notifications
- **THEN** each returned notification row SHALL receive the initial-load entry animation

#### Scenario: Later successful response

- **WHEN** the page successfully fetches notifications again after the first successful response
- **THEN** no row from the later response SHALL receive the initial-load entry animation

#### Scenario: First successful empty response

- **WHEN** the initial notification request succeeds with an empty notification list
- **THEN** the page SHALL preserve its existing empty state and SHALL treat the initial-load animation opportunity as consumed

### Requirement: Initial notification entry is staggered with a bounded delay

The Alerts page SHALL derive the entry delay from the zero-based notification index at 60 milliseconds per index. The delay MUST be capped at 420 milliseconds, so the first eight rows use delays from 0 through 420 milliseconds and every later row uses 420 milliseconds.

#### Scenario: Early rows receive sequential delay

- **WHEN** the first successful response contains at least three notifications
- **THEN** rows at indexes 0, 1, and 2 SHALL use delays of 0 milliseconds, 60 milliseconds, and 120 milliseconds respectively

#### Scenario: Long lists use the maximum delay

- **WHEN** the first successful response contains at least nine notifications
- **THEN** rows at indexes 7 and 8 SHALL both use the maximum delay of 420 milliseconds

### Requirement: Reduced motion disables initial-load entry animation

When the user agent reports `prefers-reduced-motion: reduce`, the Alerts page MUST NOT play the initial notification entry animation and SHALL display notification rows immediately. Existing reduced-motion behavior for swipe dismissal MUST remain unchanged.

#### Scenario: Reduced motion is requested

- **WHEN** the user agent reports `prefers-reduced-motion: reduce` during the first successful non-empty load
- **THEN** notification rows SHALL render without the entry animation
