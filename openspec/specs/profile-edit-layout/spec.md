# profile-edit-layout Specification

## Purpose

TBD - created by archiving change 'adjust-profile-edit-page-layout'. Update Purpose after archive.

## Requirements

### Requirement: Profile edit page shows avatar summary

The profile edit page SHALL show a user summary beside the avatar preview. The summary SHALL include the signed-in user display name, the shareable Bujo ID row when an identifier exists, and an avatar replacement control labeled `更換頭像`.

#### Scenario: Signed-in user has name and identifier

- **WHEN** the profile edit page renders for a signed-in user with display_name equal to `Test A` and uid equal to `bujo-user-d5e6f`
- **THEN** the page displays `Test A` beside the avatar preview
- **THEN** the page displays `Bujo ID: d5e6f` beside the avatar preview
- **THEN** the avatar file control is labeled `更換頭像`


<!-- @trace
source: adjust-profile-edit-page-layout
updated: 2026-07-04
code:
  - src/components/ProfileEditPage.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
-->

---
### Requirement: Profile edit page removes obsolete section labels

The profile edit page SHALL use `個人編輯頁面` as its main heading. The avatar area SHALL NOT render an independent `頭像` section header. The basic-data form SHALL NOT render the read-only email field.

#### Scenario: Page chrome matches the requested layout

- **WHEN** the profile edit page renders
- **THEN** the main heading displays `個人編輯頁面`
- **THEN** the avatar area does not display an independent section heading `頭像`
- **THEN** the basic-data form does not display the label `電子郵件`


<!-- @trace
source: adjust-profile-edit-page-layout
updated: 2026-07-04
code:
  - src/components/ProfileEditPage.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
-->

---
### Requirement: Existing profile edit controls remain available

The profile edit page SHALL keep the display-name input, cancel control, save control, avatar replacement behavior, and account-linking controls available after the layout adjustment.

#### Scenario: User can still edit profile controls

- **WHEN** the profile edit page renders
- **THEN** the display-name input is visible
- **THEN** the `取消` control is visible
- **THEN** the `儲存變更` control is visible
- **THEN** the connected-login-methods section remains visible


<!-- @trace
source: adjust-profile-edit-page-layout
updated: 2026-07-04
code:
  - src/components/ProfileEditPage.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
-->

---
### Requirement: Profile edit page uploads avatar

The profile edit page SHALL upload a selected avatar image to `PATCH /api/users/me/avatar` using `FormData`. The request SHALL use the field name `avatar`, SHALL include cookies with `credentials: include`, and MUST NOT set a manual `Content-Type` header. The page SHALL accept JPG, PNG, and WebP files up to 2MB. After a successful response, the page SHALL update the signed-in user with the response `user` object and display the response `user.avatar_url`.

#### Scenario: Avatar upload succeeds

- **WHEN** the signed-in user selects a PNG file named `avatar.png`
- **THEN** the page sends a PATCH request to `/api/users/me/avatar` with a FormData body containing `avatar.png` under the `avatar` field
- **THEN** the request includes `credentials: include`
- **THEN** the request does not include a manual `Content-Type` header
- **THEN** the page updates the current signed-in user's `avatar_url` from the response user object

#### Scenario: Avatar file type is unsupported

- **WHEN** the signed-in user selects a GIF file named `avatar.gif`
- **THEN** the page does not send an avatar upload request
- **THEN** the page displays an error explaining that only JPG, PNG, and WebP are supported

#### Scenario: Avatar file is too large

- **WHEN** the signed-in user selects a PNG file larger than 2MB
- **THEN** the page does not send an avatar upload request
- **THEN** the page displays an error explaining that the image can be at most 2MB

#### Scenario: Avatar upload fails

- **WHEN** the avatar upload API responds with an error response containing `message`
- **THEN** the page displays the response message

<!-- @trace
source: adjust-profile-edit-page-layout
updated: 2026-07-04
code:
  - src/components/ProfileEditPage.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
-->