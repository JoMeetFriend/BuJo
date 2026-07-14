# activity-schedule-mode-switch Specification

## Purpose

Define the create-activity form schedule mode switch behavior, copy, accessibility, visual hierarchy, and preservation of existing activity creation contracts.

## Requirements

### Requirement: Event form schedule modes use textless switches

The activity creation form SHALL render the date mode and time mode controls as switch rows. Each row SHALL contain the question label, the current state hint text, and a textless switch control. The switch control SHALL NOT display option text inside the switch.

#### Scenario: Initial switch state

- **WHEN** the activity creation form is opened with default state
- **THEN** the date switch SHALL be checked and represent `dateMode = fixed`
- **THEN** the time switch SHALL be checked and represent `timeMode = fixed`

#### Scenario: Toggle switches to undecided modes

- **WHEN** the user turns off the date switch
- **THEN** the form SHALL set `dateMode = range`
- **WHEN** the user turns off the time switch
- **THEN** the form SHALL set `timeMode = vote`

#### Scenario: Toggle switches back to fixed modes

- **WHEN** the user turns on the date switch after it is off
- **THEN** the form SHALL set `dateMode = fixed`
- **WHEN** the user turns on the time switch after it is off
- **THEN** the form SHALL set `timeMode = fixed`

#### Scenario: Switch state colors are distinguishable

- **WHEN** a mode switch is checked
- **THEN** its track color SHALL be `#a8d0d1`
- **WHEN** a mode switch is unchecked
- **THEN** its track SHALL use a low-chroma pale gray-green color distinct from `#a8d0d1`
- **THEN** neither switch state SHALL rely on a black border for state distinction

---
### Requirement: Mode switches expose accessible switch semantics

Each mode switch SHALL use native checkbox semantics or equivalent switch semantics. If a non-native switch is used, it MUST expose `role="switch"` and a current checked state through accessible state. The control SHALL support focus-visible feedback and pointer or touch interaction.

#### Scenario: Assistive technology can identify the controls

- **WHEN** assistive technology inspects the date and time mode controls
- **THEN** each control SHALL expose a switch-like checked state and an accessible name derived from its row question

##### Example: default accessible state

- **GIVEN** the date mode is `fixed` and the time mode is `fixed`
- **WHEN** the controls are inspected
- **THEN** the date switch accessible name is `日期確定了嗎？` and its checked state is true
- **THEN** the time switch accessible name is `時間確定了嗎？` and its checked state is true

#### Scenario: Interaction feedback is available

- **WHEN** a pointer hovers, presses, or keyboard-focuses a switch
- **THEN** the switch SHALL provide visible interaction feedback

##### Example: focus feedback

- **GIVEN** the date switch receives keyboard focus
- **WHEN** focus is visible
- **THEN** the switch track displays a focus-visible outline or inset highlight

---
### Requirement: Mode hints and summary copy match selected modes

The activity creation form SHALL display short hint text next to each switch. The form SHALL display a combined schedule-mode summary only when at least one schedule mode is undecided. These copy strings SHALL update immediately when `dateMode` or `timeMode` changes. These copy strings SHALL NOT end with a full stop punctuation mark.

#### Scenario: Fixed date and fixed time copy

- **WHEN** `dateMode = fixed` and `timeMode = fixed`
- **THEN** the date hint SHALL be `日期確定了！`
- **THEN** the time hint SHALL be `時間確定了！`
- **THEN** the combined schedule-mode summary SHALL NOT be displayed

#### Scenario: Fixed date and voting time copy

- **WHEN** `dateMode = fixed` and `timeMode = vote`
- **THEN** the date hint SHALL be `日期確定了！`
- **THEN** the time hint SHALL be `還沒～選時段讓大家投票`
- **THEN** the summary SHALL be `日期確定了，還沒決定時間，選幾個時段讓大家投票`

#### Scenario: Voting date and fixed time copy

- **WHEN** `dateMode = range` and `timeMode = fixed`
- **THEN** the date hint SHALL be `還沒～選幾天讓大家投票`
- **THEN** the time hint SHALL be `時間確定了！`
- **THEN** the summary SHALL be `日期還沒決定，選幾天讓大家投票，時間維持固定`

#### Scenario: Voting date and voting time copy

- **WHEN** `dateMode = range` and `timeMode = vote`
- **THEN** the date hint SHALL be `還沒～選幾天讓大家投票`
- **THEN** the time hint SHALL be `還沒～選時段讓大家投票`
- **THEN** the summary SHALL be `日期、時間都還沒，選幾個日期＋時段讓大家投票`

---
### Requirement: Schedule mode area follows Modern Paper visual hierarchy

The schedule mode area SHALL preserve BuJo's paper-form visual language while reducing equal-weight boxes. It SHALL NOT rely on generic soft-card treatment, pale rounded helper strips, or soft shadows as the default schedule grouping style.

#### Scenario: Schedule area visual language

- **WHEN** the activity creation form renders the schedule mode area
- **THEN** the schedule controls, optional summary, and picker SHALL read as a paper-form section
- **THEN** the picker SHALL remain visually clearer than helper or summary text
- **THEN** the section SHALL NOT use a large rounded soft-card container as its primary visual treatment

---
### Requirement: Mode switch UI remains a frontend-only replacement

The schedule mode switch change SHALL preserve the existing activity creation payload, backend API contract, deadline calculation, scenario branching, and core activity creation behavior.

#### Scenario: Creating activities after switching modes

- **WHEN** the user creates an activity after changing date or time mode with the switches
- **THEN** the form SHALL submit through the existing creation flow for the selected mode without changing backend request shape beyond the already existing mode-dependent values

##### Example: scenario B still uses the existing flow

- **GIVEN** the date switch is on and the time switch is off
- **WHEN** the user submits a valid activity
- **THEN** the form uses the existing fixed-date voting-time branch for submission
