# line-notification-onboarding Specification

## Purpose

Guide signed-in users through connecting a LINE identity and adding the BuJo LINE Official Account without blocking normal product use, while retaining a permanent setup entry in profile settings.

## Requirements

### Requirement: Authenticated users receive one non-blocking onboarding prompt

The frontend SHALL display the LINE notification onboarding modal when authentication is initialized, the signed-in user has an ID, the user is in an authenticated application area, and the current device has no `bujo:line-notification-guide:v1:<userId>` value. The modal MUST allow the user to continue using BuJo without completing LINE setup.

#### Scenario: Existing or new user sees the prompt once

- **WHEN** a signed-in user with ID `user-123` enters an authenticated application area and `bujo:line-notification-guide:v1:user-123` is absent
- **THEN** the frontend displays the LINE notification onboarding modal

#### Scenario: Guest and auth pages do not display the prompt

- **WHEN** authentication is uninitialized, no signed-in user exists, the user has no ID, or the current route is the landing, login, or registration page
- **THEN** the frontend does not display the onboarding modal

#### Scenario: User dismisses the prompt

- **WHEN** the user closes the modal or activates `稍後再說`
- **THEN** the frontend stores `seen` at `bujo:line-notification-guide:v1:<userId>` and closes the modal without navigating

#### Scenario: User starts LINE linking

- **WHEN** the user activates the LINE linking action
- **THEN** the frontend remembers the current internal route without storing `seen`, starts the existing LINE linking flow, and returns to that route after a successful callback so the connected guidance can continue

#### Scenario: User starts the Official Account action

- **WHEN** the user activates the Official Account action
- **THEN** the frontend stores `seen` before external opening begins

#### Scenario: LINE linking is cancelled or fails

- **WHEN** the backend returns `line_link_cancelled` or `line_link_failed`
- **THEN** the frontend clears the remembered return route and returns to the original internal route when available without leaving stale callback state

#### Scenario: Same account does not see the prompt again on the device

- **WHEN** the signed-in user enters an authenticated application area and their versioned key contains `seen`
- **THEN** the frontend does not display the modal

#### Scenario: Accounts are isolated on a shared device

- **WHEN** `bujo:line-notification-guide:v1:user-123` contains `seen` and a different signed-in user has ID `user-456`
- **THEN** the frontend evaluates `user-456` using `bujo:line-notification-guide:v1:user-456` and displays the modal when that key is absent

#### Scenario: Browser storage is unavailable

- **WHEN** reading or writing localStorage throws an exception
- **THEN** the frontend continues without crashing and prevents the modal from reopening during the current SPA session after the user closes it or completes the Official Account action


<!-- @trace
source: add-line-notification-onboarding
updated: 2026-07-17
code:
  - .env.example
  - src/assets/line-gain-friends-qrcode.png
  - src/composables/useLineNotificationOnboarding.js
  - src/components/LineOfficialAccountEntry.vue
  - src/App.vue
  - src/components/ProfileEditPage.vue
  - README.md
  - src/components/LineNotificationOnboardingModal.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/LineNotificationOnboardingModal.test.js
  - src/__tests__/LineOfficialAccountEntry.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useLineNotificationOnboarding.test.js
-->

---
### Requirement: Onboarding actions follow LINE identity state

The frontend SHALL determine LINE connection state from an array entry whose `provider` equals `line`. Missing or malformed identities SHALL be treated as not connected. The frontend MUST NOT represent a LINE identity as proof that the user has added or unblocked the LINE Official Account.

#### Scenario: User has no LINE identity

- **WHEN** the onboarding modal opens for a user without a `line` identity
- **THEN** it explains that LINE connection and Official Account friendship are required and offers a primary action to the existing authenticated `/api/auth/line/link` flow

#### Scenario: User has a LINE identity

- **WHEN** the onboarding modal opens for a user with a `line` identity
- **THEN** it explains that the user must add or unblock the BuJo LINE Official Account and displays the configured Official Account entry points

#### Scenario: Identity collection is malformed

- **WHEN** the current user has no `identities` array
- **THEN** the modal renders the not-connected guidance without throwing an exception

#### Scenario: Completion status remains honest

- **WHEN** the frontend only knows that a LINE identity exists
- **THEN** it does not display text or a badge claiming that Official Account friendship or LINE push delivery is enabled


<!-- @trace
source: add-line-notification-onboarding
updated: 2026-07-17
code:
  - .env.example
  - src/assets/line-gain-friends-qrcode.png
  - src/composables/useLineNotificationOnboarding.js
  - src/components/LineOfficialAccountEntry.vue
  - src/App.vue
  - src/components/ProfileEditPage.vue
  - README.md
  - src/components/LineNotificationOnboardingModal.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/LineNotificationOnboardingModal.test.js
  - src/__tests__/LineOfficialAccountEntry.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useLineNotificationOnboarding.test.js
-->

---
### Requirement: Official Account entry points adapt to viewport and configuration

The frontend SHALL use `VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL` as the public add-friend destination. It SHALL use `VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL` when configured and SHALL otherwise use the bundled official add-friend QR image. Compact and desktop viewports SHALL display the QR image, and SHALL also retain the clickable add-friend link when configured.

#### Scenario: Mobile user views Official Account guidance

- **WHEN** a compact-viewport user views Official Account guidance
- **THEN** the frontend displays the QR image and, when configured, allows the user to open `VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL`

#### Scenario: Desktop user receives QR and link choices

- **WHEN** a desktop user views Official Account guidance and both public URLs are configured
- **THEN** the frontend displays the QR image and a clickable add-friend link

#### Scenario: External QR URL is not configured

