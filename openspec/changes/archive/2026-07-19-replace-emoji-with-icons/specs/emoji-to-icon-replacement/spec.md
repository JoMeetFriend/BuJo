## ADDED Requirements

### Requirement: Blocking validation errors use ExclamationTriangleIcon instead of a warning emoji

Inline validation error messages that block a form action (time-selection validation errors, availability-confirmation validation errors) SHALL render an `ExclamationTriangleIcon` (from `@heroicons/vue/24/outline`) instead of the `⚠`/`⚠️` emoji character.

#### Scenario: Time-field validation error shows the triangle icon

- **WHEN** the create-activity form's `timeError` message is displayed for either the start-time row or the general time error
- **THEN** the error SHALL render an `ExclamationTriangleIcon` immediately before the error text, with no emoji character present

#### Scenario: Availability-confirmation validation error shows the triangle icon

- **WHEN** `AvailabilityPickerModal.vue`'s `confirmError` message is displayed
- **THEN** the error SHALL render an `ExclamationTriangleIcon` immediately before the error text, with no emoji character present

### Requirement: Activity location link uses MapPinIcon instead of a pin emoji

The activity detail view's location link SHALL render a `MapPinIcon` (from `@heroicons/vue/24/outline`) immediately before the location text, instead of the `📍` emoji character.

#### Scenario: Location link shows the map pin icon

- **WHEN** an activity has a `location` value set
- **THEN** the location link SHALL render a `MapPinIcon` immediately before the location text, with no emoji character present

### Requirement: Creator avatar fallback uses UserIcon instead of a star emoji

When an activity's creator has no `avatar_url`, the activity detail view SHALL render a `UserIcon` (from `@heroicons/vue/24/outline`) as the avatar placeholder, instead of the `⭐` emoji character.

#### Scenario: Creator has no avatar image

- **WHEN** `activity.creator.avatar_url` is falsy
- **THEN** the avatar placeholder SHALL render a `UserIcon`, with no emoji character present

#### Scenario: Creator has an avatar image

- **WHEN** `activity.creator.avatar_url` is truthy
- **THEN** the avatar image SHALL render as before (unaffected by this requirement)

### Requirement: Activity action success messages use a single shared DocumentCheckIcon, not per-message emoji

The activity detail view's success-message container SHALL render one `DocumentCheckIcon` (from `@heroicons/vue/24/outline`) alongside the success message text, and the underlying success message strings themselves SHALL NOT contain an emoji character (the `✅` prefix SHALL be removed from every success message string passed through the activity action flow).

#### Scenario: Any activity action success message renders with the shared icon and no embedded emoji

- **WHEN** an activity action (join, cancel join, confirm formation, cancel activity) completes successfully and its success message is displayed
- **THEN** the success-message container SHALL render exactly one `DocumentCheckIcon`, and the message text itself SHALL contain no `✅` character

##### Example: success messages after the emoji prefix is removed

| Action | Message text (before) | Message text (after) |
| --- | --- | --- |
| Join (fixed schedule) | `✅ 報名成功！` | `報名成功！` |
| Cancel join | `✅ 已取消報名` | `已取消報名` |
| Confirm formation | `✅ 成團成功！` | `成團成功！` |
| Cancel activity | `✅ 活動已取消` | `活動已取消` |

### Requirement: Nickname and email form-field icons use UserIcon and EnvelopeIcon instead of emoji

Form fields for nickname input SHALL render a `UserIcon` (from `@heroicons/vue/24/outline`) as the leading field icon instead of the `👤` emoji character. Form fields for email input SHALL render an `EnvelopeIcon` (from `@heroicons/vue/24/outline`) as the leading field icon instead of the `✉` character, across every screen where the email field icon appears (registration, login, and profile-edit account display).

#### Scenario: Registration form nickname field

- **WHEN** the registration form's nickname field is rendered
- **THEN** it SHALL show a `UserIcon` as its leading icon, with no emoji character present

#### Scenario: Registration form email field

- **WHEN** the registration form's email field is rendered
- **THEN** it SHALL show an `EnvelopeIcon` as its leading icon, with no `✉` character present

#### Scenario: Login form email field

- **WHEN** the login form's email field is rendered
- **THEN** it SHALL show an `EnvelopeIcon` as its leading icon, with no `✉` character present

#### Scenario: Profile-edit page email display

- **WHEN** the profile-edit page's account email display is rendered
- **THEN** it SHALL show an `EnvelopeIcon` as its leading icon, with no `✉` character present
