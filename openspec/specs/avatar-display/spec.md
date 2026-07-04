# avatar-display Specification

## Purpose

TBD - created by archiving change 'fix-avatar-display-surfaces'. Update Purpose after archive.

## Requirements

### Requirement: Normalize current-user avatar URL

The frontend SHALL normalize current-user avatar URLs before rendering them in account surfaces. Relative avatar paths returned by the backend SHALL be resolved against the configured API base URL. Absolute HTTP(S) URLs and blob URLs SHALL be rendered unchanged. Empty avatar values SHALL produce no image source.

#### Scenario: Relative backend avatar path is rendered with API base URL

- **WHEN** the current user avatar_url is `/uploads/avatars/avatar-user.png` and the API base URL is `http://localhost:3000`
- **THEN** the rendered image source is `http://localhost:3000/uploads/avatars/avatar-user.png`

#### Scenario: Absolute avatar URL is preserved

- **WHEN** the current user avatar_url is `https://avatar.example.com/photo.png`
- **THEN** the rendered image source is `https://avatar.example.com/photo.png`

#### Scenario: Blob avatar URL is preserved

- **WHEN** the current user avatar_url is `blob:http://localhost:5173/avatar-preview`
- **THEN** the rendered image source is `blob:http://localhost:5173/avatar-preview`

#### Scenario: Missing avatar URL falls back

- **WHEN** the current user has no avatar_url
- **THEN** the account surface does not render a broken image source
- **THEN** the account surface renders its fallback pixel face


<!-- @trace
source: fix-avatar-display-surfaces
updated: 2026-07-04
code:
  - src/components/AppSidebar.vue
  - src/components/ProfileAccountModal.vue
  - src/components/ProfileEditPage.vue
  - src/utils/avatar.js
  - src/components/CalendarMain.vue
tests:
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/avatar.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/ProfileAccountModal.test.js
-->

---
### Requirement: Current-user account surfaces display avatar consistently

The frontend SHALL use normalized current-user avatar sources on the calendar header account button, the profile account modal, the profile edit page, and the sidebar account button. Each surface SHALL render the current user avatar when avatar_url is present and SHALL render the existing fallback pixel face when avatar_url is missing.

#### Scenario: Calendar header account button renders current user avatar

- **WHEN** the current user avatar_url is `/uploads/avatars/avatar-user.png`
- **THEN** the calendar header account button image source contains `/uploads/avatars/avatar-user.png` with the API base URL prefix

#### Scenario: Profile account modal renders current user avatar

- **WHEN** the profile account modal receives a user with avatar_url `/uploads/avatars/avatar-user.png`
- **THEN** the modal image source contains `/uploads/avatars/avatar-user.png` with the API base URL prefix

#### Scenario: Profile edit page renders current user avatar

- **WHEN** the profile edit page loads a current user with avatar_url `/uploads/avatars/avatar-user.png`
- **THEN** the profile edit avatar image source contains `/uploads/avatars/avatar-user.png` with the API base URL prefix

#### Scenario: Sidebar account button renders current user avatar

- **WHEN** the current user avatar_url is `/uploads/avatars/avatar-user.png`
- **THEN** the sidebar account button image source contains `/uploads/avatars/avatar-user.png` with the API base URL prefix

#### Scenario: Sidebar account button keeps fallback without avatar

- **WHEN** the current user has no avatar_url
- **THEN** the sidebar account button renders the existing fallback pixel face

<!-- @trace
source: fix-avatar-display-surfaces
updated: 2026-07-04
code:
  - src/components/AppSidebar.vue
  - src/components/ProfileAccountModal.vue
  - src/components/ProfileEditPage.vue
  - src/utils/avatar.js
  - src/components/CalendarMain.vue
tests:
  - src/__tests__/AppSidebar.test.js
  - src/__tests__/avatar.test.js
  - src/__tests__/CalendarMain.test.js
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/ProfileAccountModal.test.js
-->