- **WHEN** a desktop user views Official Account guidance and `VITE_LINE_OFFICIAL_ACCOUNT_QR_CODE_URL` is empty
- **THEN** the frontend displays the bundled official add-friend QR image

#### Scenario: Add-friend URL is missing

- **WHEN** `VITE_LINE_OFFICIAL_ACCOUNT_ADD_FRIEND_URL` is empty
- **THEN** the frontend does not render an empty clickable destination and continues displaying the configured or bundled QR image

#### Scenario: QR image fails to load

- **WHEN** the selected external or bundled QR image emits an error
- **THEN** the frontend hides the broken image and retains the configured add-friend link when that link exists


<!-- @trace
source: add-line-notification-onboarding
updated: 2026-07-17
code:
  - .env.example
  - src/assets/line-gain-friends-qrcode.png
  - src/composables/useLineNotificationOnboarding.js
  - src/components/LineOfficialAccountEntry.vue
  - src/App.vue
  - src/components/ProfileEditPage.vue
  - README.md
  - src/components/LineNotificationOnboardingModal.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/LineNotificationOnboardingModal.test.js
  - src/__tests__/LineOfficialAccountEntry.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useLineNotificationOnboarding.test.js
-->

---
### Requirement: Onboarding guidance uses conversational language

The onboarding modal SHALL explain the LINE setup steps with short, conversational Traditional Chinese while remaining accurate about the difference between LINE connection and Official Account friendship. It MUST NOT claim that push delivery is enabled.

#### Scenario: Connected user reads the onboarding guidance

- **WHEN** a user with a LINE identity opens the onboarding modal
- **THEN** the modal says that LINE reminders are one step away and naturally asks the user to add the Official Account

#### Scenario: Unconnected user reads the onboarding guidance

- **WHEN** a user without a LINE identity opens the onboarding modal
- **THEN** the modal invites the user to connect LINE first and states that setup can be completed later from profile settings


<!-- @trace
source: add-line-notification-onboarding
updated: 2026-07-17
code:
  - .env.example
  - src/assets/line-gain-friends-qrcode.png
  - src/composables/useLineNotificationOnboarding.js
  - src/components/LineOfficialAccountEntry.vue
  - src/App.vue
  - src/components/ProfileEditPage.vue
  - README.md
  - src/components/LineNotificationOnboardingModal.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/LineNotificationOnboardingModal.test.js
  - src/__tests__/LineOfficialAccountEntry.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useLineNotificationOnboarding.test.js
-->

---
### Requirement: Profile settings retain an integrated LINE notification entry

The profile edit page SHALL combine LINE identity and notification guidance in one permanent LINE account container independently of whether the onboarding modal has been seen. The container SHALL use the same LINE identity rules and Official Account configuration as the modal and SHALL NOT display a duplicate linking action.

#### Scenario: Unconnected user opens profile settings

- **WHEN** a signed-in user without a LINE identity opens the profile edit page
- **THEN** the integrated LINE container explains the missing connection, offers one existing LINE linking action, and displays the configured or bundled Official Account QR entry

#### Scenario: Connected user opens profile settings

- **WHEN** a signed-in user with a LINE identity opens the profile edit page
- **THEN** the integrated LINE container displays the unlink action and add-or-unblock Official Account guidance with the configured QR and link entry points

#### Scenario: Seen onboarding does not remove settings entry

- **WHEN** the current user's onboarding key contains `seen`
- **THEN** the profile edit page still displays the integrated LINE account and notification container


<!-- @trace
source: add-line-notification-onboarding
updated: 2026-07-17
code:
  - .env.example
  - src/assets/line-gain-friends-qrcode.png
  - src/composables/useLineNotificationOnboarding.js
  - src/components/LineOfficialAccountEntry.vue
  - src/App.vue
  - src/components/ProfileEditPage.vue
  - README.md
  - src/components/LineNotificationOnboardingModal.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/LineNotificationOnboardingModal.test.js
  - src/__tests__/LineOfficialAccountEntry.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useLineNotificationOnboarding.test.js
-->

---
### Requirement: LINE onboarding follows BuJo interaction and visual conventions

The onboarding modal and permanent settings section SHALL preserve BuJo's Modern Paper character with square borders, editorial hierarchy, mature spacing, and existing ink and color tokens. Interactive controls MUST provide visible keyboard focus and accessible names, and the QR image MUST have descriptive alternative text.

#### Scenario: Keyboard user operates the modal

- **WHEN** a keyboard user tabs through the onboarding modal
- **THEN** the close, primary, secondary, and link controls expose visible focus states and accessible names

#### Scenario: Onboarding is visually integrated

- **WHEN** the modal or LINE notification settings section is rendered
- **THEN** it uses square paper-like surfaces and existing BuJo design tokens rather than generic rounded soft cards

#### Scenario: Onboarding opens on a short viewport

- **WHEN** the modal content is taller than the available viewport
- **THEN** the body remains scrollable while the title and footer actions remain reachable

<!-- @trace
source: add-line-notification-onboarding
updated: 2026-07-17
code:
  - .env.example
  - src/assets/line-gain-friends-qrcode.png
  - src/composables/useLineNotificationOnboarding.js
  - src/components/LineOfficialAccountEntry.vue
  - src/App.vue
  - src/components/ProfileEditPage.vue
  - README.md
  - src/components/LineNotificationOnboardingModal.vue
tests:
  - src/__tests__/ProfileEditPage.test.js
  - src/__tests__/LineNotificationOnboardingModal.test.js
  - src/__tests__/LineOfficialAccountEntry.test.js
  - src/__tests__/App.test.js
  - src/__tests__/useLineNotificationOnboarding.test.js
-->
