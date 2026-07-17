# friend-notification-avatar Specification

## Purpose

TBD - created by archiving change 'show-friend-notification-avatars'. Update Purpose after archive.

## Requirements

### Requirement: Friend notifications display the actor avatar

The Alerts page SHALL display a 40 by 40 pixel square actor avatar in place of the existing friend icon for `friend_request_created` and `friend_request_accepted` notifications when `actor.avatarUrl` resolves to a non-empty image source. The page MUST preserve the existing square paper visual style and MUST NOT render the avatar as a circle.

#### Scenario: Incoming friend request displays requester avatar

- **WHEN** a `friend_request_created` notification contains actor `{ id: "requester-1", displayName: "Alice", avatarUrl: "/uploads/avatars/alice.png" }`
- **THEN** the notification displays Alice's square avatar instead of the generic friend icon

#### Scenario: Accepted friend request displays receiver avatar

- **WHEN** a `friend_request_accepted` notification contains actor `{ id: "receiver-1", displayName: "Bob", avatarUrl: "https://images.example.com/bob.png" }`
- **THEN** the notification displays Bob's square avatar instead of the generic friend icon


<!-- @trace
source: show-friend-notification-avatars
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->

---
### Requirement: Activity-created notifications display the creator avatar

The Alerts page SHALL display a 40 by 40 pixel square actor avatar in place of the existing activity icon for `activity_created` notifications when `actor.avatarUrl` resolves to a non-empty image source. The page MUST preserve the existing square paper visual style and MUST NOT render the avatar as a circle or display the actor name separately.

#### Scenario: Created activity displays creator avatar

- **WHEN** an `activity_created` notification contains actor `{ id: "creator-1", displayName: "Carol", avatarUrl: "/uploads/avatars/carol.png" }`
- **THEN** the notification displays Carol's square avatar instead of the generic activity icon without adding Carol's name to the notification text


<!-- @trace
source: show-friend-notification-avatars
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->

---
### Requirement: Friend notification avatar URLs use shared normalization

The Alerts page SHALL resolve friend notification avatar URLs through the shared avatar URL normalization behavior. Relative `/uploads/...` paths MUST be prefixed with the configured API base URL, and absolute HTTP(S) URLs MUST remain unchanged.

#### Scenario: Relative actor avatar path is resolved

- **WHEN** an actor avatar URL is `/uploads/avatars/alice.png` and the configured API base URL is `http://localhost:3000`
- **THEN** the rendered image source is `http://localhost:3000/uploads/avatars/alice.png`

#### Scenario: Absolute actor avatar URL is preserved

- **WHEN** an actor avatar URL is `https://images.example.com/bob.png`
- **THEN** the rendered image source is `https://images.example.com/bob.png`

#### Scenario: Absolute activity creator avatar URL is preserved

- **WHEN** an `activity_created` actor avatar URL is `https://images.example.com/carol.png`
- **THEN** the rendered image source is `https://images.example.com/carol.png`


<!-- @trace
source: show-friend-notification-avatars
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->

---
### Requirement: Unavailable actor avatars fall back safely

The Alerts page SHALL render the existing generic friend icon and SHALL NOT render a broken image when the actor is null, the actor avatar URL is empty, the normalized image source is empty, or the avatar image emits an error event.

#### Scenario: Missing actor uses generic friend icon

- **WHEN** a friend notification contains `actor: null`
- **THEN** the notification displays the existing generic friend icon and no avatar image

#### Scenario: Actor without avatar uses generic friend icon

- **WHEN** a friend notification actor contains `avatarUrl: null`
- **THEN** the notification displays the existing generic friend icon and no avatar image

#### Scenario: Avatar image fails to load

- **WHEN** a friend notification actor avatar image emits an error event
- **THEN** the failed image is removed and the existing generic friend icon is displayed

#### Scenario: Activity creator is unavailable

- **WHEN** an `activity_created` notification contains `actor: null` or an actor with `avatarUrl: null`
- **THEN** the notification displays the existing activity icon and no avatar image

#### Scenario: Activity creator avatar image fails to load

- **WHEN** an `activity_created` actor avatar image emits an error event
- **THEN** the failed image is removed and the existing activity icon is displayed


<!-- @trace
source: show-friend-notification-avatars
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->

---
### Requirement: Existing notification behavior remains unchanged

The Alerts page MUST preserve general category icons and the activity icons for `formation_ready`, `time_to_pick`, `activity_confirmed`, and `activity_cancelled`, even if those notifications contain actor data. It MUST also preserve read and unread visuals, accept and reject actions, mark-as-read behavior, activity navigation, swipe dismissal, and hover dismissal while adding actor avatars.

#### Scenario: Other activity lifecycle notification keeps activity icon

- **WHEN** a `formation_ready`, `time_to_pick`, `activity_confirmed`, or `activity_cancelled` notification is rendered with actor data
- **THEN** the notification displays the existing activity icon and no actor avatar

#### Scenario: Friend request actions remain available

- **WHEN** a `friend_request_created` notification includes `accept` and `reject` actions
- **THEN** both existing actions remain available and operate independently of the actor avatar

<!-- @trace
source: show-friend-notification-avatars
updated: 2026-07-16
code:
  - src/components/AlertsPage.vue
tests:
  - src/__tests__/AlertsPage.test.js
-->