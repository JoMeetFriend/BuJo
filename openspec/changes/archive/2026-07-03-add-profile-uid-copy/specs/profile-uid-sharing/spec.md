## ADDED Requirements

### Requirement: Display shareable BuJo ID code

The profile account modal SHALL display a visible Bujo ID label followed by a five-character BuJo ID code for a signed-in user when the user object contains uid or id. The code SHALL be derived from user.uid when present, otherwise from user.id, by converting the value to a string and taking the final five characters. The visible text SHALL use the format `Bujo ID: <code>`.

#### Scenario: User has an explicit uid

- **WHEN** the profile account modal receives a user object with uid equal to bujo-user-d5e6f and id equal to legacy-11111
- **THEN** the modal displays Bujo ID: d5e6f under the display name

#### Scenario: User falls back to id

- **WHEN** the profile account modal receives a user object without uid and with id equal to e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f
- **THEN** the modal displays Bujo ID: d5e6f under the display name

##### Example: Share code derivation

| Input user.uid | Input user.id | Visible text |
| -------------- | ------------- | ------------ |
| bujo-user-d5e6f | legacy-11111 | Bujo ID: d5e6f |
| empty | e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f | Bujo ID: d5e6f |

#### Scenario: User has no identifier

- **WHEN** the profile account modal receives a user object without uid and without id
- **THEN** the modal does not display the BuJo ID code row

### Requirement: Copy shareable BuJo ID code

The profile account modal SHALL provide an icon-only copy control beside the visible BuJo ID code. The copy control MUST NOT display visible text that says copy, but MUST expose an accessible name for assistive technology and component tests. Activating the copy control MUST copy exactly the visible five-character code and MUST NOT copy labels, whitespace, email, or the full identifier.

#### Scenario: Copy control is icon-only but accessible

- **WHEN** the modal displays Bujo ID: d5e6f
- **THEN** the copy control is visually represented by an icon rather than visible copy text
- **THEN** the copy control exposes an accessible name such as 複製 BuJo ID

#### Scenario: Copy succeeds

- **WHEN** the modal displays Bujo ID: d5e6f and the user activates the copy control
- **THEN** navigator.clipboard.writeText is called with d5e6f
- **THEN** the modal displays success feedback to the right of the copy control without closing

#### Scenario: Copy is unavailable or fails

- **WHEN** the modal displays Bujo ID: d5e6f and the clipboard write API is unavailable or rejects
- **THEN** the modal displays failure feedback to the right of the copy control
- **THEN** the modal keeps Bujo ID: d5e6f visible
- **THEN** the modal remains open

### Requirement: Preserve existing account modal actions

The profile account modal SHALL preserve the existing edit profile navigation, close action, avatar display, display name display, and logout event behavior while adding BuJo ID sharing.

#### Scenario: Existing actions remain available

- **WHEN** the profile account modal displays a BuJo ID code
- **THEN** the edit profile action remains visible
- **THEN** the logout action remains visible
- **THEN** the close action remains available
