## ADDED Requirements

### Requirement: Copy shareable BuJo ID code from profile edit page

The profile edit page SHALL display a visible Bujo ID label followed by a five-character BuJo ID code when the signed-in user object contains uid or id. The code SHALL be derived from user.uid when present, otherwise from user.id, by converting the value to a string and taking the final five characters. The visible text SHALL use the format `Bujo ID: <code>`. The page SHALL provide an icon-only copy control beside the visible Bujo ID code, and activating it MUST copy exactly the visible five-character code.

#### Scenario: Profile edit page user has an explicit uid

- **WHEN** the profile edit page renders with a user object whose uid is `bujo-user-d5e6f` and id is `legacy-11111`
- **THEN** the page displays `Bujo ID: d5e6f`
- **THEN** the page does not display `11111` as the Bujo ID code

#### Scenario: Profile edit page user falls back to id

- **WHEN** the profile edit page renders with a user object without uid and with id equal to `e4b3c2a1-8d9e-4f5a-b2c3-1a2b3c4d5e6f`
- **THEN** the page displays `Bujo ID: d5e6f`

#### Scenario: Profile edit page user has no identifier

- **WHEN** the profile edit page renders with a user object without uid and without id
- **THEN** the page does not display the Bujo ID code row
- **THEN** the page does not display the Bujo ID copy control

#### Scenario: Profile edit page copy succeeds

- **WHEN** the profile edit page displays `Bujo ID: d5e6f` and the user activates the copy control
- **THEN** `navigator.clipboard.writeText` is called with `d5e6f`
